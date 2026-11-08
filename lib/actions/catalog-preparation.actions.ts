'use server';
import {requireAdmin} from '@/lib/auth-guard';
import {catalogPreparationAvailable,runCatalogPreparation} from '@/lib/catalog-preparation-workflow';
import {revalidatePath} from 'next/cache';
export async function enqueuePreparation(form:FormData){
 await requireAdmin();if(!catalogPreparationAvailable())throw Error('Catalog preparation is not enabled in this environment.');
 const id=form.get('preparationId');if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))throw Error('Invalid preparation record.');
 await runCatalogPreparation({action:'enqueue',preparationId:id});revalidatePath('/admin/catalog-preparation');
}
export async function processPreparation(){
 await requireAdmin();if(!catalogPreparationAvailable())throw Error('Catalog preparation is not enabled in this environment.');
 await runCatalogPreparation({action:'drain'});revalidatePath('/admin/catalog-preparation');
}
