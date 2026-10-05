-- Image values that are file-system paths from an uploader's machine are not
-- URLs and can never load. Keep the part under /public when there is one,
-- otherwise clear the value so the product shows the placeholder.
UPDATE "Product"
SET "image" = substring("image" from position('/public/' in "image") + 7)
WHERE "image" LIKE '%/public/images/%' AND "image" NOT LIKE '/images/%';

UPDATE "Product"
SET "image" = ''
WHERE "image" IS NOT NULL AND "image" <> '' AND "image" NOT LIKE '/%' AND "image" NOT LIKE 'http%';

-- The shared logo is a placeholder, not a product photo.
UPDATE "Product" SET "image" = '' WHERE "image" = '/images/parsilon-logo-fa.jpg';
