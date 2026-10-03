from pathlib import Path
import json,os,subprocess,sys,time
repo=Path(__file__).resolve().parents[3]
env={'PATH':os.defpath+':/usr/local/bin:/opt/homebrew/bin','HOME':str(Path.home())}
base=['docker','compose','--env-file','/dev/null','-f',str(repo/'docker-compose.test.yml')]
def run(args,check=True):return subprocess.run(args,cwd=repo,env=env,check=check,capture_output=True,text=True)
endpoint=run(['docker','context','inspect','--format','{{.Endpoints.docker.Host}}']).stdout.strip()
assert endpoint.startswith('unix://'),'Refusing nonlocal Docker host'
config=json.loads(run(base+['config','--format','json']).stdout)
assert config['name']=='somsing-phase1-test' and set(config['services'])=={'fixture-db'}
s=config['services']['fixture-db'];assert s['image']=='postgres:15-alpine'
assert s['environment']['POSTGRES_DB']=='somsing_fixture_db'
assert s['ports'][0]['host_ip']=='127.0.0.1' and str(s['ports'][0]['published'])=='55432'
assert config['volumes']['phase1-test-pgdata']['name']=='somsing_phase1_test_pgdata'
assert not run(base+['ps','-aq']).stdout.strip(),'Refusing preexisting fixture project'
volume=run(['docker','volume','inspect','somsing_phase1_test_pgdata'],False)
assert volume.returncode!=0 and 'no such volume' in volume.stderr.lower(),'Refusing existing or unavailable fixture volume'
owned=False
try:
 owned=True
 up=run(base+['up','-d','--no-deps','--pull','never','fixture-db']);print('Started dedicated fixture DB only')
 for attempt in range(20):
  health=run(base+['exec','-T','fixture-db','pg_isready','-U','fixture','-d','somsing_fixture_db'],False)
  if health.returncode==0:break
  time.sleep(1)
 else:raise SystemExit('Fixture DB readiness failed')

 if '--packaged-migrations' in sys.argv:
  import hashlib,tempfile,shutil,re,secrets
  assert sys.argv[1:]==['--packaged-migrations'],'Packaged mode cannot mix with other modes'
  protected_before={name:hashlib.sha256((repo/'admin-system/backend'/name).read_bytes()).hexdigest() for name in ['couriers_data.json','payment_methods_data.json']}
  model_env={**env,'POSTGRES_USER':'fixture','POSTGRES_PASSWORD':'fixture-only-not-a-shop-secret','POSTGRES_DB':'somsing_fixture_db','DB_PORT':'55432','JWT_SECRET':'fixture-packaging-only-signed-key-32chars'}
  for filename,service in [('docker-compose.yml','db'),('docker-compose.dev.yml','postgres')]:
   model=json.loads(subprocess.run(['docker','compose','--env-file','/dev/null','-f',str(repo/filename),'config','--format','json'],cwd=repo,env=model_env,check=True,capture_output=True,text=True).stdout)
   assert all(v['target']!='/docker-entrypoint-initdb.d' for v in model['services'][service]['volumes']),'Raw application SQL init mount remains'
   if filename=='docker-compose.yml':assert model['services']['backend']['build']['additional_contexts']['canonical_migrations']==str(repo/'admin-system/migrations')
   print('PACKAGING_CHECK PASS source Compose model '+filename,flush=True)
  with tempfile.TemporaryDirectory(prefix='somsing-packaging-',dir='/private/tmp') as directory:
   workspace=Path(directory);clean=workspace/'backend';clean.mkdir();canonical=workspace/'canonical';shutil.copytree(repo/'admin-system/migrations',canonical)
   backend=repo/'admin-system/backend'
   # Only Go sources/module files and public assets enter the disposable build context.
   for source in backend.rglob('*.go'):
    if source.is_symlink() or any(part in ['uploads','.git','node_modules','tmp','bin'] for part in source.relative_to(backend).parts):continue
    target=clean/source.relative_to(backend);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
   for name in ['go.mod','go.sum','Dockerfile','.dockerignore']:shutil.copyfile(backend/name,clean/name)
   shutil.copytree(backend/'assets',clean/'assets')
   for name in ['couriers_data.json','payment_methods_data.json']:(clean/name).write_text('[]\n')
   assert not list(clean.rglob('.env*')),'Environment file entered disposable context'
   registered=re.findall(r'"([^"\n]+\.sql)"',(backend/'db/db.go').read_text().split('var MigrationFiles = []string{',1)[1].split('\n}',1)[0]);assert len(registered)==44
   hashes={name:hashlib.sha256((canonical/name).read_bytes()).hexdigest() for name in registered}
   tag='codex-test-somsing-packaging:'+secrets.token_hex(8);container_id=None;image_id=None
   assert run(['docker','image','inspect',tag],False).returncode!=0,'Test image tag already exists'
   try:
    subprocess.run(['docker','buildx','build','--load','--build-context','canonical_migrations='+str(canonical),'-f',str(clean/'Dockerfile'),'-t',tag,str(clean)],cwd=workspace,env=env,check=True)
    image_id=run(['docker','image','inspect',tag,'--format','{{.Id}}']).stdout.strip();assert image_id.startswith('sha256:')
    created=run(['docker','create','--network','none','--read-only','--entrypoint','/bin/true','--label','somsing.phase1.packaging-owned='+workspace.name,tag]);container_id=created.stdout.strip();assert container_id
    assert run(['docker','inspect',container_id,'--format','{{.State.Running}}']).stdout.strip()=='false','Image extraction container unexpectedly running'
    extracted=workspace/'extracted';extracted.mkdir();run(['docker','cp',container_id+':/app/migrations',str(extracted)])
    run(['docker','rm',container_id]);assert run(['docker','inspect',container_id],False).returncode!=0;container_id=None
    for name,sha in hashes.items():assert hashlib.sha256((extracted/'migrations'/name).read_bytes()).hexdigest()==sha,'Packaged canonical SQL mismatch '+name
    provenance={'image_id':image_id,'tag':tag,'registered_hashes':hashes};(workspace/'image-provenance.json').write_text(json.dumps(provenance))
    print('PACKAGING_IMAGE_JSON '+json.dumps(provenance),flush=True)
    print('PACKAGING_CHECK PASS extracted44 registered canonical hashes; stopped container removed; business CMD not run',flush=True)
    command=[sys.executable,str(backend/'tests/run-phase1.py'),'--fixture-dsn','postgres://fixture:fixture-only-not-a-shop-secret@127.0.0.1:55432/somsing_fixture_db?sslmode=disable&connect_timeout=5','--packaged-migrations-dir',str(extracted/'migrations')]
    subprocess.run(command,cwd=repo,env=env,check=True)
   finally:
    if container_id:run(['docker','rm',container_id])
    if run(['docker','image','inspect',tag],False).returncode==0:run(['docker','image','rm',tag])
    assert run(['docker','image','inspect',tag],False).returncode!=0,'Owned test image remains'
   print('PACKAGING_CHECK PASS owned extraction container/test image removed',flush=True)
  assert all(hashlib.sha256((backend/name).read_bytes()).hexdigest()==sha for name,sha in protected_before.items()),'Protected JSON changed'
  print('PACKAGING_CHECK PASS owned build/extracted source/workspace removed; protected hashes unchanged '+json.dumps(protected_before),flush=True)
  raise SystemExit(0)

 if '--connected' in sys.argv:
  import hashlib
  protected_names=['couriers_data.json','payment_methods_data.json']
  protected_before={name:hashlib.sha256((repo/'admin-system/backend'/name).read_bytes()).hexdigest() for name in protected_names}
  import tempfile,shutil,secrets,socket,urllib.request,urllib.error,argparse,concurrent.futures
  parser=argparse.ArgumentParser();parser.add_argument('--connected',action='store_true');parser.add_argument('--ui-origin',required=True);parser.add_argument('--connected-checks',action='store_true');options=parser.parse_args()
  with tempfile.TemporaryDirectory(prefix='somsing-connected-',dir='/private/tmp') as directory:
   workspace=Path(directory);(workspace/'home').mkdir();(workspace/'uploads').mkdir();(workspace/'migrations').mkdir()
   schema='phase1_connected_'+secrets.token_hex(8);(workspace/'owner-schema').write_text(schema);(workspace/'jwt-key').write_text(secrets.token_hex(32));os.chmod(workspace/'jwt-key',0o600)
   for name in ['000010_create_finance_tables.up.sql','000011_seed_chart_of_accounts.up.sql']:shutil.copyfile(repo/'admin-system/backend/migrations'/name,workspace/'migrations'/name)
   shutil.copyfile(repo/'admin-system/migrations/024_idempotency_and_order_persistence.sql',workspace/'migrations/024_idempotency_and_order_persistence.sql')
   build={'PATH':'/usr/local/go/bin:/usr/bin:/bin','HOME':str(workspace/'home'),'TMPDIR':directory,'GOCACHE':str(workspace/'cache'),'GOMODCACHE':str(Path.home()/'go/pkg/mod'),'GOPROXY':'off','GOSUMDB':'off','GOTOOLCHAIN':'local'}
   binary=workspace/'connected-server';subprocess.run(['/usr/local/go/bin/go','build','-o',str(binary),'./cmd/fixture-server'],cwd=repo/'admin-system/backend',env=build,check=True)
   with socket.socket() as listener:listener.bind(('127.0.0.1',0));port=listener.getsockname()[1]
   origin='http://127.0.0.1:'+str(port)
   runtime={'PATH':os.defpath,'HOME':str(workspace/'home'),'TMPDIR':directory,'ENVIRONMENT':'test','TEST_FIXTURE_DSN':'postgres://fixture:fixture-only-not-a-shop-secret@127.0.0.1:55432/somsing_fixture_db?sslmode=disable&connect_timeout=5'}
   child=None
   def start():
    global child
    child=subprocess.Popen([str(binary),'-connected','-port',str(port),'-workspace',directory,'-ui-origin',options.ui_origin],cwd=workspace,env=runtime)
    for attempt in range(100):
     if child.poll() is not None:raise RuntimeError('connected fixture child exited before ready')
     try:
      with urllib.request.urlopen(origin+'/fixture/health',timeout=1) as response:health=json.load(response)
      if health.get('pid')==child.pid:return health
     except (OSError,urllib.error.URLError):pass
     time.sleep(.1)
    raise RuntimeError('owned connected startup timeout')
   tokens={}
   def request(method,path,payload=None,role='admin',drop=False):
    data=payload if isinstance(payload,bytes) else None if payload is None else json.dumps(payload).encode()
    headers={'Content-Type':'application/json'}
    if role in tokens:headers['Authorization']='Bearer '+tokens[role]
    if drop:headers['X-Fixture-Drop-Response']='after-commit'
    req=urllib.request.Request(origin+path,data=data,headers=headers,method=method)
    try:
     with urllib.request.urlopen(req,timeout=8) as response:raw=response.read();return response.status,json.loads(raw) if raw else None
    except urllib.error.HTTPError as response:return response.code,json.loads(response.read())
   def check(label,condition):
    if not condition:raise AssertionError(label)
    print('CONNECTED_CHECK PASS '+label,flush=True)
   try:
    health=start();print('CONNECTED_FIXTURE_JSON '+json.dumps(health),flush=True)
    if options.connected_checks:
     for role in ['admin','manager','sales','finance','prepress']:
      status,body=request('POST','/api/auth/login',{'username':'fixture_'+role,'password':'Fixture-phase1-only!'},role='anonymous');check('actual bcrypt login '+role,status==200 and body['role']==role);tokens[role]=body['token']
     check('anonymous quotation401',request('GET','/api/v1/quotations',role='anonymous')[0]==401)
     check('scoped unknown route403',request('POST','/api/shop-external',{},role='admin')[0]==403)
     try:urllib.request.urlopen(urllib.request.Request(origin+'/fixture/health',headers={'Origin':'https://outside.invalid'}));outside_code=200
     except urllib.error.HTTPError as response:outside_code=response.code
     check('outside browser origin403',outside_code==403)
     check('prepress save403',request('POST','/api/v1/quotations',{},role='prepress')[0]==403)
     check('sales manager action403',request('POST','/api/v1/quotations/fixture-legacy/approve',{},role='sales')[0]==403)
     check('manager finance403',request('POST','/api/v1/finance/verify-slip',{'order_id':'fixture-payment-ok','status':'APPROVED'},role='manager')[0]==403)
     saved=[]
     for name in ['P1_SAVED_BATCH_DTO','P1_SAVED_CONFIRM_DTO']:
      path=os.environ.get(name);check('exact captured DTO supplied '+name,bool(path));raw=Path(path).read_bytes();original=json.loads(raw)
      status,quote=request('POST','/api/v1/quotations',raw,role='sales');check('actual captured save '+name,status==200 and quote['committed'] and quote['total_cost']==original['total_cost'] and quote['total_selling_price']==original['total_selling_price']);saved.append(quote)
     quote=saved[0];body={'expected_updated_at':quote['updated_at'],'expected_total_selling_price':quote['total_selling_price']}
     lost=False
     try:request('POST','/api/v1/quotations/'+quote['id']+'/convert',body,role='sales',drop=True)
     except (OSError,urllib.error.URLError,__import__('http.client').client.RemoteDisconnected):lost=True
     check('actual committed conversion acknowledgment lost',lost)
     status,converted=request('POST','/api/v1/quotations/'+quote['id']+'/convert',body,role='sales');check('unknown-response canonical retry200',status==200 and converted['replayed'] and converted['data']['total_amount_lak']==quote['total_selling_price']);order_id=converted['order_id']
     check('captured batch net-unit/subtotal preserved',all(job['unit_cost_lak']==quote['items'][i]['unit_cost_lak'] and job['total_price_lak']==quote['items'][i]['total_price_lak'] for i,job in enumerate(converted['data']['items'])))
     confirm=saved[1];status,confirm_order=request('POST','/api/v1/quotations/'+confirm['id']+'/convert',{'expected_updated_at':confirm['updated_at'],'expected_total_selling_price':confirm['total_selling_price']},role='sales')
     check('actual captured confirm conversion money/items',status==201 and confirm_order['data']['total_cost']==confirm['total_cost'] and confirm_order['data']['total_amount_lak']==confirm['total_selling_price'] and all(job['unit_cost_lak']==confirm['items'][i]['unit_cost_lak'] and job['total_price_lak']==confirm['items'][i]['total_price_lak'] for i,job in enumerate(confirm_order['data']['items'])))
     status,quotes=request('GET','/api/v1/quotations',role='sales');legacy=next(q for q in quotes if q['id']=='fixture-legacy')
     check('legacy conversion422',request('POST','/api/v1/quotations/fixture-legacy/convert',{},role='sales')[0]==422)
     legacy.update(total_cost=1500,shipping_fee=125,snapshot_completion_reason='Connected synthetic manager review',commercial_snapshot={'version':1,'currency':'LAK','total_cost_lak':1500,'final_total_lak':2600,'discounted_subtotal_lak':2250,'tax_amount_lak':225,'shipping_fee_lak':125,'setup_fee_lak':0,'packaging_cost_lak':0})
     check('sales legacy completion403',request('PUT','/api/v1/quotations/fixture-legacy',legacy,role='sales')[0]==403)
     status,reviewed=request('PUT','/api/v1/quotations/fixture-legacy',legacy,role='manager');check('actual manager completion audited provenance',status==200 and reviewed['cost_review']['source']=='manager_reviewed')
     status,legacyOrder=request('POST','/api/v1/quotations/fixture-legacy/convert',{},role='sales');check('reviewed legacy conversion201',status==201)
     status,decision=request('POST','/api/v1/quotations/fixture-legacy/approve',{},role='manager');check('actual manager decision committed',status==200 and decision['committed'])
     lost=False
     try:request('POST','/api/v1/finance/verify-slip',{'order_id':'fixture-payment-ok','status':'APPROVED'},role='finance',drop=True)
     except (OSError,urllib.error.URLError,__import__('http.client').client.RemoteDisconnected):lost=True
     check('actual committed payment acknowledgment lost',lost)
     check('duplicate manual payment409',request('POST','/api/v1/finance/verify-slip',{'order_id':'fixture-payment-ok','status':'APPROVED'},role='finance')[0]==409)
     status,paid=request('GET','/fixture/inspect/fixture-payment-ok');check('durable one payment journal and audit',status==200 and paid['status']=='PAID_PREPRESS' and paid['deposit']==1500.25 and paid['remaining']==0 and paid['journals']==1 and paid['journal_lines']==2 and paid['review_audits']==1 and paid['debits']==1500.25 and paid['credits']==1500.25)
     for stage in ['audit','journal']:
      identity='fixture-payment-'+stage
      check('enable owned '+stage+' fault',request('POST','/fixture/fault',{'stage':stage,'order_id':identity,'enabled':True})[0]==200)
      check('actual '+stage+' write failure500',request('POST','/api/v1/finance/verify-slip',{'order_id':identity,'status':'APPROVED'},role='finance')[0]==500)
      _,state=request('GET','/fixture/inspect/'+identity);check('actual '+stage+' rollback across order/journal/audit',state['status']=='PENDING_SLIP_CHECK' and state['deposit']==0 and state['remaining']==1500.25 and state['journals']==0 and state['journal_lines']==0 and state['review_audits']==0)
      request('POST','/fixture/fault',{'stage':stage,'order_id':identity,'enabled':False})
     with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:codes=list(executor.map(lambda _:request('POST','/api/v1/finance/verify-slip',{'order_id':'fixture-payment-audit','status':'APPROVED'},role='finance')[0],range(2)))
     check('real PG concurrent manual review200+409',sorted(codes)==[200,409])
     _,state=request('GET','/fixture/inspect/fixture-payment-audit');check('concurrent exactly one journal/audit',state['journals']==1 and state['journal_lines']==2 and state['review_audits']==1)
     # Private original bytes survive an actual server OS process restart.
     req=urllib.request.Request(origin+'/uploads/artworks/sample_document.pdf',headers={'Authorization':'Bearer '+tokens['sales']})
     with urllib.request.urlopen(req) as response:original_bytes=response.read()
     boundary='OwnedBoundary'+secrets.token_hex(8)
     multipart=('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="connected-original.pdf"\r\nContent-Type: application/pdf\r\n\r\n').encode()+original_bytes+('\r\n--'+boundary+'--\r\n').encode()
     upload=urllib.request.Request(origin+'/api/v1/upload/artwork',data=multipart,headers={'Authorization':'Bearer '+tokens['sales'],'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
     with urllib.request.urlopen(upload) as response:uploaded=json.load(response)
     check('actual authenticated original upload',uploaded['status']=='success' and bool(uploaded['url']))
     oldpid=child.pid;check('request owned process restart',request('POST','/fixture/restart',{})[0]==200);child.wait(timeout=5);health=start();check('actual new server PID',health['pid']!=oldpid)
     status,replayed=request('POST','/api/v1/quotations/'+quote['id']+'/convert',body,role='sales');check('OS restart same canonical order readback',status==200 and replayed['order_id']==order_id and replayed['data']['total_amount_lak']==quote['total_selling_price'])
     _,paid=request('GET','/fixture/inspect/fixture-payment-ok');check('OS restart payment/journal persisted',paid['deposit']==1500.25 and paid['journals']==1 and paid['review_audits']==1)
     req=urllib.request.Request(origin+uploaded['url'],headers={'Authorization':'Bearer '+tokens['sales']})
     with urllib.request.urlopen(req) as response:after_bytes=response.read()
     check('authenticated original bytes after OS restart',after_bytes==original_bytes)
     print('CONNECTED_ORIGINAL_JSON '+json.dumps({'bytes':len(original_bytes),'before_sha256':hashlib.sha256(original_bytes).hexdigest(),'after_sha256':hashlib.sha256(after_bytes).hexdigest(),'original_url':uploaded['url']}),flush=True)
     print('CONNECTED_RESTART_JSON '+json.dumps({'old_pid':oldpid,'new_pid':health['pid'],'same_order_id':order_id,'paid_journals':paid['journals'],'paid_audits':paid['review_audits']}),flush=True)
     check('normal stop',request('POST','/fixture/stop',{})[0]==200);child.wait(timeout=5)
    else:
     while True:
      code=child.wait()
      if code!=0:raise RuntimeError('connected fixture child failed with exit '+str(code))
      if (workspace/'stop').exists():break
      health=start();print('CONNECTED_FIXTURE_JSON '+json.dumps(health),flush=True)
   finally:
    if child is not None and child.poll() is None:
     child.terminate()
     try:child.wait(timeout=5)
     except subprocess.TimeoutExpired:child.kill();child.wait()
  assert all(hashlib.sha256((repo/'admin-system/backend'/name).read_bytes()).hexdigest()==sha for name,sha in protected_before.items()),'Protected JSON changed'
  print('Connected owned workspace/key/storage/binary removed; protected hashes unchanged '+json.dumps(protected_before),flush=True)
  raise SystemExit(0)

 focused='--focused-db' in sys.argv
 if focused:
  source=(repo/'admin-system/backend/migrations/035_create_system_lookups_and_machinery_wear_parts.sql').read_text()
  function=source[source.index('CREATE OR REPLACE FUNCTION trigger_set_timestamp()'):source.index('$$ LANGUAGE plpgsql;')+len('$$ LANGUAGE plpgsql;')]
  tables=source[source.index('CREATE TABLE IF NOT EXISTS machine_wear_parts ('):source.index('-- 3. Extend printers')]
  ddl="CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE TABLE IF NOT EXISTS printers(asset_id VARCHAR(50) PRIMARY KEY); INSERT INTO printers(asset_id) VALUES('PRN-9614'),('PRN-6317') ON CONFLICT DO NOTHING;"+function+tables
  for repeat in range(2):
   subprocess.run(base+['exec','-T','fixture-db','psql','-v','ON_ERROR_STOP=1','-U','fixture','-d','somsing_fixture_db'],cwd=repo,env=env,input=ddl,text=True,check=True,capture_output=True)
  print('Focused fixture only: real035 wear table/trigger DDL reapplied twice; two synthetic printer IDs')
 # Explicit fixture-only credentials; not loaded from environment/config files.
 command=[sys.executable,str(repo/'admin-system/backend/tests/run-phase1.py'),'--fixture-dsn','postgres://fixture:fixture-only-not-a-shop-secret@127.0.0.1:55432/somsing_fixture_db?sslmode=disable&connect_timeout=5']
 if focused:command.append('--focused-db')
 for key in ['P1_SAVED_BATCH_DTO','P1_SAVED_CONFIRM_DTO']:
  if key in os.environ:env[key]=os.environ[key]
 result=subprocess.run(command,cwd=repo,env=env)
 raise SystemExit(result.returncode)
finally:
 if 'protected_before' in globals():
  assert all(hashlib.sha256((repo/'admin-system/backend'/name).read_bytes()).hexdigest()==sha for name,sha in protected_before.items()),'Protected JSON changed during scoped fixture run'
 if owned:
  result=run(base+['down','--volumes'],False)
  if result.returncode!=0:print('Fixture cleanup failure',result.stderr);raise SystemExit(1)
  assert not run(base+['ps','-aq']).stdout.strip(),'Fixture containers remain'
  absent=run(['docker','volume','inspect','somsing_phase1_test_pgdata'],False)
  assert absent.returncode!=0 and 'no such volume' in absent.stderr.lower(),'Fixture volume absence not confirmed'
  print('Dedicated fixture DB/container/network/test volume removed')
