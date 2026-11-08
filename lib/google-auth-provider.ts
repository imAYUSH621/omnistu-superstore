import Google from 'next-auth/providers/google';
import {googleAuthConfigured,verifiedGoogleIdentity} from './google-auth-policy';
export function optionalGoogleProvider(env:Record<string,string|undefined>=process.env){
 if(!googleAuthConfigured(env))return [];
 return[Google({clientId:env.AUTH_GOOGLE_ID!.trim(),clientSecret:env.AUTH_GOOGLE_SECRET!.trim(),allowDangerousEmailAccountLinking:false,
  authorization:{params:{scope:'openid email profile'}},
  // Identity-only sign-in does not need a retained Google access/refresh token.
  account(){return{}},
  profile(profile){const identity=verifiedGoogleIdentity(profile);if(!identity)throw Error('GOOGLE_VERIFIED_IDENTITY_REQUIRED');return{role:'user',id:identity.subject,email:identity.email,name:typeof profile.name==='string'&&profile.name.trim()?profile.name:'NO_NAME',image:typeof profile.picture==='string'?profile.picture:null}},
 })];
}
