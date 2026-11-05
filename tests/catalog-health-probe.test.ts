jest.mock('@/db/prisma',()=>({databaseConfigured:true,prisma:{$queryRaw:jest.fn()}}));
jest.mock('@/lib/db-status',()=>({classifyDatabase:jest.fn(async()=>'ok')}));
jest.mock('@/lib/utils',()=>({isDatabaseAvailable:jest.fn(()=>true)}));
jest.mock('@/lib/test-fixture',()=>({hiddenSlugPrefixes:()=>['fixture-'],sampleCatalogAllowed:()=>false}));
import {GET}from '@/app/api/health/route';
import {prisma}from '@/db/prisma';
it.each([[true,'database'],[false,'empty']] as const)('successful public catalog visibility probe %s reports %s',async(x,source)=>{
 (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{x}]);const response=await GET();expect(response.status).toBe(200);expect(await response.json()).toMatchObject({status:'ok',db:'ok',catalogSource:source});
});
it('catalog read failure is degraded/unavailable, never a healthy empty catalog',async()=>{
 (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(Error('private denied table identifier'));
 const response=await GET();expect(response.status).toBe(503);const body=await response.json();expect(body).toMatchObject({status:'degraded',db:'ok',catalogSource:'unavailable'});expect(JSON.stringify(body)).not.toContain('private denied');
});
