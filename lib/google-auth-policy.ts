/** Existing Auth.js/Prisma identity only. Dormant until separately authorized setup. */
export function googleAuthConfigured(env:Record<string,string|undefined>=process.env){return env.GOOGLE_SIGNIN_ENABLED==='true'&&Boolean(env.AUTH_GOOGLE_ID?.trim())&&Boolean(env.AUTH_GOOGLE_SECRET?.trim())}
export function verifiedGoogleIdentity(profile:unknown):{subject:string;email:string}|null{
 if(!profile||typeof profile!=='object')return null;
 const p=profile as Record<string,unknown>;
 if(p.email_verified!==true||typeof p.sub!=='string'||!p.sub.trim()||typeof p.email!=='string')return null;
 const email=p.email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return null;
 return{subject:p.sub,email};
}
/** Never join an OAuth identity to an existing account by an email assertion.
 * Explicit account linking is a separate, currently unavailable workflow. */
export function googleIdentityMaySignIn(identity:{subject:string;email:string}|null,existing:{id:string}[],linked:{userId:string}|null){
 if(!identity||existing.length>1)return false;
 if(linked)return existing.length===0||existing[0].id===linked.userId;
 return existing.length===0;
}
