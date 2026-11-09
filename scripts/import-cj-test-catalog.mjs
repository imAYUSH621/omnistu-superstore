// Retired unsafe legacy DB importer. Use the read-only staging command and
// offline exact-option preparation. Never interpret a demo markup as retail.
console.error('CJ_TEST_IMPORT_RETIRED: use scripts/stage-cj-products.mjs for read-only discovery or scripts/prepare-cj-options.mjs for offline preparation. No database changes performed.');
process.exitCode = 2;
