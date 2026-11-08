'use client';
import {Button} from '@/components/ui/button';
import {Form,FormControl,FormField,FormItem,FormLabel,FormDescription} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {updateProfile} from '@/lib/actions/user.actions';
import {profileNameSchema} from '@/lib/profile-policy';
import {PROFILE_COPY} from '@/lib/profile-language';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {useSession} from 'next-auth/react';
import {useForm} from 'react-hook-form';
import {useState} from 'react';
export default function ProfileForm(){
 const language=useStoreLanguage(),c=PROFILE_COPY[language],{data:session,update}=useSession();
 const [state,setState]=useState<'saved'|'failed'|'sessionWarning'|null>(null),[invalid,setInvalid]=useState(false);
 const form=useForm<{name:string;email:string}>({defaultValues:{name:session?.user?.name??'',email:session?.user?.email??''}});
 const onSubmit=async(values:{name:string;email:string})=>{
  setState(null);const name=profileNameSchema.safeParse(values.name);setInvalid(!name.success);if(!name.success)return;
  let res;try{res=await updateProfile({name:name.data,email:values.email})}catch{setState('failed');return}
  if(!res.success){if(res.message==='Invalid profile name')setInvalid(true);else setState('failed');return}
  const savedName=res.name??name.data;form.setValue('name',savedName);
  try{await update({...session,user:{...session?.user,name:savedName}});setState('saved')}catch{setState('sessionWarning')}
 };
 return <Form {...form}><form className='flex flex-col gap-5' onSubmit={form.handleSubmit(onSubmit)} lang={language.toLowerCase()}>
  <FormField control={form.control} name='email' render={({field})=><FormItem><FormLabel>{c.email}</FormLabel><FormControl><Input disabled readOnly {...field}/></FormControl><FormDescription>{c.emailNote}</FormDescription></FormItem>}/>
  <FormField control={form.control} name='name' render={({field})=><FormItem><FormLabel>{c.name}</FormLabel><FormControl><Input autoComplete='name' maxLength={120} aria-invalid={invalid} aria-describedby={invalid?'profile-name-error':undefined} {...field}/></FormControl>{invalid?<p id='profile-name-error' role='alert' className='text-sm text-destructive'>{c.invalidName}</p>:null}</FormItem>}/>
  <Button type='submit' size='lg' className='w-full' disabled={form.formState.isSubmitting}>{form.formState.isSubmitting?c.saving:c.save}</Button>
  {state?<p role={state==='saved'?'status':'alert'} className={state==='saved'?'text-sm':'text-sm text-destructive'}>{c[state]}</p>:null}
 </form></Form>;
}
