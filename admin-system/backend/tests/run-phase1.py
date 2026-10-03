"""Compile selected package test binaries before executing init in isolated storage.
No business binary, environment loading, provider network, or full Go suite.
"""
import argparse,hashlib,json,os,pathlib,re,shutil,subprocess,tempfile,urllib.parse
p=argparse.ArgumentParser();p.add_argument('--fixture-dsn');p.add_argument('--focused-db',action='store_true');p.add_argument('--packaged-migrations-dir');args=p.parse_args()
backend=pathlib.Path(__file__).resolve().parents[1]
patterns={
 'finance':r'^Test(SlipProviderContract|HandleVerifySlip.*|CallSlipOKAPI.*|ManualPayment.*|ManualApproval.*|AutomaticSlip.*|PendingSlips.*)$',
 'db':r'^Test(ParseAndValidateDSN|InitDB_TestModeNeverUsesBusinessDSN|ExtractUpSection|MigrationSequence_035Precedes036|Migration009_NoUUIDMismatch|Migration043_UniquePartialIndex)$',
 'settings':r'^Test(MachineWearPartCostRateCalculation|CutterAndLaminatorWearRateUnits|WearPartThresholdAndUsage|WearPartsHandlersValidation|MachineWearPartJSONSerialization|WearPartsInputValidations)$',
 'auth':r'^Test(RequireAuth.*|HandleRefreshToken.*|ValidateJWTSecretOnStartup.*|.*JWT.*)$',
 'orders':r'^Test(ArtworkMetadata.*|OrderOwnership.*|CreateOrderIdempotency|QuotationParts(Contract|PersistedQuotation)|OrderUploadValidationAndDraftPreservation|ProtectedFileServing_U2_AuthorizationBoundaries|QuotationApproval.*|QuotationRejection.*|QuotationSavedConversion(Contract|Failures|SaveFailures|ActualFrontendDTO)|MarginGuardAndApprovalWorkflow)$',
 '.':r'^TestActualRegisteredPrivateRoutes_AuthBoundaries$',
}
if args.fixture_dsn:
 u=urllib.parse.urlsplit(args.fixture_dsn)
 if u.scheme not in ['postgres','postgresql'] or u.hostname not in ['localhost','127.0.0.1'] or u.port!=55432 or u.path!='/somsing_fixture_db' or u.fragment:raise SystemExit('Refusing unsafe fixture DSN')
 for k,v in urllib.parse.parse_qsl(u.query,strict_parsing=True):
  if (k,v) not in [('sslmode','disable'),('connect_timeout','5')]:raise SystemExit('Refusing fixture DSN option')
 patterns['db']=r'^Test(ParseAndValidateDSN|InitDB_TestModeNeverUsesBusinessDSN|ExtractUpSection|MigrationSequence_035Precedes036|Migration009_NoUUIDMismatch|Migration043_UniquePartialIndex|VerifyLegacyBaseline_Evaluation|RunMigrations_LiveDB_CleanNoPending|Migration043_IsolatedFixture|Migration016_LegacyCompatibility|Migration042_ExistingParentsAndFinance)$'
 patterns['settings']=r'^Test(MachineWearPartCostRateCalculation|CutterAndLaminatorWearRateUnits|WearPartThresholdAndUsage|WearPartsHandlersValidation|MachineWearPartJSONSerialization|WearPartsInputValidations|WearPartsDatabaseLifecycleAndWrongAsset)$'
if args.fixture_dsn:
 patterns['orders']=patterns['orders'].replace('ActualFrontendDTO)', 'ActualFrontendDTO|Postgres)')
if args.focused_db:
 patterns['db']=r'^Test(ParseAndValidateDSN|InitDB_TestModeNeverUsesBusinessDSN|ExtractUpSection|MigrationSequence_035Precedes036|Migration009_NoUUIDMismatch|Migration043_UniquePartialIndex|Migration043_IsolatedFixture)$'
if args.packaged_migrations_dir:
 if not args.fixture_dsn or args.focused_db:raise SystemExit('Packaged checks require guarded DSN only')
 packaged=pathlib.Path(args.packaged_migrations_dir).resolve(strict=True)
 owner=packaged.parent.parent
 if packaged.name!='migrations' or packaged.parent.name!='extracted' or not str(owner).startswith('/private/tmp/somsing-packaging-'):raise SystemExit('Refusing unowned packaged migration path')
 provenance=json.loads((owner/'image-provenance.json').read_text())
 if not provenance['image_id'].startswith('sha256:'):raise SystemExit('Missing owned image identity')
 for name,sha in provenance['registered_hashes'].items():
  if hashlib.sha256((packaged/name).read_bytes()).hexdigest()!=sha:raise SystemExit('Packaged migration drift')
 patterns={'db':r'^Test(InitDB_TestModeNeverUsesBusinessDSN|ExtractUpSection|PackagedMigrations_RepeatUnchanged|InitDB_MigrationFailureClosesPool|InitDB_UnavailableFixture)$','.':r'^TestStartupDBFailureGuard$'}
