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

 if '--packaged-migrations' in sys.argv or '--actual-image-startup' in sys.argv:
  import hashlib,tempfile,shutil,re,secrets
  actual_startup='--actual-image-startup' in sys.argv
  assert sys.argv[1:]==['--actual-image-startup' if actual_startup else '--packaged-migrations'],'Packaged mode cannot mix with other modes'
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
   registered=re.findall(r'"([^"\n]+\.sql)"',(backend/'db/db.go').read_text().split('var MigrationFiles = []string{',1)[1].split('\n}',1)[0]);assert len(registered)==46
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
    print('PACKAGING_CHECK PASS extracted46 registered canonical hashes; stopped extraction container removed',flush=True)
    if actual_startup:
     import re
     network='somsing-startup-'+secrets.token_hex(8);case_ids=[];runtime_results=[]
     db_id=run(base+['ps','-q','fixture-db']).stdout.strip();assert db_id
     assert run(['docker','network','inspect',network],False).returncode!=0
     network_created=False;db_connected=False
     default_dsn='postgres://fixture:fixture-only-not-a-shop-secret@fixture-db:5432/somsing_fixture_db?sslmode=disable&connect_timeout=2'
     schema='phase1_runtime_'+secrets.token_hex(8)
     def sql(query):return run(base+['exec','-T','fixture-db','psql','-v','ON_ERROR_STOP=1','-U','fixture','-d','somsing_fixture_db','-Atc',query]).stdout.strip()
     def http(container,path,body=None,token=None,method=None):
      if method=='PUT':
       import io,http.client,types
       payload=json.dumps(body).encode()
       wire=('PUT '+path+' HTTP/1.1\r\nHost: 127.0.0.1:8080\r\nConnection: close\r\nContent-Type: application/json\r\nAuthorization: Bearer '+token+'\r\nContent-Length: '+str(len(payload))+'\r\n\r\n').encode()+payload
       result=subprocess.run(['docker','exec','-i',container,'nc','-w','2','127.0.0.1','8080'],cwd=repo,env=env,input=wire,capture_output=True)
       response=http.client.HTTPResponse(types.SimpleNamespace(makefile=lambda *args:io.BytesIO(result.stdout)));response.begin()
       return response.status,json.loads(response.read())
      # Probe the actual HTTP listener without opening an egress path or host port.
      command=['docker','exec',container,'wget','-S','-O','-','-T','1','--header=Content-Type: application/json']
      if token:command+=['--header=Authorization: Bearer '+token]
      if body is not None:command+=['--post-data='+json.dumps(body)]
      response=run(command+['http://127.0.0.1:8080'+path],False)
      statuses=re.findall(r'HTTP/1\.[01] (\d{3})',response.stderr)
      if not statuses:raise OSError('Actual container HTTP listener unavailable')
      status=int(statuses[-1]);payload=json.loads(response.stdout) if response.stdout.strip() else None
      return status,payload
     def launch(label,dsn=default_dsn,key='Fixture-runtime-only-strong-signed-key-32chars',missing=False):
      storage=workspace/('storage-'+label);storage.mkdir()
      command=['docker','run','-d','--network',network,'--label','somsing.phase1.startup-owned='+workspace.name,'--mount','type=bind,source='+str(storage)+',target=/app/uploads','-e','ENVIRONMENT=production','-e','JWT_SECRET='+key,'-e','DATABASE_URL='+dsn,'-e','PORT=8080','-e','UPLOAD_STORAGE_DIR=/app/uploads']
      if missing:
       empty=workspace/'empty-runtime-migrations';empty.mkdir();command+=['--mount','type=bind,source='+str(empty)+',target=/app/migrations,readonly']
      cid=run(command+[tag]).stdout.strip();case_ids.append(cid)
      info=json.loads(run(['docker','inspect',cid]).stdout)[0]
      assert set(info['NetworkSettings']['Networks'])=={network},'Unexpected network/egress path'
      passed_env=dict(x.split('=',1) for x in info['Config']['Env'])
      assert passed_env['ENVIRONMENT']=='production'
      assert all(not value for name,value in passed_env.items() if any(word in name for word in ['TOKEN','SLIPOK','LINE_CHANNEL','SMTP','WHATSAPP','TELEGRAM'])),'Provider credentials entered runtime'
      assert not info['HostConfig']['PortBindings'],'Runtime unexpectedly publishes host ports'
      origin=cid
      return cid,origin
     try:
      run(['docker','network','create','--internal','--label','somsing.phase1.startup-owned='+workspace.name,network]);network_created=True
      assert json.loads(run(['docker','network','inspect',network]).stdout)[0]['Internal'] is True
      run(['docker','network','connect','--alias','fixture-db',network,db_id]);db_connected=True
      cid,origin=launch('success');deadline=time.monotonic()+30;health=None
      while time.monotonic()<deadline:
       if run(['docker','inspect',cid,'--format','{{.State.Running}}']).stdout.strip()!='true':break
       try:
        status,health=http(origin,'/health')
        if status==200 and health.get('database')=='connected':break
       except (OSError,ValueError):pass
       time.sleep(.1)
      success_logs=run(['docker','logs',cid]);print('STARTUP_LOG_JSON '+json.dumps({'case':'success','text':success_logs.stdout+success_logs.stderr}),flush=True)
      assert health and status==200 and health['database']=='connected','Actual image failed to become healthy with owned DB'
      assert sql('SELECT count(*) FROM schema_migrations')=='46'
      sql("CREATE EXTENSION IF NOT EXISTS pgcrypto; INSERT INTO admin_users(id,username,password_hash,fullname,role,is_active) VALUES('fixture-runtime-admin','fixture_runtime_admin',crypt('Fixture-runtime-only!',gen_salt('bf')),'Owned Runtime Admin','admin',true)")
      status,login=http(origin,'/api/v1/auth/login',{'username':'fixture_runtime_admin','password':'Fixture-runtime-only!'});assert status==200 and login['role']=='admin';token=login['token']
      assert http(origin,'/api/v1/quotations')[0]==401
      authenticated_status=http(origin,'/api/v1/admin/users',token=token)[0];assert authenticated_status==200
      quotation_status,quotation_body=http(origin,'/api/v1/quotations',token=token)
      assert quotation_status==200,'Actual canonical quotation read failed'
      migration044=(extracted/'migrations/044_quotation_artwork_references.sql').read_text()
      legacy_schema='phase1_reference_'+secrets.token_hex(8)
      # Execute extracted real SQL against an owned representative pre-044 table.
      sql('BEGIN; CREATE SCHEMA '+legacy_schema+'; SET LOCAL search_path TO '+legacy_schema+"; CREATE TABLE quotations(quotation_id text PRIMARY KEY,customer_name text NOT NULL,total_cost numeric); INSERT INTO quotations VALUES('legacy-owned','Owned Legacy',12.34); "+migration044+' COMMIT;')
      legacy_before=sql('SELECT row_to_json(q)::text FROM '+legacy_schema+'.quotations q')
      assert json.loads(legacy_before)=={'quotation_id':'legacy-owned','customer_name':'Owned Legacy','total_cost':12.34,'artwork_url':None,'digital_proof_url':None}
      sql("UPDATE "+legacy_schema+".quotations SET artwork_url='/owned/original.pdf',digital_proof_url='/owned/proof.pdf'")
      legacy_references=sql('SELECT row_to_json(q)::text FROM '+legacy_schema+'.quotations q')
      sql('BEGIN; SET LOCAL search_path TO '+legacy_schema+'; '+migration044+migration044+' COMMIT;')
      assert sql('SELECT row_to_json(q)::text FROM '+legacy_schema+'.quotations q')==legacy_references
      sql('DROP SCHEMA '+legacy_schema+' CASCADE')
      runtime_results.append({'case':'migration044_legacy','missing_columns_added':True,'existing_row_preserved':True,'existing_references_repeat_preserved':True,'sql_source':'extracted_actual_image'})
      migration045=(extracted/'migrations/045_quotation_id_uniqueness.sql').read_text()
      for label,index_ddl in [('full_unique',None),('nonunique','CREATE INDEX idx_quotations_id_unique ON quotations(id)'),('wrong_column','CREATE UNIQUE INDEX idx_quotations_id_unique ON quotations(quotation_id)'),('partial','CREATE UNIQUE INDEX idx_quotations_id_unique ON quotations(id) WHERE id IS NOT NULL'),('expression','CREATE UNIQUE INDEX idx_quotations_id_unique ON quotations(lower(id))'),('nulls_not_distinct','CREATE UNIQUE INDEX idx_quotations_id_unique ON quotations(id) NULLS NOT DISTINCT')]:
       owned_schema='phase1_index_'+secrets.token_hex(8)
       sql('CREATE SCHEMA '+owned_schema+'; SET search_path TO '+owned_schema+"; CREATE TABLE quotations(quotation_id text PRIMARY KEY,id text,artwork_url text,digital_proof_url text); INSERT INTO quotations VALUES('owned-legacy','owned-id','/owned/original.pdf','/owned/proof.pdf'); "+(index_ddl+';' if index_ddl else ''))
       snapshot=sql('SELECT row_to_json(q)::text FROM '+owned_schema+'.quotations q')
       query='BEGIN; SET LOCAL search_path TO '+owned_schema+'; '+migration045+' COMMIT;'
       checked=run(base+['exec','-T','fixture-db','psql','-v','ON_ERROR_STOP=1','-U','fixture','-d','somsing_fixture_db','-Atc',query],False)
       if index_ddl:
        assert checked.returncode!=0 and 'conflicting named index definition' in checked.stderr,label
       else:
        assert checked.returncode==0,checked.stderr
        sql(query)
       assert sql('SELECT row_to_json(q)::text FROM '+owned_schema+'.quotations q')==snapshot
       sql('DROP SCHEMA '+owned_schema+' CASCADE')
       runtime_results.append({'case':'index_definition_'+label,'accepted':not bool(index_ddl),'rows_references_preserved':True})
      sql("INSERT INTO quotations(id,quotation_no,customer_name,total_cost,total_selling_price,items_json,artwork_url,digital_proof_url) VALUES('fixture-runtime-legacy','QT-OWNED-LEGACY','Owned Legacy',12.34,56.78,'[]','/owned/original.pdf','/owned/proof.pdf')")
      quotation_status,quotation_body=http(origin,'/api/v1/quotations',token=token)
      legacy_read=next(q for q in quotation_body if q['id']=='fixture-runtime-legacy')
      assert quotation_status==200 and legacy_read['artwork_url']=='/owned/original.pdf' and legacy_read['digital_proof_url']=='/owned/proof.pdf'
      mutation_query="SELECT json_build_object('quotations',(SELECT count(*) FROM quotations),'customers',(SELECT count(*) FROM customers),'audits',(SELECT count(*) FROM audit_logs))::text"
      before_write=sql(mutation_query)
      write_status,write_body=http(origin,'/api/v1/quotations',body={'id':'fixture-runtime-write','customer_name':'Owned Runtime Write','customer_phone':'owned-runtime-phone','artwork_url':'/owned/new-original.pdf','digital_proof_url':'/owned/new-proof.pdf','items':[]},token=token)
      after_write=sql(mutation_query)
      if write_status!=200:assert before_write==after_write,'Failed quotation write mutated owned data'
      else:
       assert write_body['committed'] is True
       assert sql("SELECT artwork_url||'|'||digital_proof_url FROM quotations WHERE id='fixture-runtime-write'")=='/owned/new-original.pdf|/owned/new-proof.pdf'
      update_status=None
      if write_status==200:
       update_status,update_body=http(origin,'/api/v1/quotations/fixture-runtime-write',body={'id':'fixture-runtime-write','customer_name':'Owned Runtime Write','customer_phone':'owned-runtime-phone','title':'Owned updated title','artwork_url':'/owned/new-original.pdf','digital_proof_url':'/owned/new-proof.pdf','items':[]},token=token,method='PUT')
       if update_status==200:
        assert update_body['committed'] is True
        assert sql("SELECT count(*) FROM quotations WHERE id='fixture-runtime-write'")=='1'
        assert sql("SELECT count(*) FROM audit_logs WHERE resource_id='fixture-runtime-write'")=='2'
        assert sql("SELECT count(*) FROM customers WHERE phone='owned-runtime-phone'")=='1'
        assert sql("SELECT total_orders_count FROM customers WHERE phone='owned-runtime-phone'")=='2'
        assert sql("SELECT title||'|'||artwork_url||'|'||digital_proof_url FROM quotations WHERE id='fixture-runtime-write'")=='Owned updated title|/owned/new-original.pdf|/owned/new-proof.pdf'
       runtime_results.append({'case':'quotation_update','http_status':update_status,'response':update_body,'single_row':update_status==200,'audit_records':2 if update_status==200 else None,'matched_customer_rows':1 if update_status==200 else None,'customer_order_counter_observed':2 if update_status==200 else None})
      runtime_results.append({'case':'quotation_write','http_status':write_status,'response':write_body,'failed_write_rollback':before_write==after_write if write_status!=200 else None,'before_counts':json.loads(before_write),'after_counts':json.loads(after_write)})
      assert http(origin,'/api/v1/auth/login',{'username':'fixture_runtime_admin','password':'wrong-fixture-only'})[0]==401
      runtime_results.append({'case':'success','container':cid,'health':health,'tracked_migrations':46,'bcrypt_login':200,'anonymous_read':401,'authenticated_admin_read':authenticated_status,'quotation_read':quotation_status,'quotation_response':quotation_body,'wrong_password':401,'production_environment':True})
      logs=run(['docker','logs',cid]);print('STARTUP_LOG_JSON '+json.dumps({'case':'success_after_requests','text':logs.stdout+logs.stderr}),flush=True)
      sql("INSERT INTO quotations(customer_name,artwork_url,digital_proof_url,items_json) VALUES('Owned NULL A','/owned/null-a.pdf','/owned/null-a-proof.pdf','[]'),('Owned NULL B','/owned/null-b.pdf','/owned/null-b-proof.pdf','[]')")
      run(['docker','stop','-t','2',cid]);run(['docker','rm',cid]);case_ids.remove(cid)
      ledger_before=sql('SELECT json_agg(row_to_json(m) ORDER BY version)::text FROM schema_migrations m')
      row_before=sql("SELECT json_agg(row_to_json(q) ORDER BY quotation_id)::text FROM quotations q")
      cid,origin=launch('repeat');deadline=time.monotonic()+30;repeat_health=None
      while time.monotonic()<deadline:
       if run(['docker','inspect',cid,'--format','{{.State.Running}}']).stdout.strip()!='true':break
       try:
        repeat_status,repeat_health=http(origin,'/health')
        if repeat_status==200 and repeat_health.get('database')=='connected':break
       except (OSError,ValueError):pass
       time.sleep(.1)
      assert repeat_health and repeat_status==200 and repeat_health['database']=='connected'
      readback_status,readback=http(origin,'/api/v1/quotations',token=token);assert readback_status==200
      if write_status==200 and update_status==200:
       saved=next(q for q in readback if q['id']=='fixture-runtime-write')
       assert saved['title']=='Owned updated title' and saved['artwork_url']=='/owned/new-original.pdf' and saved['digital_proof_url']=='/owned/new-proof.pdf' and saved['committed'] is True
      assert sql('SELECT json_agg(row_to_json(m) ORDER BY version)::text FROM schema_migrations m')==ledger_before
      assert sql("SELECT json_agg(row_to_json(q) ORDER BY quotation_id)::text FROM quotations q")==row_before
      assert sql('SELECT count(*) FROM quotations WHERE id IS NULL')=='2'
      logs=run(['docker','logs',cid]);raw=logs.stdout+logs.stderr;print('STARTUP_LOG_JSON '+json.dumps({'case':'repeat','text':raw}),flush=True)
      assert '(applied: 0, baselined: 0)' in raw
      runtime_results.append({'case':'repeat','container':cid,'health':repeat_health,'migration_ledger_timestamps_unchanged':True,'legacy_row_references_unchanged':True,'multiple_null_ids_preserved':2,'created_updated_rows_preserved':True,'quotation_read':200,'applied':0,'baselined':0})
      run(['docker','stop','-t','2',cid]);run(['docker','rm',cid]);case_ids.remove(cid)
      # Actual migration runner must refuse duplicate IDs, leaving no045 success.
      for label,value in [('duplicate_nonnull','owned-duplicate'),('duplicate_empty','')]:
       sql("DROP INDEX IF EXISTS idx_quotations_id_unique; DELETE FROM schema_migrations WHERE version='045_quotation_id_uniqueness.sql'; INSERT INTO quotations(id,customer_name,artwork_url,digital_proof_url,items_json) VALUES('"+value+"','Owned duplicate A','/owned/a.pdf','/owned/a-proof.pdf','[]'),('"+value+"','Owned duplicate B','/owned/b.pdf','/owned/b-proof.pdf','[]')")
       duplicate_rows=sql('SELECT json_agg(row_to_json(q) ORDER BY quotation_id)::text FROM quotations q')
       duplicate_ledger=sql('SELECT json_agg(row_to_json(m) ORDER BY version)::text FROM schema_migrations m')
       cid,origin=launch(label);deadline=time.monotonic()+15;served=False
       while time.monotonic()<deadline:
        try:http(origin,'/health');served=True
        except (OSError,ValueError):pass
        state=json.loads(run(['docker','inspect',cid]).stdout)[0]['State']
        if not state['Running']:break
        time.sleep(.1)
       logs=run(['docker','logs',cid]);raw=logs.stdout+logs.stderr;print('STARTUP_LOG_JSON '+json.dumps({'case':label,'text':raw}),flush=True)
       assert not state['Running'] and state['ExitCode']!=0 and not served
       assert 'duplicate non-NULL ids require explicit review' in raw
       assert 'Starting Go server' not in raw and '[PPM CRON]' not in raw
       assert sql('SELECT json_agg(row_to_json(q) ORDER BY quotation_id)::text FROM quotations q')==duplicate_rows
       assert sql('SELECT json_agg(row_to_json(m) ORDER BY version)::text FROM schema_migrations m')==duplicate_ledger
       assert sql("SELECT count(*) FROM schema_migrations WHERE version='045_quotation_id_uniqueness.sql'")=='0'
       assert sql("SELECT to_regclass('idx_quotations_id_unique') IS NULL")=='t'
       runtime_results.append({'case':label,'exit_code':state['ExitCode'],'health_served':served,'rows_references_unchanged':True,'ledger_unchanged':True,'migration045_recorded':False,'unique_index_created':False})
       run(['docker','rm',cid]);case_ids.remove(cid)
       sql("DELETE FROM quotations WHERE customer_name IN ('Owned duplicate A','Owned duplicate B')")
      sql('CREATE SCHEMA '+schema)
      for label,dsn,key,missing in [('unavailable_db',default_dsn.replace(':5432/',':65432/'),'Fixture-runtime-only-strong-signed-key-32chars',False),('migration_failure',default_dsn,'Fixture-runtime-only-strong-signed-key-32chars',True),('unsafe_jwt',default_dsn,'weak-fixture',False)]:
       if missing:sql('ALTER DATABASE somsing_fixture_db SET search_path TO '+schema)
       cid,origin=launch(label,dsn,key,missing);deadline=time.monotonic()+15;served=False
       while time.monotonic()<deadline:
        try:
         http(origin,'/health');served=True
        except (OSError,ValueError):pass
        state=json.loads(run(['docker','inspect',cid]).stdout)[0]['State']
        if not state['Running']:break
        time.sleep(.1)
       logs=run(['docker','logs',cid]);raw=logs.stdout+logs.stderr;print('STARTUP_LOG_JSON '+json.dumps({'case':label,'text':raw}),flush=True)
       assert not state['Running'] and state['ExitCode']!=0 and not served,label+' did not fail closed'
       assert 'Starting Go server' not in raw and '[PPM CRON]' not in raw,label+' reached post-initialization effects'
       if label=='migration_failure':assert '[DB MIGRATION INCOMPLETE]' in raw
       if label=='unsafe_jwt':assert '[SECURITY]' in raw and '[DB SUCCESS]' not in raw
       runtime_results.append({'case':label,'container':cid,'exit_code':state['ExitCode'],'health_served':served,'server_start_marker':False,'cron_start_marker':False})
       run(['docker','rm',cid]);case_ids.remove(cid)
       if missing:sql('ALTER DATABASE somsing_fixture_db RESET search_path')
      print('STARTUP_RESULTS_JSON '+json.dumps({'image_id':image_id,'network':network,'internal_only':True,'provider_credentials':False,'cases':runtime_results}),flush=True)
     finally:
      for cid in case_ids:
       run(['docker','stop','-t','1',cid],False);run(['docker','rm',cid])
      sql('ALTER DATABASE somsing_fixture_db RESET search_path; DROP SCHEMA IF EXISTS '+schema+' CASCADE')
      if db_connected:run(['docker','network','disconnect',network,db_id])
      if network_created:
       run(['docker','network','rm',network]);assert run(['docker','network','inspect',network],False).returncode!=0
     print('STARTUP_CHECK PASS owned runtime containers/network/storage cleaned; actual production CMD cases complete',flush=True)
     assert quotation_status==200 and write_status==200 and update_status==200,'Actual quotation contract failed; see captured status/logs; further production correction requires approval'
    else:
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
