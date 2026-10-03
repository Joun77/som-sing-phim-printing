-- Add original artwork/proof references without replacing historical values.
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS artwork_url TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS digital_proof_url TEXT;
