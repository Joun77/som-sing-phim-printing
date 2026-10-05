-- Approved Phase2 additive persistence. No content/account seeds or money repair.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS piece_rate_per_impression NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK(piece_rate_per_impression>=0),
 ADD COLUMN IF NOT EXISTS sales_commission_rate NUMERIC(9,4) NOT NULL DEFAULT 0 CHECK(sales_commission_rate>=0);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deposit_eligible BOOLEAN NOT NULL DEFAULT false;
-- Deliberately preserve NULL mode/opening on existing orders.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_slip_url TEXT,
 ADD COLUMN IF NOT EXISTS deposit_mode BOOLEAN,
 ADD COLUMN IF NOT EXISTS payment_state TEXT CHECK(payment_state IN ('UNPAID','PARTIAL','PAID')),
 ADD COLUMN IF NOT EXISTS payment_revision BIGINT NOT NULL DEFAULT 0 CHECK(payment_revision>=0),
 ADD COLUMN IF NOT EXISTS payment_opening_received_lak NUMERIC(15,2) CHECK(payment_opening_received_lak>=0),
 ADD COLUMN IF NOT EXISTS payment_opening_captured_at TIMESTAMPTZ;
ALTER TABLE orders ALTER COLUMN deposit_mode SET DEFAULT false;
ALTER TABLE orders ALTER COLUMN deposit_percentage SET DEFAULT 100;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='orders'::regclass AND conname='phase2_deposit_percent') THEN ALTER TABLE orders ADD CONSTRAINT phase2_deposit_percent CHECK(deposit_mode IS NULL OR (deposit_percentage>0 AND deposit_percentage<=100)); END IF; END $$;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_key VARCHAR(128),
 ADD COLUMN IF NOT EXISTS request_fingerprint CHAR(64),
 ADD COLUMN IF NOT EXISTS committed_response JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS phase2_audit_request_key ON audit_logs(request_key) WHERE request_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS payment_configuration (
 id BOOLEAN PRIMARY KEY DEFAULT true CHECK(id),
 manual_qr_enabled BOOLEAN NOT NULL DEFAULT false,
 portal_enabled BOOLEAN NOT NULL DEFAULT false CHECK(NOT portal_enabled),
 gateway_enabled BOOLEAN NOT NULL DEFAULT false CHECK(NOT gateway_enabled),
 payment_method_id VARCHAR(64) REFERENCES payment_methods(id) ON DELETE RESTRICT,
 revision BIGINT NOT NULL DEFAULT 0 CHECK(revision>=0),
 updated_by VARCHAR(100) NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(NOT manual_qr_enabled OR payment_method_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS payment_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 record_kind TEXT NOT NULL CHECK(record_kind IN ('RECEIPT','REVERSAL')),
 state TEXT NOT NULL CHECK(state IN ('PENDING','CONFIRMED','REJECTED')),
 channel TEXT NOT NULL CHECK(channel='MANUAL_QR'),
 purpose TEXT NOT NULL CHECK(purpose IN ('FULL','DEPOSIT','REMAINING')),
 requested_amount_lak NUMERIC(15,2) NOT NULL CHECK(requested_amount_lak>0),
 actual_received_amount_lak NUMERIC(15,2) CHECK(actual_received_amount_lak>0 AND actual_received_amount_lak<=requested_amount_lak),
 currency TEXT NOT NULL DEFAULT 'LAK' CHECK(currency='LAK'),
 payment_method_id VARCHAR(64) NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
 provider_key TEXT NOT NULL DEFAULT 'MANUAL_QR' CHECK(provider_key='MANUAL_QR'),
 reference TEXT CHECK(reference IS NULL OR (reference=btrim(reference) AND length(reference)>0)),
 evidence_url TEXT NOT NULL,
 reversal_of UUID REFERENCES payment_records(id) ON DELETE RESTRICT,
 reason TEXT,
 actor_id VARCHAR(100) NOT NULL,
 reviewer_id VARCHAR(100),
 journal_entry_id UUID UNIQUE REFERENCES journal_entries(id) ON DELETE RESTRICT,
 request_key VARCHAR(128) NOT NULL UNIQUE,
 request_fingerprint CHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 reviewed_at TIMESTAMPTZ,
 CHECK((state='CONFIRMED' AND actual_received_amount_lak IS NOT NULL AND journal_entry_id IS NOT NULL AND reviewer_id IS NOT NULL) OR (state<>'CONFIRMED' AND actual_received_amount_lak IS NULL AND journal_entry_id IS NULL)),
 CHECK((record_kind='RECEIPT' AND reversal_of IS NULL) OR (record_kind='REVERSAL' AND reversal_of IS NOT NULL AND state='CONFIRMED' AND length(btrim(reason))>0))
);
CREATE INDEX IF NOT EXISTS phase2_payment_order ON payment_records(order_id,created_at,id);
CREATE UNIQUE INDEX IF NOT EXISTS phase2_payment_reference ON payment_records(channel,provider_key,payment_method_id,reference) WHERE reference IS NOT NULL AND record_kind='RECEIPT';
CREATE OR REPLACE FUNCTION phase2_payment_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR OLD.state<>'PENDING' THEN RAISE EXCEPTION 'Payment history is immutable' USING ERRCODE='23514'; END IF;
 IF (to_jsonb(NEW)-ARRAY['state','actual_received_amount_lak','reviewer_id','journal_entry_id','reason','reviewed_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','actual_received_amount_lak','reviewer_id','journal_entry_id','reason','reviewed_at']) THEN
  RAISE EXCEPTION 'Payment request fields are immutable' USING ERRCODE='23514';
 END IF;
 IF NEW.state='PENDING' THEN RAISE EXCEPTION 'Payment decisions must be final' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='payment_records'::regclass AND tgname='phase2_payment_history') THEN CREATE TRIGGER phase2_payment_history BEFORE UPDATE OR DELETE ON payment_records FOR EACH ROW EXECUTE FUNCTION phase2_payment_immutable(); END IF; END $$;
