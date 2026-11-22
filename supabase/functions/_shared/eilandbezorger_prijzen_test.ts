import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { actuelePrijsRegels, bezorgPrijs, prijsRegels, type KaartProduct } from './eilandbezorgerPrijzen.ts';
import { GINGER_KAART, fictiefProduct, mockKaart, TEST_KLASSEN } from './eilandbezorgerPrijsFixtures.ts';
import { controleer, orderbericht, type Regel } from './eilandbezorgerLogica.ts';
import { verzend } from './eilandbezorgerVerzend.ts';

const regel = (id = '4636894', cent = 490, aantal = 1): Regel => ({ lightspeed_product_id: id, naam: 'Fictieve regressieregel', stukprijs_cent: cent, aantal, extras: [] });
const body = (regels: Regel[], producten = [GINGER_KAART]) => orderbericht({ referentie: 'LOKAAL-BTW', ophaaltijd: '2026-11-22T16:00:00Z', klant: { naam: 'Pura Test' }, opmerking: 'TEST – niet klaarmaken', regels: prijsRegels(regels, producten, TEST_KLASSEN), restaurant_cent: regels.reduce((s,r) => s+r.aantal*r.stukprijs_cent,0), betaalwijzeId: '285794', betaalwijzeTypeId: '4' });

Deno.test('bewezen Ginger Beer body: vier eurovelden en precies €4,90 als betalingslijst', () => {
  const b = JSON.parse(JSON.stringify(body([regel()])));
  assertEquals(b.orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, unitPriceWithoutVat: 4.4954, totalPriceWithoutVat: 4.5, modifiers: [], subitems: [] }]);
  assertEquals(b.orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
});
Deno.test('drie Ginger Beer: netto pas na vermenigvuldigen afronden, niet 3×4,50', () => {
  const r = body([regel('4636894',490,3)]).orderItems[0];
  assertEquals(r.unitPriceWithoutVat,4.4954); assertEquals(r.totalPriceWithoutVat,13.49); assertEquals(r.totalPrice,14.7);
});
Deno.test('vier Ginger Beer: €19,60 bruto, €17,98 netto', () => {
  assertEquals(body([regel('4636894',490,4)]).orderItems[0].totalPriceWithoutVat,17.98);
});
for (const [tarief,bruto,netto] of [[0,4.9,4.9],[9,4.9,4.4954],[21,4.9,4.0496]]) Deno.test(`eigen bezorgklasse ${tarief}% per product`, () => {
  assertEquals(bezorgPrijs(fictiefProduct(10,bruto,tarief),490,TEST_KLASSEN),{netto_euro:netto,bezorg_btw_pct:tarief});
});
Deno.test('gemengde btw: elke productregel heeft eigen nettoprijs', () => {
  const b=body([regel('10',490),regel('11',490)],[fictiefProduct(10,4.9,9),fictiefProduct(11,4.9,21)]);
  assertEquals(b.orderItems.map(r=>r.unitPriceWithoutVat),[4.4954,4.0496]);
  assertEquals(b.orderItems.map(r=>r.totalPriceWithoutVat),[4.5,4.05]);
});
Deno.test('geldige nulprijs, nulnetto en 0% worden expliciet geaccepteerd', () => {
  assertEquals(body([regel('10',0)],[fictiefProduct(10,0,0)]).orderItems[0].unitPriceWithoutVat,0);
  assertEquals(body([regel('10',0)],[fictiefProduct(10,0,9)]).orderItems[0].totalPrice,0);
});
Deno.test('afleiden uitsluitend met bevestigde klasse: ontbrekend direct netto wordt 4,4954', () => {
  assertEquals(bezorgPrijs({...GINGER_KAART,deliveryPriceWithoutVat:null},490,TEST_KLASSEN).netto_euro,4.4954);
});
for (const [naam,patch,klassen] of [
  ['bruto ontbreekt',{deliveryPrice:null},TEST_KLASSEN],
  ['bruto wijkt 1 cent af',{deliveryPrice:4.91},TEST_KLASSEN],
  ['bruto string',{deliveryPrice:'4.90'},TEST_KLASSEN],
  ['netto string',{deliveryPriceWithoutVat:'4.4954'},TEST_KLASSEN],
  ['negatief netto',{deliveryPriceWithoutVat:-1},TEST_KLASSEN],
  ['NaN netto',{deliveryPriceWithoutVat:NaN},TEST_KLASSEN],
  ['tegenstrijdig netto',{deliveryPriceWithoutVat:4.5},TEST_KLASSEN],
  ['klasse ontbreekt',{deliveryTaxClass:null},TEST_KLASSEN],
  ['klasse niet gevonden',{deliveryTaxClass:'onbekend'},TEST_KLASSEN],
  ['netto en tarief ontbreken',{deliveryPriceWithoutVat:null},[]],
  ['afwijkend tarief',{},[{id:'BUILTIN-9.0',taxRate:21}]],
  ['ongeldig tarief',{},[{id:'BUILTIN-9.0',taxRate:-1}]],
  ['dubbele klasse',{},[...TEST_KLASSEN,TEST_KLASSEN[0]]],
  ['niet actief',{visible:false},TEST_KLASSEN],
  ['ander afhaaltarief',{takeawayTaxClass:'BUILTIN-21.0'},TEST_KLASSEN],
] as const) Deno.test(`blokkeert ${naam}`, () => { assertThrows(()=>bezorgPrijs({...GINGER_KAART,...patch} as KaartProduct,490,[...klassen])); });

