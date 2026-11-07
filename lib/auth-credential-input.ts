/** Identifiers normalize, passwords do not. Signup/reset hash the exact string,
 * so trimming it at login would lock out accounts with edge spaces. */
export function parseCredentialInput(raw:unknown):{email:string;password:string}|null{
 if(!raw||typeof raw!=='object')return null;const r=raw as Record<string,unknown>;
 if(typeof r.email!=='string'||typeof r.password!=='string')return null;
 const email=r.email.trim().toLowerCase();if(!email||!r.password)return null;
 return{email,password:r.password};
}