CREATE OR REPLACE FUNCTION phase2_opening_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.payment_opening_received_lak IS NOT NULL AND (NEW.payment_opening_received_lak IS DISTINCT FROM OLD.payment_opening_received_lak OR NEW.payment_opening_captured_at IS DISTINCT FROM OLD.payment_opening_captured_at) THEN
  RAISE EXCEPTION 'Legacy opening is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='orders'::regclass AND tgname='phase2_order_opening') THEN CREATE TRIGGER phase2_order_opening BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION phase2_opening_immutable(); END IF; END $$;

-- Validate encountered definitions against canonical handler-facing outcomes.
CREATE TEMP TABLE phase2_expected_employees(piece_rate_per_impression NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK(piece_rate_per_impression>=0),sales_commission_rate NUMERIC(9,4) NOT NULL DEFAULT 0 CHECK(sales_commission_rate>=0)) ON COMMIT DROP;
CREATE TEMP TABLE phase2_expected_customers(deposit_eligible BOOLEAN NOT NULL DEFAULT false) ON COMMIT DROP;
CREATE TEMP TABLE phase2_expected_orders(payment_slip_url TEXT,deposit_mode BOOLEAN DEFAULT false,payment_state TEXT CHECK(payment_state IN ('UNPAID','PARTIAL','PAID')),payment_revision BIGINT NOT NULL DEFAULT 0 CHECK(payment_revision>=0),payment_opening_received_lak NUMERIC(15,2) CHECK(payment_opening_received_lak>=0),payment_opening_captured_at TIMESTAMPTZ) ON COMMIT DROP;
CREATE TEMP TABLE phase2_expected_audit_logs(request_key VARCHAR(128),request_fingerprint CHAR(64),committed_response JSONB) ON COMMIT DROP;
CREATE TEMP TABLE phase2_expected_payment_configuration(
 id BOOLEAN PRIMARY KEY DEFAULT true CHECK(id),
 manual_qr_enabled BOOLEAN NOT NULL DEFAULT false,
 portal_enabled BOOLEAN NOT NULL DEFAULT false CHECK(NOT portal_enabled),
 gateway_enabled BOOLEAN NOT NULL DEFAULT false CHECK(NOT gateway_enabled),
 payment_method_id VARCHAR(64),
 revision BIGINT NOT NULL DEFAULT 0 CHECK(revision>=0),
 updated_by VARCHAR(100) NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(NOT manual_qr_enabled OR payment_method_id IS NOT NULL)) ON COMMIT DROP;
