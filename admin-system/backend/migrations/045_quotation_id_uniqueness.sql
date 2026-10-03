-- Preserve legacy UUID primary keys and NULL ids; reject ambiguous non-NULL ids.
DO $$
DECLARE
    target_table regclass := 'quotations'::regclass;
    target_schema text;
    existing_index regclass;
BEGIN
    LOCK TABLE quotations IN SHARE ROW EXCLUSIVE MODE;
    IF EXISTS (SELECT 1 FROM quotations WHERE id IS NOT NULL GROUP BY id HAVING count(*) > 1) THEN
        RAISE EXCEPTION '045 quotation id uniqueness: duplicate non-NULL ids require explicit review';
    END IF;
    SELECT n.nspname INTO target_schema
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.oid = target_table;
    existing_index := to_regclass(format('%I.%I', target_schema, 'idx_quotations_id_unique'));
    IF existing_index IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_index i
            WHERE i.indexrelid = existing_index AND i.indrelid = target_table
              AND i.indisunique AND i.indisvalid AND i.indisready AND i.indimmediate
              AND NOT i.indnullsnotdistinct
              AND i.indnkeyatts = 1 AND i.indnatts = 1
              AND i.indexprs IS NULL AND i.indpred IS NULL
              AND i.indkey[0] = (SELECT attnum FROM pg_attribute
                                WHERE attrelid = target_table AND attname = 'id' AND NOT attisdropped)
        ) THEN
            RAISE EXCEPTION '045 quotation id uniqueness: conflicting named index definition';
        END IF;
    ELSE
        EXECUTE format('CREATE UNIQUE INDEX %I ON %s (id)', 'idx_quotations_id_unique', target_table);
    END IF;
END $$;
