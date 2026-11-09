import{Prisma}from '@prisma/client';
/** All columns and weights are fixed. Query terms and hidden prefixes are bound
 * parameters, never raw SQL or LIKE patterns. Rank before LIMIT across the DB. */
export function rankedProductQuery(terms:string[],hiddenPrefixes:string[]){
 const bounded=[...new Set(terms)].slice(0,18);
 if(!bounded.length)throw Error('Catalog rank query needs a search term');
 const termsScore=bounded.map(term=>Prisma.sql`(
  CASE WHEN strpos(lower(coalesce(name,'')),lower(${term}))>0 THEN 4 ELSE 0 END+
  CASE WHEN strpos(lower(coalesce(category,'')),lower(${term}))>0 THEN 3 ELSE 0 END+
  CASE WHEN strpos(lower(coalesce(brand,'')),lower(${term}))>0 THEN 2 ELSE 0 END+
  CASE WHEN strpos(lower(coalesce(description,'')),lower(${term}))>0 THEN 1 ELSE 0 END
 )`);
 const hidden=hiddenPrefixes.map(prefix=>Prisma.sql`left(slug,char_length(${prefix}))<>${prefix}`);
 return Prisma.sql`SELECT name,slug,price,stock FROM (
 SELECT name,slug,price,stock,(${Prisma.join(termsScore,' + ')}) AS relevance FROM "Product"
 WHERE ${hidden.length?Prisma.join(hidden,' AND '):Prisma.sql`TRUE`}
 ) AS ranked_catalog WHERE relevance>0
 ORDER BY relevance DESC,name ASC,slug ASC LIMIT 5`;
}