CREATE TEMP TABLE phase2_expected_payment_records(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id VARCHAR(100) NOT NULL,
 record_kind TEXT NOT NULL CHECK(record_kind IN ('RECEIPT','REVERSAL')),
 state TEXT NOT NULL CHECK(state IN ('PENDING','CONFIRMED','REJECTED')),
 channel TEXT NOT NULL CHECK(channel='MANUAL_QR'),
 purpose TEXT NOT NULL CHECK(purpose IN ('FULL','DEPOSIT','REMAINING')),
 requested_amount_lak NUMERIC(15,2) NOT NULL CHECK(requested_amount_lak>0),
 actual_received_amount_lak NUMERIC(15,2) CHECK(actual_received_amount_lak>0 AND actual_received_amount_lak<=requested_amount_lak),
 currency TEXT NOT NULL DEFAULT 'LAK' CHECK(currency='LAK'),
 payment_method_id VARCHAR(64) NOT NULL,
 provider_key TEXT NOT NULL DEFAULT 'MANUAL_QR' CHECK(provider_key='MANUAL_QR'),
 reference TEXT CHECK(reference IS NULL OR (reference=btrim(reference) AND length(reference)>0)),
 evidence_url TEXT NOT NULL,
 reversal_of UUID,
 reason TEXT,
 actor_id VARCHAR(100) NOT NULL,
 reviewer_id VARCHAR(100),
 journal_entry_id UUID UNIQUE,
 request_key VARCHAR(128) NOT NULL UNIQUE,
 request_fingerprint CHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 reviewed_at TIMESTAMPTZ,
 CHECK((state='CONFIRMED' AND actual_received_amount_lak IS NOT NULL AND journal_entry_id IS NOT NULL AND reviewer_id IS NOT NULL) OR (state<>'CONFIRMED' AND actual_received_amount_lak IS NULL AND journal_entry_id IS NULL)),
 CHECK((record_kind='RECEIPT' AND reversal_of IS NULL) OR (record_kind='REVERSAL' AND reversal_of IS NOT NULL AND state='CONFIRMED' AND length(btrim(reason))>0))) ON COMMIT DROP;

DO $$ DECLARE pair record; e record; actual record; expected_default text; actual_default text; BEGIN
 FOR pair IN SELECT * FROM (VALUES ('employees','pg_temp.phase2_expected_employees',false),('customers','pg_temp.phase2_expected_customers',false),('orders','pg_temp.phase2_expected_orders',false),('audit_logs','pg_temp.phase2_expected_audit_logs',false),('payment_configuration','pg_temp.phase2_expected_payment_configuration',true),('payment_records','pg_temp.phase2_expected_payment_records',true)) AS definitions(actual_table,expected_table,complete) LOOP
  FOR e IN SELECT a.*,pg_get_expr(d.adbin,d.adrelid) AS default_expr FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass(pair.expected_table) AND a.attnum>0 AND NOT a.attisdropped LOOP
   SELECT a.*,pg_get_expr(d.adbin,d.adrelid) AS default_expr INTO actual FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass(pair.actual_table) AND a.attname=e.attname AND NOT a.attisdropped;
   IF NOT FOUND OR actual.atttypid<>e.atttypid OR actual.attnotnull<>e.attnotnull OR (actual.atttypmod<>e.atttypmod AND NOT (e.atttypid='varchar'::regtype AND (actual.atttypmod=-1 OR actual.atttypmod>=e.atttypmod))) OR actual.default_expr IS DISTINCT FROM e.default_expr THEN
    RAISE EXCEPTION '047 incompatible legacy definition %.%',pair.actual_table,e.attname;
   END IF;
  END LOOP;
  IF pair.complete AND EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=to_regclass(pair.actual_table) AND a.attnum>0 AND NOT a.attisdropped AND a.attnotnull AND NOT a.atthasdef AND a.attgenerated='' AND a.attidentity='' AND NOT EXISTS(SELECT 1 FROM pg_attribute expected_col WHERE expected_col.attrelid=to_regclass(pair.expected_table) AND expected_col.attname=a.attname AND NOT expected_col.attisdropped)) THEN
   RAISE EXCEPTION '047 extra insert-required legacy column in %',pair.actual_table;
  END IF;
  FOR e IN SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=to_regclass(pair.expected_table) AND contype IN ('c','p','u') LOOP
   IF NOT EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=to_regclass(pair.actual_table) AND c.convalidated AND pg_get_constraintdef(c.oid)=e.definition) THEN
    RAISE EXCEPTION '047 missing canonical constraint in %: %',pair.actual_table,e.definition;
   END IF;
  END LOOP;
 END LOOP;
