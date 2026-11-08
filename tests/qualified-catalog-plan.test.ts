import {fixture}from './helpers/qualified-catalog-fixture';
import {retailSnapshotIdentity}from '@/lib/offers/retail-snapshot';
import {prepareQualifiedCatalogRow,prepareQualifiedCatalogBatch}from '@/lib/qualified-catalog-plan';
const at='2026-11-06T19:25:00Z',now=new Date('2026-11-06T19:30:00Z');
const productId='bbbbbbbb-1111-4111-8111-111111111111',variantId='bbbbbbbb-2221-4221-8221-222222222221';
const review={ref:'fixture-review-not-authority',observedAt:at};

test('complete synthetic evidence yields preparation only,never a writer or publication approval',()=>{expect(prepareQualifiedCatalogRow(fixture())).toMatchObject({status:'PREPARED_ONLY',writes:false,publish:false,variant:{id:variantId,label:'Brown / 2XL'},retailUnitCents:1000})});
test.each(['stock','freight','retail','copy','variant','carrierReview','publicationReview'])('missing %s remains HOLD without defaults',key=>{const x:any=fixture();x[key]=null;expect(prepareQualifiedCatalogRow(x)).toMatchObject({status:'HOLD',writes:false,publish:false})});
test.each(['warehouseId','providerVariantId','destinationPostal','shippingMethod','shippingQuoteCents'])('freight exact tuple mismatch %s refuses',key=>{const x:any=fixture();x.freight[key]=key==='shippingQuoteCents'?1:'wrong';expect(prepareQualifiedCatalogRow(x)).toMatchObject({status:'HOLD',reasons:['FREIGHT_TUPLE_MISMATCH']})});
test.each(['retailUnitCents','variantId'])('retail approval mismatch %s refuses',key=>{const x:any=fixture();x.retail[key]=key==='retailUnitCents'?1:'aaaaaaaa-1111-4111-8111-111111111111';expect(prepareQualifiedCatalogRow(x)).toMatchObject({status:'HOLD',reasons:['RETAIL_APPROVAL_MISMATCH']})});
test('wrong product image cannot be published as this product',()=>{const x=fixture();x.images[0].providerProductId='other';expect(prepareQualifiedCatalogRow(x)).toMatchObject({status:'HOLD',reasons:['ASSET_IDENTITY_MISMATCH']})});
test('no image or plaintext image refuses rather than inventing a placeholder',()=>{for(const images of[[],[{...fixture().images[0],url:'http://example.test/a.jpg'}]])expect(prepareQualifiedCatalogRow({...fixture(),images})).toMatchObject({status:'HOLD'})});
test('stale source and future review refuse without resetting observation time',()=>{const x=fixture();x.freight.observedAt='2026-11-05T19:25:00Z';x.publicationReview.source={...review,observedAt:'2026-11-07T19:25:00Z'};expect(prepareQualifiedCatalogRow(x)).toMatchObject({status:'HOLD',reasons:['SOURCE_EVIDENCE_STALE_OR_FUTURE','REVIEW_IN_FUTURE']})});
test('stock/quote-shaped synthetic evidence alone cannot become retailcatalog without copy,pricing,carrier and publication inputs',()=>{
 const x:any=fixture();delete x.retail;delete x.copy;delete x.variant;x.images=[];delete x.carrierReview;delete x.publicationReview;
 const r=prepareQualifiedCatalogRow(x);expect(r.status).toBe('HOLD');if(r.status==='HOLD')expect(r.reasons).toEqual(expect.arrayContaining(['RETAIL_APPROVAL_REQUIRED','PRODUCT_COPY_REVIEW_REQUIRED','EXACT_VARIANT_MAPPING_REQUIRED','PRODUCT_ASSET_EVIDENCE_REQUIRED','CARRIER_REVIEW_REQUIRED','PUBLICATION_REVIEW_REQUIRED']));
});

test('batch refuses duplicates and partial qualification rather than choosing or importing some rows',()=>{
 expect(prepareQualifiedCatalogBatch([fixture(),fixture()])).toMatchObject({status:'HOLD',reasons:['DUPLICATE_OFFER_IDENTITY'],writes:false,publish:false});
 expect(prepareQualifiedCatalogBatch([])).toMatchObject({status:'HOLD',reasons:['EMPTY_BATCH']});
 const broken:any=fixture();broken.retail=null;expect(prepareQualifiedCatalogBatch([fixture(),broken])).toMatchObject({status:'HOLD',reasons:['ROW_REQUIRES_REVIEW']});
});

test('carrier and publication review cannot be borrowed from another route or quote',()=>{
 const x=fixture();x.carrierReview.postal='wrong';x.publicationReview.snapshotId='wrong';expect(prepareQualifiedCatalogRow(x)).toMatchObject({status:'HOLD',reasons:['CARRIER_REVIEW_TUPLE_MISMATCH','PUBLICATION_REVIEW_TUPLE_MISMATCH']});
});
