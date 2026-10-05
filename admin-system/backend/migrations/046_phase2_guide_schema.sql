-- Phase2 seed-free guide schema. No stock writes or content imports.
-- ============================================================================
-- Migration: 025_create_product_materials
-- Description: Create product_materials and product_faqs tables for
--              dynamic material guide management (replaces hardcoded PAPER_DATA)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: product_materials
CREATE TABLE IF NOT EXISTS product_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        VARCHAR(64)  NOT NULL,
    category_name_lo TEXT        NOT NULL,
    category_name_en TEXT        NOT NULL,
    name_lo         TEXT         NOT NULL,
    name_en         TEXT         NOT NULL,
    gsm             INT          NOT NULL,
    finish_lo       TEXT,
    finish_en       TEXT,
    texture_class   VARCHAR(64),
    description_lo  TEXT,
    description_en  TEXT,
    pros_lo         TEXT,
    pros_en         TEXT,
    cons_lo         TEXT,
    cons_en         TEXT,
    finishing_compat_lo TEXT,
    finishing_compat_en TEXT,
    suitable_for_lo TEXT[]       NOT NULL DEFAULT '{}',
    suitable_for_en TEXT[]       NOT NULL DEFAULT '{}',
    product_link    TEXT,
    product_title   TEXT,
    sort_order      INT          NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_materials_category  ON product_materials(category);
CREATE INDEX IF NOT EXISTS idx_product_materials_sort      ON product_materials(sort_order ASC) WHERE is_active = true;

-- Table: product_faqs
CREATE TABLE IF NOT EXISTS product_faqs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_lo  TEXT         NOT NULL,
    question_en  TEXT,
    answer_lo    TEXT         NOT NULL,
    answer_en    TEXT,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_active    BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Migration: 026_create_material_categories
-- Description: Create material_categories table for dynamic category management
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS material_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(64)  NOT NULL UNIQUE,
    name_lo     TEXT         NOT NULL,
    name_en     TEXT         NOT NULL,
    icon        VARCHAR(64)  NOT NULL DEFAULT 'layers',
    description_lo TEXT,
    description_en TEXT,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_categories_sort ON material_categories(sort_order ASC) WHERE is_active = true;


DO $$
DECLARE item record; relation regclass; col text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('product_materials',ARRAY['id','category','category_name_lo','category_name_en','name_lo','name_en','gsm','finish_lo','finish_en','texture_class','description_lo','description_en','pros_lo','pros_en','cons_lo','cons_en','finishing_compat_lo','finishing_compat_en','suitable_for_lo','suitable_for_en','product_link','product_title','sort_order','is_active','created_at','updated_at']),
 ('product_faqs',ARRAY['id','question_lo','question_en','answer_lo','answer_en','sort_order','is_active','created_at','updated_at']),
 ('material_categories',ARRAY['id','key','name_lo','name_en','icon','description_lo','description_en','sort_order','is_active','created_at','updated_at'])
 ) AS expected(table_name,columns) LOOP
  relation:=to_regclass(item.table_name);
  FOREACH col IN ARRAY item.columns LOOP
   IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=relation AND attname=col AND NOT attisdropped) THEN
    RAISE EXCEPTION '046 incompatible legacy guide %.%',item.table_name,col;
   END IF;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=relation AND attname='id' AND atttypid='uuid'::regtype)
   OR NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid=relation AND contype='p' AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=relation AND attname='id')]::smallint[]) THEN
   RAISE EXCEPTION '046 incompatible legacy guide identity %',item.table_name;
  END IF;
 END LOOP;
END $$;

-- Validate handler-facing legacy types/defaults without repairing definitions.
DO $$ DECLARE e record; a record; BEGIN
 FOR e IN SELECT * FROM (VALUES
('product_materials','id','uuid',true,true,0),
('product_materials','category','varchar',true,false,64),
('product_materials','category_name_lo','text',true,false,0),
('product_materials','category_name_en','text',true,false,0),
('product_materials','name_lo','text',true,false,0),
('product_materials','name_en','text',true,false,0),
('product_materials','gsm','int4',true,false,0),
('product_materials','finish_lo','text',false,false,0),
('product_materials','finish_en','text',false,false,0),
('product_materials','texture_class','varchar',false,false,64),
('product_materials','description_lo','text',false,false,0),
('product_materials','description_en','text',false,false,0),
('product_materials','pros_lo','text',false,false,0),
('product_materials','pros_en','text',false,false,0),
('product_materials','cons_lo','text',false,false,0),
('product_materials','cons_en','text',false,false,0),
('product_materials','finishing_compat_lo','text',false,false,0),
('product_materials','finishing_compat_en','text',false,false,0),
('product_materials','suitable_for_lo','_text',true,true,0),
('product_materials','suitable_for_en','_text',true,true,0),
('product_materials','product_link','text',false,false,0),
('product_materials','product_title','text',false,false,0),
('product_materials','sort_order','int4',true,true,0),
('product_materials','is_active','bool',true,true,0),
('product_materials','created_at','timestamptz',true,true,0),
('product_materials','updated_at','timestamptz',true,true,0),
('product_faqs','id','uuid',true,true,0),
('product_faqs','question_lo','text',true,false,0),
('product_faqs','question_en','text',false,false,0),
('product_faqs','answer_lo','text',true,false,0),
('product_faqs','answer_en','text',false,false,0),
('product_faqs','sort_order','int4',true,true,0),
('product_faqs','is_active','bool',true,true,0),
('product_faqs','created_at','timestamptz',true,true,0),
('product_faqs','updated_at','timestamptz',true,true,0),
('material_categories','id','uuid',true,true,0),
('material_categories','key','varchar',true,false,64),
('material_categories','name_lo','text',true,false,0),
('material_categories','name_en','text',true,false,0),
('material_categories','icon','varchar',true,true,64),
('material_categories','description_lo','text',false,false,0),
('material_categories','description_en','text',false,false,0),
('material_categories','sort_order','int4',true,true,0),
('material_categories','is_active','bool',true,true,0),
('material_categories','created_at','timestamptz',true,true,0),
('material_categories','updated_at','timestamptz',true,true,0)
 ) AS expected(table_name,column_name,type_name,required,needs_default,min_length) LOOP
 SELECT atttypid,attnotnull,atthasdef,atttypmod INTO a FROM pg_attribute WHERE attrelid=to_regclass(e.table_name) AND attname=e.column_name AND NOT attisdropped;
 IF NOT FOUND OR a.atttypid<>e.type_name::regtype OR (e.required AND NOT a.attnotnull) OR (e.needs_default AND NOT a.atthasdef) OR (e.min_length>0 AND a.atttypmod<>-1 AND a.atttypmod-4<e.min_length) THEN RAISE EXCEPTION '046 incompatible legacy guide definition %.%',e.table_name,e.column_name; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_index WHERE indrelid='material_categories'::regclass AND indisunique AND indisvalid AND indpred IS NULL AND indnkeyatts=1 AND indkey[0]=(SELECT attnum FROM pg_attribute WHERE attrelid='material_categories'::regclass AND attname='key')) THEN RAISE EXCEPTION '046 category key must be unique'; END IF;
