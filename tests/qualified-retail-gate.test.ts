import {qualifiedRetailTestEnabled} from '@/lib/retail/gate';
const env=(x:Record<string,string>)=>x as NodeJS.ProcessEnv;
const base={QUALIFIED_RETAIL_TEST_CHECKOUT:'true',TEST_CHECKOUT_MODE:'true'};
it('off by default and always refuses real-commerce or production promotion',()=>{
 expect(qualifiedRetailTestEnabled(env({}))).toBe(false);
 expect(qualifiedRetailTestEnabled(env({...base,TEST_CHECKOUT_MODE:'false'}))).toBe(false);
 expect(qualifiedRetailTestEnabled(env({...base,NODE_ENV:'production',VERCEL_ENV:'production',VERCEL_PROJECT_ID:'test-project',QUALIFIED_RETAIL_TEST_PROJECT_ID:'test-project'}))).toBe(false);
});
it('local rehearsal requires a localhost database',()=>{
 expect(qualifiedRetailTestEnabled(env({...base,NODE_ENV:'test',DATABASE_URL:'postgresql://sample@127.0.0.1/test'}))).toBe(true);
 expect(qualifiedRetailTestEnabled(env({...base,NODE_ENV:'test',DATABASE_URL:'postgresql://sample@other.example/test'}))).toBe(false);
});
it('hosted TESTONLY requires an explicit matching preview project',()=>{
 const input={...base,NODE_ENV:'production',VERCEL_ENV:'preview',VERCEL_PROJECT_ID:'test-project',QUALIFIED_RETAIL_TEST_PROJECT_ID:'test-project'};
 expect(qualifiedRetailTestEnabled(env(input))).toBe(true);
 expect(qualifiedRetailTestEnabled(env({...input,QUALIFIED_RETAIL_TEST_PROJECT_ID:'other-project'}))).toBe(false);
 expect(qualifiedRetailTestEnabled(env({...input,QUALIFIED_RETAIL_TEST_PROJECT_ID:''}))).toBe(false);
});
