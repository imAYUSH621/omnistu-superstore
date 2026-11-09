'use server';
import { z } from 'zod';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { addQualifiedItem, removeQualifiedItem, createQualifiedTestOrder,createBoundReviewedOrder } from '@/lib/retail/store';
import {boundRetailCheckoutEnabled} from '@/lib/retail/gate';
const key = z.string().regex(/^[a-f0-9]{64}$/);
async function identity() { const session = await auth(); if (!session?.user?.id) throw Error('Sign in first'); return session.user.id; }
function failed() { return {success:false as const,message:'This checkout changed or is unavailable. Refresh and review the current option, destination and price.'}; }
export async function addQualifiedCartAction(raw: unknown) {
  try { const input=z.object({lineKey:key,snapshotId:key,qty:z.number().int().positive().safe()}).strict().parse(raw);await addQualifiedItem(await identity(),input);revalidatePath('/','layout');return{success:true as const,message:boundRetailCheckoutEnabled()?'Option added':'Option added to your test cart'}; } catch {return failed();}
}
export async function removeQualifiedCartAction(raw: unknown) {
  try {const input=z.object({cartId:z.string().uuid(),lineKey:key,snapshotId:key}).strict().parse(raw);await removeQualifiedItem(await identity(),input);revalidatePath('/','layout');return{success:true as const,message:'Option removed'};}catch{return failed();}
}
export async function createQualifiedOrderAction(raw: unknown) {
  try {const input=z.object({cartId:z.string().uuid(),reviewToken:key,idempotencyKey:z.string().uuid()}).strict().parse(raw);const id=await createQualifiedTestOrder(await identity(),input);revalidatePath('/','layout');return{success:true as const,message:'Test order created. No charge or supplier order.',redirectTo:`/order/${id}`};}catch{return failed();}
}

export async function createBoundOrderAction(raw:unknown){
 try{const input=z.object({cartId:z.string().uuid(),reviewToken:key,termsId:z.string().uuid(),idempotencyKey:z.string().uuid()}).strict().parse(raw);const id=await createBoundReviewedOrder(await identity(),input);revalidatePath('/','layout');return{success:true as const,message:'Order saved. Payment and supplier shipment are not confirmed.',redirectTo:`/order/${id}`}}catch{return failed()}
}
