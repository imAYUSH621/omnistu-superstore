import {googleAuthConfigured,verifiedGoogleIdentity,googleIdentityMaySignIn} from './google-auth-policy';
type Lookup={user:{findMany:(args:{where:{email:{equals:string;mode:'insensitive'}};select:{id:true};take:number})=>PromiseLike<{id:string}[]>};account:{findUnique:(args:{where:{provider_providerAccountId:{provider:string;providerAccountId:string}};select:{userId:true}})=>PromiseLike<{userId:string}|null>}};
export async function allowGoogleSignIn(profile:unknown,db:Lookup,env:Record<string,string|undefined>=process.env){
 if(!googleAuthConfigured(env))return false;
 const identity=verifiedGoogleIdentity(profile);if(!identity)return false;
 try{
  const existing=await db.user.findMany({where:{email:{equals:identity.email,mode:'insensitive'}},select:{id:true},take:2});
  const linked=await db.account.findUnique({where:{provider_providerAccountId:{provider:'google',providerAccountId:identity.subject}},select:{userId:true}});
  return googleIdentityMaySignIn(identity,existing,linked);
 }catch{return false}
}