END $$;

DO $$ DECLARE e record; expected_def text; BEGIN
 FOR e IN SELECT * FROM (VALUES
 ('phase2_audit_request_key','audit_logs','(request_key) WHERE (request_key IS NOT NULL)',true),
 ('phase2_payment_order','payment_records','(order_id, created_at, id)',false),
 ('phase2_payment_reference','payment_records',$guard$(channel, provider_key, payment_method_id, reference) WHERE ((reference IS NOT NULL) AND (record_kind = 'RECEIPT'::text))$guard$,true)
 ) AS indexes(index_name,table_name,suffix,unique_index) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_index i WHERE i.indexrelid=to_regclass(e.index_name) AND i.indrelid=to_regclass(e.table_name) AND i.indisvalid AND i.indisready AND i.indisunique=e.unique_index AND split_part(pg_get_indexdef(i.indexrelid),' USING btree ',2)=e.suffix) THEN RAISE EXCEPTION '047 incompatible required index %',e.index_name; END IF;
 END LOOP;
 FOR e IN SELECT * FROM (VALUES('payment_records','phase2_payment_history','phase2_payment_immutable',27),('orders','phase2_order_opening','phase2_opening_immutable',19)) AS triggers(table_name,trigger_name,function_name,trigger_type) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=to_regclass(e.table_name) AND t.tgname=e.trigger_name AND t.tgenabled IN ('O','A') AND t.tgtype=e.trigger_type AND t.tgfoid=to_regprocedure(e.function_name||'()') AND t.tgnargs=0 AND t.tgqual IS NULL AND NOT t.tgisinternal) THEN RAISE EXCEPTION '047 ineffective required trigger %',e.trigger_name; END IF;
 END LOOP;
 FOR e IN SELECT * FROM (VALUES('payment_configuration','payment_method_id','payment_methods','id'),('payment_records','order_id','orders','id'),('payment_records','payment_method_id','payment_methods','id'),('payment_records','reversal_of','payment_records','id'),('payment_records','journal_entry_id','journal_entries','id')) AS links(table_name,column_name,parent_table,parent_column) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=to_regclass(e.table_name) AND c.confrelid=to_regclass(e.parent_table) AND c.contype='f' AND c.convalidated AND c.confdeltype='r' AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=to_regclass(e.table_name) AND attname=e.column_name)]::smallint[] AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=to_regclass(e.parent_table) AND attname=e.parent_column)]::smallint[]) THEN RAISE EXCEPTION '047 incompatible history reference %.%',e.table_name,e.column_name; END IF;
 END LOOP;
END $$;

DROP TABLE pg_temp.phase2_expected_employees;
DROP TABLE pg_temp.phase2_expected_customers;
DROP TABLE pg_temp.phase2_expected_orders;
DROP TABLE pg_temp.phase2_expected_audit_logs;
DROP TABLE pg_temp.phase2_expected_payment_configuration;
DROP TABLE pg_temp.phase2_expected_payment_records;