def protected():
 result={}
 for name in ['couriers_data.json','payment_methods_data.json']:
  data=(backend/name).read_bytes()
  if not data:raise SystemExit('Protected JSON unexpectedly empty')
  result[name]=hashlib.sha256(data).hexdigest()
 return result
before=protected();failed=False;summary={}
try:
 with tempfile.TemporaryDirectory(prefix='somsing-phase1-',dir='/private/tmp') as directory:
  tmp=pathlib.Path(directory)
  for n in ['home','cwd','uploads']:(tmp/n).mkdir()
  if args.focused_db and not args.fixture_dsn:raise SystemExit('--focused-db requires guarded fixture DSN')
  # Migration content reads resolve to this fixture copy, never repository cwd.
  shutil.copytree(packaged if args.packaged_migrations_dir else backend.parent/'migrations',tmp/'migrations')
  shutil.copyfile(backend/'main.go',tmp/'startup-main.go')
  build={'PATH':os.defpath,'HOME':str(tmp/'home'),'TMPDIR':directory,'GOCACHE':str(tmp/'cache'),'GOMODCACHE':str(pathlib.Path.home()/'go/pkg/mod'),'GOPROXY':'off','GOSUMDB':'off','GOTOOLCHAIN':'local'}
  go=shutil.which('go') or '/usr/local/go/bin/go'
  binaries={}
  for package in patterns:
   binary=tmp/(package.replace('.','root')+'.test');binaries[package]=binary
   subprocess.run([go,'test','-c','-o',str(binary),'./'+package if package!='.' else '.'],cwd=backend,env=build,check=True)
  runtime={'PATH':os.defpath,'HOME':str(tmp/'home'),'TMPDIR':directory,'UPLOAD_STORAGE_DIR':str(tmp/'uploads'),'ENVIRONMENT':'test','JWT_SECRET':'fixture-phase1-signed-secret-only-32-chars'}
  if args.fixture_dsn:runtime['TEST_FIXTURE_DSN']=args.fixture_dsn
  runtime['P1_STARTUP_SOURCE']=str(tmp/'startup-main.go')
  for key in ['P1_SAVED_BATCH_DTO','P1_SAVED_CONFIRM_DTO']:
   if key in os.environ:runtime[key]=os.environ[key]
  for package,pattern in patterns.items():
   if args.fixture_dsn and package=='db' and not args.focused_db:
    bootstrap=subprocess.run([str(binaries[package]),'-test.run=^TestRunMigrations_LiveDB_CleanNoPending$','-test.v','-test.count=1'],cwd=tmp/'cwd',env=runtime,capture_output=True,text=True)
    print(bootstrap.stdout,end='');print(bootstrap.stderr,end='')
    if bootstrap.returncode!=0:raise SystemExit('Isolated migration bootstrap failed; remaining database checks not run')
   result=subprocess.run([str(binaries[package]),'-test.run='+pattern,'-test.v','-test.count=1'],cwd=tmp/'cwd',env=runtime,capture_output=True,text=True)
   print(result.stdout,end='');print(result.stderr,end='')
   skipped='--- SKIP:' in result.stdout
   summary[package]={'exit':result.returncode,'top_pass':len(re.findall(r'^--- PASS:',result.stdout,re.M)),'nested_pass':len(re.findall(r'^\s+--- PASS:',result.stdout,re.M)),'skipped':skipped}
   failed|=result.returncode!=0 or skipped or summary[package]['top_pass']==0
   if args.focused_db and package=='db':failed|='--- PASS: TestMigration043_IsolatedFixture' not in result.stdout
   if args.focused_db and package=='settings':failed|='--- PASS: TestWearPartsDatabaseLifecycleAndWrongAsset' not in result.stdout
finally:
 if protected()!=before:raise SystemExit('Protected JSON hash changed')
 print('Protected nonempty hashes unchanged:',json.dumps(before))
 print('Fixture cwd/HOME/uploads/binaries removed; provider transport stubs only; no notification dispatcher initialized')
print('Selected Phase1 checks:',json.dumps(summary,sort_keys=True))
raise SystemExit(1 if failed else 0)
