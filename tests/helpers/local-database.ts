/** Explicit disposable local database gate. Test credentials are never enough
 * to authorize mutation of a hosted or arbitrary database. */
export function localDatabaseTestEnabled(env:Record<string,string|undefined>=process.env):boolean{
 if(env.OMNISTU_LOCAL_DB_TEST!=='true'||!env.DATABASE_URL||env.DATABASE_URL!==env.REFUND_ITEST_DATABASE_URL)return false;
 try{const u=new URL(env.DATABASE_URL);return ['postgres:','postgresql:'].includes(u.protocol)&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&/^\/omnistu_test_[a-zA-Z0-9_]+$/.test(u.pathname)}catch{return false}
}
export function localPsqlUrl(env:Record<string,string|undefined>=process.env):string{
 if(!localDatabaseTestEnabled(env))throw Error('EXPLICIT_DISPOSABLE_LOCAL_DATABASE_REQUIRED');
 const u=new URL(env.DATABASE_URL!);for(const p of['schema','connection_limit','pool_timeout','pgbouncer'])u.searchParams.delete(p);return u.toString();
}
