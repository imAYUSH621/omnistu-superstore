import{localDatabaseTestEnabled,localPsqlUrl}from'./helpers/local-database';import{execFileSync}from'node:child_process';import{readFileSync}from'node:fs';
(localDatabaseTestEnabled()?describe:describe.skip)('exact order-line migration on isolated legacy table',()=>{
 it('preserves old fields/row and changes only deterministic legacy identity while allowing same-product lines',()=>{
  const migration=readFileSync('prisma/migrations/20261109120000_exact_order_line_identity/migration.sql','utf8');
  const sql=`BEGIN; CREATE SCHEMA migration_order_line_fixture; SET LOCAL search_path=migration_order_line_fixture,public;
  CREATE TABLE "OrderItem"("orderId" uuid,"productId" uuid,qty integer,price numeric(12,2),name text,slug text,image text,CONSTRAINT "orderitems_orderId_productId_pk" PRIMARY KEY("orderId","productId"));
  INSERT INTO "OrderItem" VALUES('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',2,12.34,'Old exact name','old-slug','old-image');
  ${migration}
  DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM "OrderItem" WHERE "lineKey"='legacy:00000000-0000-4000-8000-000000000002' AND qty=2 AND price=12.34 AND name='Old exact name' AND slug='old-slug' AND image='old-image') THEN RAISE EXCEPTION 'Old row changed';END IF;END $$;
  INSERT INTO "OrderItem"("orderId","productId",qty,price,name,slug,image,"lineKey") VALUES('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',1,9.99,'New exact line','old-slug','new-image','exact-new-line');
  DO $$ BEGIN IF (SELECT count(*) FROM "OrderItem")<>2 THEN RAISE EXCEPTION 'Exact line was collapsed';END IF;END $$;ROLLBACK;`;
  expect(()=>execFileSync('psql',['-X',localPsqlUrl(),'-v','ON_ERROR_STOP=1'],{input:sql,stdio:['pipe','pipe','pipe']})).not.toThrow();
 });
});