Deno.test('formaat telt eenmaal: Hula Groot €25 ×2 geeft €50, geen tweede toeslag', () => {
  const c=controleer({versie:1,modus:'test',bestelnummer:'LOKAAL-FORMAAT',vestiging:'36864',ophaaltijd:'2026-11-22T16:00:00Z',klant:{naam:'Pura Test'},regels:[{code:'HULA',aantal:2,stukprijs_cent:1650,extras:[{code:'GROOT',aantal:1,stukprijs_cent:850}]}],bedragen:{restaurant_cent:5000,bezorgkosten_cent:0,fooi_cent:0,korting:null},betaling:{wijze:'vooraf_betaald'}},[{soort:'formaat',externe_code:'HULA|GROOT',lightspeed_product_id:'4636952',naam:'Hula Groot',prijs_cent:2500,actief:true}]);
  if(!c.ok)throw new Error(c.reden);
  const b=body(c.regels,[fictiefProduct(4636952,25)]);
  assertEquals(b.orderItems.length,1); assertEquals(b.orderItems[0].totalPrice,50); assertEquals(b.orderItems[0].totalPriceWithoutVat,45.87); assertEquals(b.orderItems[0].modifiers,[]);
});
const metExtra=(cent=0):Regel=>({...regel(),extras:[{lightspeed_product_id:'563959',naam:'Al Gemaakt',aantal:1,stukprijs_cent:cent}]});
const productExtra:KaartProduct={...GINGER_KAART,additions:[{id:78093,name:'Al gemaakt',values:[{id:563959,name:'Al Gemaakt',price:0,priceWithoutVAT:0,plu:'EX0'}]}]};
Deno.test('bewezen gratis modifier: echte identifiers en price/priceWithoutVat, niet productId', () => {
  const m=body([metExtra()],[productExtra]).orderItems[0].modifiers[0];
  assertEquals(m,{modifierId:78093,modifierValueId:563959,description:'Al Gemaakt',price:0,priceWithoutVat:0,plu:'EX0'});
});
Deno.test('onbekende extra→gerecht-relatie blokkeert',()=>{assertThrows(()=>body([metExtra()]));});
Deno.test('betaalde extra blokkeert zolang bezorg-btw/bedragopbouw niet bewezen is',()=>{assertThrows(()=>body([metExtra(50)],[productExtra]));});
Deno.test('modifier zonder netto blokkeert, nul niet als ontbrekend behandelen',()=>{
  const p=structuredClone(productExtra); delete (p.additions?.[0].values[0] as Partial<{priceWithoutVAT:number}>).priceWithoutVAT;
  assertThrows(()=>body([metExtra()],[p]));
});
Deno.test('zelfde modifier tweemaal blokkeren',()=>{
  const r=metExtra();r.extras.push({...r.extras[0]});assertThrows(()=>body([r],[productExtra]));
});
Deno.test('ongeldig netto kan niet via directe shared writer ontsnappen',()=>{assertThrows(()=>orderbericht({referentie:'LOKAAL',ophaaltijd:'2026-11-22T16:00:00Z',regels:[regel()] as any,restaurant_cent:490,betaalwijzeId:'285794'}));});

