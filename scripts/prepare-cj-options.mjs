// node scripts/prepare-cj-options.mjs retained-input.json output.json
// Input: {products:[{detail,inventory,detailObservedAt,inventoryObservedAt,reviews}]}
// Reads files only. Dates come from the retained originals, never file mtime.
import {readFileSync,writeFileSync}from 'node:fs';
import {resolve}from 'node:path';
import {prepareCjOptions}from './lib/cj-option-preparation.mjs';
const [input,output,...extra]=process.argv.slice(2);
if(!input||!output||extra.length||resolve(input)===resolve(output)){console.error('usage: node scripts/prepare-cj-options.mjs retained-input.json output.json');process.exit(2)}
try{
 const raw=JSON.parse(readFileSync(input,'utf8'));
 if(!Array.isArray(raw.products)||!raw.products.length||raw.products.length>100)throw Error('INVALID_BATCH');
 const seen=new Set();const now=new Date();
 const products=raw.products.map(p=>{if(seen.has(p.detail?.pid))throw Error('DUPLICATE_PRODUCT');seen.add(p.detail?.pid);return prepareCjOptions({...p,now,maxAgeMs:600000})});
 const result={source:'Retained CJ exact-option preparation',preparedAt:now.toISOString(),products,options:products.reduce((n,p)=>n+p.options.length,0),publish:false,writes:false};
 writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({products:products.length,options:result.options,publish:false,writes:false}));
}catch{console.error('CJ_OPTION_PREPARATION_FAILED');process.exit(1)}
