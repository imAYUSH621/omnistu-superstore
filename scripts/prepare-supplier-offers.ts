// npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/prepare-supplier-offers.ts input.json output.json
// Offline retained-source preparation only. No credentials, API or database.
import{readFileSync,writeFileSync}from'fs';
import{resolve}from'path';
import{prepareSupplierComparison,type SupplierPreparationInput}from'../lib/offers/preparation';
const[input,output,...extra]=process.argv.slice(2);
if(!input||!output||extra.length||resolve(input)===resolve(output)){console.error('SUPPLIER_PREPARATION_USAGE');process.exitCode=2}
else try{
 const raw=JSON.parse(readFileSync(input,'utf8')) as Omit<SupplierPreparationInput,'now'>;
 const result=prepareSupplierComparison({...raw,now:new Date()});
 writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:result.status,publish:result.publish,writes:result.writes,considered:result.comparison?.considered.length??0,selected:!!result.comparison?.selected}));
}catch{console.error('SUPPLIER_PREPARATION_FAILED');process.exitCode=1}
