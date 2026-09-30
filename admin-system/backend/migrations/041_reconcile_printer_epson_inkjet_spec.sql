-- +goose Up
-- Reconcile PRN-9614 Epson L15150 category and specs in printers and inbound_transactions
-- Preserves existing data, photos, vendor, and pricing without deleting any rows.

UPDATE printers
SET category = 'Inkjet'::printer_category_enum,
    technical_specs = jsonb_set(
        jsonb_set(
            COALESCE(technical_specs, '{}'::jsonb),
            '{printerCategory}',
            '"Inkjet"'
        ),
        '{category}',
        '"Printer"'
    )
WHERE asset_id = 'PRN-9614';

UPDATE printers
SET technical_specs = jsonb_set(
        technical_specs,
        '{specs,printerCategory}',
        '"Inkjet"'
    )
WHERE asset_id = 'PRN-9614' AND technical_specs ? 'specs';

UPDATE inbound_transactions
SET technical_specs = jsonb_set(
        jsonb_set(
            COALESCE(technical_specs, '{}'::jsonb),
            '{printerCategory}',
            '"Inkjet"'
        ),
        '{category}',
        '"Printer"'
    )
WHERE sku_code = 'PRN-9614' OR id = 'INB-5266';

UPDATE inbound_transactions
SET technical_specs = jsonb_set(
        technical_specs,
        '{specs,printerCategory}',
        '"Inkjet"'
    )
WHERE (sku_code = 'PRN-9614' OR id = 'INB-5266') AND technical_specs ? 'specs';

-- +goose Down
-- Reversible idempotent down
