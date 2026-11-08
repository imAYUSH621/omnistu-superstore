'use server';
import {signIn} from '@/auth';
import {googleAuthConfigured} from '@/lib/google-auth-policy';
import {safeCallbackPath} from '@/lib/safe-callback';
import {authOrigin} from '@/lib/auth-origin';
export async function signInWithGoogle(form:FormData){
 if(!googleAuthConfigured())throw Error('Google sign-in is not enabled');
 await signIn('google',{redirectTo:safeCallbackPath(form.get('callbackUrl'),authOrigin())});
}
