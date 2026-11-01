-- Brand is the manufacturer's brand; it can be genuinely unknown (e.g. supplier data has none).
ALTER TABLE "Product" ALTER COLUMN "brand" DROP NOT NULL;