function db(r: any) {
  const t:Record<string,any[]>={lightspeed_connections:[{vestiging:'Midsland',status:'gekoppeld',access_token:'lokaal',token_expires_at:'2999-01-01T00:00:00Z'}],externe_kassa_config:[{vestiging:'Midsland',lightspeed_klant_id:'13597022',lightspeed_betaalwijze_id:'285794',lightspeed_betaalwijze_type_id:'4',order_route:'customer_order'}],fase2_vlag:[{vestiging:'Midsland',vlag:'eilandbezorger_live',aan:true}],externe_bestellingen:[r],externe_bestelling_poging:[],externe_bestelling_log:[]};
  const admin={from:(name:string)=>{
    const filters:((r:any)=>boolean)[]=[];let patch:any,insert:any,single=false;
    const run=()=>{const rows=t[name]??=[];let found=rows.filter(r=>filters.every(f=>f(r)));
      if(insert){const nieuw={id:crypto.randomUUID(),uitkomst:'bezig',...insert};rows.push(nieuw);found=[nieuw];}
      if(patch)found.forEach(r=>Object.assign(r,patch));
      return {data:single?found[0]??null:found.map(r=>({...r})),error:null};};
    const q:any={select:()=>q,eq:(k:string,v:any)=>(filters.push(r=>r[k]===v),q),in:(k:string,v:any[])=>(filters.push(r=>v.includes(r[k])),q),update:(p:any)=>(patch=p,q),insert:(p:any)=>(insert=p,q),maybeSingle:()=>{single=true;return Promise.resolve(run());},then:(resolve:any)=>Promise.resolve(run()).then(resolve)};return q;
  }};return {admin,t};
}
function liveRij(aantal=1){return {id:'LOKAAL-BTW',status:'verzenden',versie:2,modus:'live',vestiging:'Midsland',extern_id:'LOKAAL-BTW',referentie:'LOKAAL-BTW',restaurant_cent:490*aantal,ophaaltijd:'2026-11-22T16:00:00Z',regels:[regel('4636894',490,aantal)],invoer:{versie:1,modus:'live',bestelnummer:'LOKAAL-BTW',vestiging:'36864',ophaaltijd:'2026-11-22T16:00:00Z',klant:{naam:'Pura Test'},regels:[{code:'PV-0680E844',aantal,stukprijs_cent:490}],bedragen:{restaurant_cent:490*aantal,korting:null},betaling:{wijze:'vooraf_betaald'}}};}
for(const aantal of [1,3])Deno.test(`echte zendroute onderschepte HTTP: Ginger Beer ${aantal}×`,async()=>{
  const r=liveRij(aantal),d=db(r);const requests:any[]=[];
  const haal=(async(input:RequestInfo|URL,init?:RequestInit)=>{const kaart=mockKaart(input,init);if(kaart)return kaart;assertEquals(init?.method,'POST');requests.push(JSON.parse(String(init?.body)));return Response.json({id:8001},{status:201});}) as typeof fetch;
  assertEquals((await verzend(d.admin,{...r},haal)).status,'verzonden');assertEquals(requests.length,1);
  assertEquals(requests[0].orderItems,body([regel('4636894',490,aantal)]).orderItems);assertEquals(requests[0].orderPayments[0].amount,490*aantal/100);assertEquals(d.t.externe_bestelling_poging.length,1);
});
Deno.test('ontbrekende/tegenstrijdige netto vóór pogingregistratie en order-HTTP geblokkeerd',async()=>{
  for(const p of [{...GINGER_KAART,deliveryPriceWithoutVat:4.5},{...GINGER_KAART,deliveryTaxClass:null}]){
    const r=liveRij(),d=db(r);let posts=0;
    const haal=(async(input:RequestInfo|URL,init?:RequestInit)=>{const kaart=mockKaart(input,init,[p]);if(kaart)return kaart;posts++;throw new Error('Order-POST verboden');}) as typeof fetch;
    assertEquals((await verzend(d.admin,{...r},haal)).status,'geblokkeerd');assertEquals(d.t.externe_bestelling_poging.length,0);assertEquals(posts,0);
  }
});
Deno.test('kaart HTTP 429: geen herhaling, geen orderpoging',async()=>{
  const r=liveRij(),d=db(r);let calls=0;
  const haal=(async()=>{calls++;return Response.json({fout:'limiet'},{status:429});}) as typeof fetch;
  const a=await verzend(d.admin,{...r},haal);assertEquals(a.status,'geblokkeerd');assertEquals(a.reden.includes('HTTP 429'),true);assertEquals(calls,1);assertEquals(d.t.externe_bestelling_poging.length,0);
});
Deno.test('kaartcache bundelt gelijktijdig, één product-GET en één taxclass-GET; verlopen cache wordt vernieuwd',async()=>{
  const d=db(liveRij());let n=0;let nu=100000;const oud=Date.now;Date.now=()=>nu;
  const haal=(async(input:RequestInfo|URL,init?:RequestInit)=>{n++;await Promise.resolve();const r=mockKaart(input,init);if(!r)throw new Error('Geen order toegestaan');return r;}) as typeof fetch;
  try{
    await Promise.all([actuelePrijsRegels(d.admin,'Midsland',[regel()],haal),actuelePrijsRegels(d.admin,'Midsland',[regel()],haal)]);assertEquals(n,2);
    await actuelePrijsRegels(d.admin,'Midsland',[regel()],haal);assertEquals(n,2);
    nu+=60001;await actuelePrijsRegels(d.admin,'Midsland',[regel()],haal);assertEquals(n,4);
  }finally{Date.now=oud;}
});
Deno.test('testmodus geen kaart-, token- of orderverzoek',async()=>{
  const r={...liveRij(),modus:'test',status:'test_ok'},d=db(r);let n=0;
  const haal=(async()=>{n++;throw new Error('Geen netwerk in testmodus');}) as typeof fetch;
  assertEquals((await verzend(d.admin,r,haal)).status,'test_ok');assertEquals(n,0);assertEquals(d.t.externe_bestelling_poging.length,0);
});