END $$;

-- Validate encountered definitions against canonical handler-facing outcomes.
CREATE TEMP TABLE phase2_expected_product_materials(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        VARCHAR(64)  NOT NULL,
    category_name_lo TEXT        NOT NULL,
    category_name_en TEXT        NOT NULL,
    name_lo         TEXT         NOT NULL,
    name_en         TEXT         NOT NULL,
    gsm             INT          NOT NULL,
    finish_lo       TEXT,
    finish_en       TEXT,
    texture_class   VARCHAR(64),
    description_lo  TEXT,
    description_en  TEXT,
    pros_lo         TEXT,
    pros_en         TEXT,
    cons_lo         TEXT,
    cons_en         TEXT,
    finishing_compat_lo TEXT,
    finishing_compat_en TEXT,
    suitable_for_lo TEXT[]       NOT NULL DEFAULT '{}',
    suitable_for_en TEXT[]       NOT NULL DEFAULT '{}',
    product_link    TEXT,
    product_title   TEXT,
    sort_order      INT          NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()) ON COMMIT DROP;
CREATE TEMP TABLE phase2_expected_product_faqs(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_lo  TEXT         NOT NULL,
    question_en  TEXT,
    answer_lo    TEXT         NOT NULL,
    answer_en    TEXT,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_active    BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()) ON COMMIT DROP;
CREATE TEMP TABLE phase2_expected_material_categories(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(64)  NOT NULL UNIQUE,
    name_lo     TEXT         NOT NULL,
    name_en     TEXT         NOT NULL,
    icon        VARCHAR(64)  NOT NULL DEFAULT 'layers',
    description_lo TEXT,
    description_en TEXT,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()) ON COMMIT DROP;

DO $$ DECLARE pair record; e record; actual record; expected_default text; actual_default text; BEGIN
 FOR pair IN SELECT * FROM (VALUES ('product_materials','pg_temp.phase2_expected_product_materials',true),('product_faqs','pg_temp.phase2_expected_product_faqs',true),('material_categories','pg_temp.phase2_expected_material_categories',true)) AS definitions(actual_table,expected_table,complete) LOOP
  FOR e IN SELECT a.*,pg_get_expr(d.adbin,d.adrelid) AS default_expr FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass(pair.expected_table) AND a.attnum>0 AND NOT a.attisdropped LOOP
   SELECT a.*,pg_get_expr(d.adbin,d.adrelid) AS default_expr INTO actual FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass(pair.actual_table) AND a.attname=e.attname AND NOT a.attisdropped;
   IF NOT FOUND OR actual.atttypid<>e.atttypid OR actual.attnotnull<>e.attnotnull OR (actual.atttypmod<>e.atttypmod AND NOT (e.atttypid='varchar'::regtype AND (actual.atttypmod=-1 OR actual.atttypmod>=e.atttypmod))) OR actual.default_expr IS DISTINCT FROM e.default_expr THEN
    RAISE EXCEPTION '046 incompatible legacy definition %.%',pair.actual_table,e.attname;
   END IF;
  END LOOP;
  IF pair.complete AND EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=to_regclass(pair.actual_table) AND a.attnum>0 AND NOT a.attisdropped AND a.attnotnull AND NOT a.atthasdef AND a.attgenerated='' AND a.attidentity='' AND NOT EXISTS(SELECT 1 FROM pg_attribute expected_col WHERE expected_col.attrelid=to_regclass(pair.expected_table) AND expected_col.attname=a.attname AND NOT expected_col.attisdropped)) THEN
   RAISE EXCEPTION '046 extra insert-required legacy column in %',pair.actual_table;
  END IF;
  FOR e IN SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=to_regclass(pair.expected_table) AND contype IN ('c','p','u') LOOP
   IF NOT EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=to_regclass(pair.actual_table) AND c.convalidated AND pg_get_constraintdef(c.oid)=e.definition) THEN
    RAISE EXCEPTION '046 missing canonical constraint in %: %',pair.actual_table,e.definition;
   END IF;
  END LOOP;
 END LOOP;
END $$;

DROP TABLE pg_temp.phase2_expected_product_materials;
DROP TABLE pg_temp.phase2_expected_product_faqs;
DROP TABLE pg_temp.phase2_expected_material_categories;
