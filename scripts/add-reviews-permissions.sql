-- Run once on existing DB after deploy (roles seeded earlier without reviews.*).
-- psql $DATABASE_URL -f scripts/add-reviews-permissions.sql

UPDATE "Role"
SET permissions = array_append(permissions, 'reviews.read')
WHERE name IN ('admin', 'editor', 'viewer')
  AND NOT ('reviews.read' = ANY (permissions));

UPDATE "Role"
SET permissions = array_append(permissions, 'reviews.write')
WHERE name = 'admin'
  AND NOT ('reviews.write' = ANY (permissions));
