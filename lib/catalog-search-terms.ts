/** Bounded query expansion for the existing catalog. Aliases are search terms,
 * not translated product facts or promises. No model or third-party request. */
export function catalogText(text:string):string {
 return text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
}
// Keep native scripts intact: removing marks from Hindi changes its words.
function nativeText(text:string):string{return text.normalize('NFC').toLowerCase();}
const GROUPS:readonly {aliases:readonly string[];terms:readonly string[]}[]=[
 {aliases:['टीशर्ट','टी-शर्ट','टी शर्ट','tshirt','t-shirt','camiseta','tシャツ'],terms:['t-shirt','tshirt']},
 {aliases:['शर्ट','कमीज़','कमिज','camisa','chemise','hemd','シャツ'],terms:['shirt']},
 {aliases:['हुडी','हूडी','sudadera','sweat a capuche','kapuzenpullover','パーカー'],terms:['hoodie']},
 {aliases:['कपड़े','कपड़ा','वस्त्र','ropa','vetements','kleidung','服','衣類'],terms:['apparel','clothing']},
 {aliases:['जूते','जूता','zapatos','chaussures','schuhe','靴'],terms:['shoes','footwear']},
 {aliases:['बैग','bolso','sac','tasche','バッグ'],terms:['bag']},
 {aliases:['घड़ी','reloj','montre','uhr','時計'],terms:['watch']},
 {aliases:['गहने','आभूषण','joyas','bijoux','schmuck','ジュエリー'],terms:['jewelry']},
 {aliases:['इयरबड','ईयरबड','auriculares','ecouteurs','kopfhorer','イヤホン'],terms:['earbuds','headphones']},
 {aliases:['स्पीकर','altavoz','haut-parleur','lautsprecher','スピーカー'],terms:['speaker']},
 {aliases:['फोन','मोबाइल','telefono','telephone','handy','スマホ','スマートフォン'],terms:['phone']},
 {aliases:['चार्जर','cargador','chargeur','ladegerat','充電器'],terms:['charger']},
 {aliases:['इलेक्ट्रॉनिक्स','गैजेट','electronica','electronique','elektronik','電子機器'],terms:['electronics','gadgets']},
 {aliases:['योग','yoga','ヨガ'],terms:['yoga']},
 {aliases:['फिटनेस','व्यायाम','entrenamiento','entrainement','training','運動'],terms:['fitness']},
 {aliases:['ब्यूटी','सौंदर्य','belleza','beaute','schonheit','美容'],terms:['beauty']},
 {aliases:['रसोई','cocina','cuisine','kuche','キッチン'],terms:['kitchen']},
 {aliases:['पालतू','mascota','animaux','haustier','ペット'],terms:['pet']},
 {aliases:['खिलौना','खिलौने','juguete','jouet','spielzeug','おもちゃ'],terms:['toy','toys']},
 {aliases:['केसर','azafran','safran','サフラン'],terms:['saffron']},
 {aliases:['चाय','tee','お茶'],terms:['tea','chai']},
];
const STOP=new Set(('a an and are as at be can could do does find for from get have i in is it looking me my of on or please product products search show some the this to want with you your would buy hi hello hey hola bonjour salut hallo namaste मुझे दिखाओ दिखाइए चाहिए खोजें खोजो है हैं का की के में कोई un una el la los las de del por para quiero buscar busca muestra une des du le les je cherche cherchez montre bitte ich suche zeigen ein eine der die das fur und avez vous voulez avez avez').split(/\s+/));
function latinAliasHit(query:string,alias:string):boolean {
 const normalized=catalogText(alias);
 return query.split(/[^\p{L}\p{N}-]+/u).some(w=>w===normalized)|| (normalized.includes(' ')&&query.includes(normalized));
}
export function catalogSearchTerms(query:string):string[]{
 const native=nativeText(query),normalized=catalogText(query),terms:string[]=[];
 const add=(s:string)=>{if(s&&!terms.includes(s))terms.push(s)};
 for(const group of GROUPS){
  const match=group.aliases.some(alias=>/[^\u0000-\u024f]/u.test(alias)?native.includes(nativeText(alias)):latinAliasHit(normalized,alias));
  if(match)group.terms.forEach(add);
 }
 // Unknown proper names and original scripts still search, instead of ASCII-only loss.
 for(const word of native.match(/[\p{L}\p{N}\p{M}]+(?:-[\p{L}\p{N}\p{M}]+)*/gu)??[]){
  const normalizedWord=catalogText(word);
  if(word.length>2&&!STOP.has(word)&&!STOP.has(normalizedWord)){add(word);if(normalizedWord!==word&&/^[a-z0-9-]+$/.test(normalizedWord))add(normalizedWord);}
 }
 return terms.slice(0,18);
}
