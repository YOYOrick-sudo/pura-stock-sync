import { assertEquals } from 'jsr:@std/assert@1';
import { gelijkJson, vingerafdruk } from '../_shared/eilandbezorgerLogica.ts';
import { PROEF_BLOKKADE, PROEF_EERSTE_HASH, PROEF_EERSTE_TIJD, PROEF_ORDER_ID, PROEF_OWNER_ID, PROEF_POGING_ID, PROEF_REFERENTIE, proefInvoer } from '../_shared/eilandbezorgerProef.ts';
import { hervatGingerBeerProef } from './proef.ts';

// Exacte read-only uitgelezen jsonb-teksten; geen gegevens in echte tabellen.
const INVOER = '{"klant":{"naam":"Pura Test"},"modus":"live","regels":[{"code":"PV-0680E844","naam":"Naturfrisk Ginger beer","aantal":1,"extras":[],"stukprijs_cent":490}],"versie":1,"bedragen":{"korting":null,"fooi_cent":0,"restaurant_cent":490,"bezorgkosten_cent":0},"betaling":{"wijze":"vooraf_betaald"},"opmerking":"TEST – niet klaarmaken","vestiging":"36864","ophaaltijd":"2026-11-22T15:38:29.908Z","bestelnummer":"PV-PROEF-MID-20261122-GB01"}';
const REGELS = '[{"naam":"Naturfrisk Ginger beer","aantal":1,"extras":[],"lightspeed_plu":"Kd-a11","stukprijs_cent":490,"lightspeed_product_id":"4636894"}]';
type Rij = Record<string, any>;
const roundtrip = (v: any): any => {
  if (Array.isArray(v)) return v.map(roundtrip);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort((a,b) => a.length-b.length || a.localeCompare(b)).map(k => [k, roundtrip(v[k])]));
  return v;
};
function opslag() {
  const t: Record<string, Rij[]> = {
    externe_bestellingen: [{ id: PROEF_ORDER_ID, bron:'eilandbezorger', modus:'live', vestiging:'Midsland', merchant_id:'36864', extern_id:PROEF_REFERENTIE, referentie:PROEF_REFERENTIE, versie:3, status:'geblokkeerd', reden:PROEF_BLOKKADE,
      vrijgegeven_door:PROEF_OWNER_ID, vingerafdruk:PROEF_EERSTE_HASH, ophaaltijd:PROEF_EERSTE_TIJD, bezorgtijd:null, restaurant_cent:490, bezorgkosten_cent:0, fooi_cent:0, korting:null,
      invoer:JSON.parse(INVOER), regels:JSON.parse(REGELS), lightspeed_klant_id:null, lightspeed_order_id:null, orderbericht:null }],
    externe_bestelling_log: [
      {van_status:null,naar_status:'ontvangen',reden:'Eenmalige fysieke owner-proef; gewone liveverzending blijft uit.',door:PROEF_OWNER_ID,created_at:'2026-11-22T15:38:30.221473Z'},
      {van_status:'ontvangen',naar_status:'verzenden',reden:'Eenmalige fysieke owner-proef; gewone liveverzending blijft uit.',door:PROEF_OWNER_ID,created_at:'2026-11-22T15:38:30.455545Z'},
      {van_status:'verzenden',naar_status:'geblokkeerd',reden:PROEF_BLOKKADE,door:null,created_at:'2026-11-22T15:38:30.767658Z'},
    ].map(r => ({...r,bestelling_id:PROEF_ORDER_ID})),
    externe_bestelling_poging:[], notifications:[],
    user_roles:[{user_id:PROEF_OWNER_ID,role:'owner',is_active:true,location:'Midsland'}],
    externe_kassa_config:[{vestiging:'Midsland',lightspeed_klant_id:'13597022',lightspeed_betaalwijze_id:'285794',lightspeed_betaalwijze_type_id:'4',lightspeed_company_id:null,order_route:'customer_order',venster_minuten:45}],
    externe_product_koppeling:[{vestiging:'Midsland',soort:'product',externe_code:'PV-0680E844',naam:'Naturfrisk Ginger beer',lightspeed_product_id:'4636894',lightspeed_plu:'Kd-a11',prijs_cent:490,actief:true}],
    fase2_vlag:[{vestiging:'Midsland',vlag:'eilandbezorger_live',aan:false}],
    lightspeed_connections:[{vestiging:'Midsland',merchant_id:'36864',status:'gekoppeld',access_token:'lokaal',token_expires_at:'2999-01-01T00:00:00Z'}],
  };
  let foutTabel='', naOpslag:(()=>void)|undefined;
  const admin = {from:(tabel:string) => {
    let filters:((r:Rij)=>boolean)[]=[], mode='select', payload:any, columns='*', single=false;
    const q:any = {
      select:(c='*')=>{columns=c;return q;}, eq:(k:string,v:any)=>{filters.push(r => ['invoer','regels'].includes(k) ? gelijkJson(r[k],JSON.parse(v)) : k==='ophaaltijd' ? Date.parse(r[k])===Date.parse(v) : r[k]===v);return q;},
      is:(k:string,v:any)=>{filters.push(r=>r[k]===v);return q;}, in:(k:string,v:any[])=>{filters.push(r=>v.includes(r[k]));return q;},
      order:()=>q, maybeSingle:()=>{single=true;return q;}, single:()=>{single=true;return q;},
      update:(p:any)=>{mode='update';payload=p;return q;}, insert:(p:any)=>{mode='insert';payload=p;return q;},
      then:(resolve:any)=>{
        if(foutTabel===tabel) return Promise.resolve({data:null,error:{code:'leesfout'}}).then(resolve);
        const rows=t[tabel]??=[], past=rows.filter(r=>filters.every(f=>f(r))); let uit=past;
        if(mode==='insert') {
          if(tabel==='externe_bestelling_poging' && rows.some(r=>r.id===payload.id)) return Promise.resolve({data:null,error:{code:'23505'}}).then(resolve);
          const r={id:crypto.randomUUID(),uitkomst:'bezig',...roundtrip(payload)};rows.push(r);uit=[r];
        }
        if(mode==='update') {past.forEach(r=>Object.assign(r,roundtrip(payload)));if(payload.orderbericht)naOpslag?.();}
        const data=uit.map(r=>columns==='*' ? structuredClone(r) : Object.fromEntries(columns.split(',').map(k=>[k.trim(),r[k.trim()]])));
        return Promise.resolve({data:single ? data[0]??null : data,error:null}).then(resolve);
      },
    };return q;
  }};
  return {t,admin,fout:(s:string)=>{foutTabel=s;},naOpslag:(fn:()=>void)=>{naOpslag=fn;}};
}
async function test(run:(s:ReturnType<typeof opslag>&{calls:Rij[];uit:()=>Promise<any>;mode:(s:string)=>void})=>Promise<void>) {
  const s=opslag(), fetchOud=globalThis.fetch, nuOud=Date.now; const calls:Rij[]=[];let mode='';
  Date.now=()=>Date.parse('2026-11-22T15:45:00Z');
  globalThis.fetch=(async (input:any,init:any)=>{
    if(String(input)!=='https://lightspeedapis.com/resto/rest/onlineordering/customer/13597022/order' || init.method!=='POST')throw new Error('Geen andere kassa- of klantactie toegestaan');
    calls.push(JSON.parse(init.body));if(mode==='timeout')throw new Error('Verloren antwoord');
    return mode==='weigering'?Response.json({error:'geweigerd'},{status:400}):Response.json({id:8001},{status:201});
  }) as typeof fetch;
  try{await run({...s,calls,uit:()=>hervatGingerBeerProef(s.admin,PROEF_OWNER_ID),mode:(m)=>{mode=m;}});}finally{globalThis.fetch=fetchOud;Date.now=nuOud;}
}

Deno.test('werkelijke jsonb-fixture: volgorde verschilt maar inhoud en bestaande hash identiek',async()=>{
  const b=proefInvoer(Date.parse(PROEF_EERSTE_TIJD)); assertEquals(JSON.stringify(b)===JSON.stringify(JSON.parse(INVOER)),false);
  assertEquals(gelijkJson(b,JSON.parse(INVOER)),true);assertEquals(await vingerafdruk(b),PROEF_EERSTE_HASH);
  assertEquals(gelijkJson(JSON.parse(REGELS),roundtrip(JSON.parse(REGELS))),true);
});
const jsonCases:[string,unknown,unknown,boolean][]=[
  ['geneste sleutelvolgorde',{a:[{x:1,y:2}]},{a:[{y:2,x:1}]},true],
  ['geneste arrayvolgorde',{a:[[1,2]]},{a:[[2,1]]},false],
  ['number versus string',{a:1},{a:'1'},false],['null versus ontbrekend',{a:null},{},false],
  ['undefined mag niet verdwijnen',{a:undefined},{},false],['extra veld',{a:1,b:2},{a:1},false],
  ['NaN mag geen null worden',{a:NaN},{a:null},false],['array versus object',[1],{'0':1},false],
];
for(const [naam,a,b,expected] of jsonCases)Deno.test(`strikte JSON: ${naam}`,()=>assertEquals(gelijkJson(a,b),expected));
Deno.test('twee parallelle jsonb-hervattingen: één POST, dezelfde rij/invoer, blijvende poging',async()=>test(async({uit,t,calls})=>{
  const origineel=structuredClone(t.externe_bestellingen[0]);await Promise.all([uit(),uit()]);await uit();
  assertEquals(calls.length,1);assertEquals(t.externe_bestellingen.length,1);assertEquals(t.externe_bestellingen[0].id,PROEF_ORDER_ID);
  assertEquals(gelijkJson(t.externe_bestellingen[0].invoer,origineel.invoer),true);assertEquals(t.externe_bestellingen[0].ophaaltijd,origineel.ophaaltijd);
  assertEquals(t.externe_bestellingen[0].status,'verzonden');assertEquals(t.externe_bestelling_poging.length,1);assertEquals(t.externe_bestelling_poging[0].id,PROEF_POGING_ID);
  assertEquals(calls[0].orderItems[0].productId,4636894);assertEquals(calls[0].orderItems[0].amount,1);assertEquals(calls[0].orderPayments.amount,4.9);
  assertEquals(calls[0].description,'PV-PROEF-MID-20261122-GB01 — Pura Test');assertEquals(calls[0].note,'TEST – niet klaarmaken');assertEquals(t.fase2_vlag[0].aan,false);
}));
const changes:[string,(t:Record<string,Rij[]>)=>void][]=[
  ['andere klant',t=>{t.externe_kassa_config[0].lightspeed_klant_id='901';}],
  ['ander betaal-ID',t=>{t.externe_kassa_config[0].lightspeed_betaalwijze_id='77';}],
  ['ander type',t=>{t.externe_kassa_config[0].lightspeed_betaalwijze_type_id='3';}],
  ['groter tijdvenster',t=>{t.externe_kassa_config[0].venster_minuten=46;}],
  ['company toegevoegd',t=>{t.externe_kassa_config[0].lightspeed_company_id='1';}],
  ['live aan',t=>{t.fase2_vlag[0].aan=true;}],
  ['ander PLU',t=>{t.externe_product_koppeling[0].lightspeed_plu='ANDER';}],
  ['ander product',t=>{t.externe_product_koppeling[0].lightspeed_product_id='4636994';}],
  ['andere prijs',t=>{t.externe_product_koppeling[0].prijs_cent=491;}],
  ['aantal 2',t=>{t.externe_bestellingen[0].invoer.regels[0].aantal=2;}],
  ['andere gast',t=>{t.externe_bestellingen[0].invoer.klant.naam='Andere naam';}],
  ['extra onbekend invoerveld',t=>{t.externe_bestellingen[0].invoer.extra=true;}],
  ['extra regelveld',t=>{t.externe_bestellingen[0].regels[0].extra=true;}],
  ['andere toestemming',t=>{t.externe_bestellingen[0].vrijgegeven_door='ander';}],
  ['owner niet actief',t=>{t.user_roles[0].is_active=false;}],
  ['hash veranderd',t=>{t.externe_bestellingen[0].vingerafdruk='ander';}],
  ['tijd veranderd',t=>{t.externe_bestellingen[0].ophaaltijd='2026-11-22T15:40:00Z';}],
  ['bezorgtijd toegevoegd',t=>{t.externe_bestellingen[0].bezorgtijd='2026-11-22T16:00:00Z';}],
  ['status geweigerd',t=>{t.externe_bestellingen[0].status='geweigerd';}],
  ['versie 5',t=>{t.externe_bestellingen[0].versie=5;}],
  ['reden gewijzigd',t=>{t.externe_bestellingen[0].reden='andere blokkade';}],
  ['audit extra',t=>{t.externe_bestelling_log.push({...t.externe_bestelling_log[2]});}],
  ['audit door gewijzigd',t=>{t.externe_bestelling_log[0].door='ander';}],
  ['order-ID aanwezig',t=>{t.externe_bestellingen[0].lightspeed_order_id='8001';}],
  ['uitgaand bericht aanwezig',t=>{t.externe_bestellingen[0].orderbericht={};}],
  ['uitgaande klant aanwezig',t=>{t.externe_bestellingen[0].lightspeed_klant_id='13597022';}],
  ['testmodus',t=>{t.externe_bestellingen[0].modus='test';}],
  ['ander UUID',t=>{t.externe_bestellingen[0].id='andere';}],
  ['andere referentie',t=>{t.externe_bestellingen[0].referentie='ANDER';}],
  ['andere vestiging',t=>{t.externe_bestellingen[0].merchant_id='41121';}],
];
for(const [naam,change] of changes)Deno.test(`hervatting weigert ${naam}`,async()=>test(async({t,uit,calls})=>{change(t);await uit();assertEquals(calls.length,0);}));
for(const soort of ['verzenden','teruglezen'])for(const uitkomst of ['bezig','niet_verstuurd','geweigerd','uitkomst_onbekend','verzonden'])Deno.test(`ieder eerder spoor: ${soort}/${uitkomst}`,async()=>test(async({t,uit,calls})=>{
  t.externe_bestelling_poging.push({id:'oud',bestelling_id:PROEF_ORDER_ID,soort,uitkomst});await uit();assertEquals(calls.length,0);
}));
Deno.test('permanente poging-ID bij andere order blokkeert',async()=>test(async({t,uit,calls})=>{t.externe_bestelling_poging.push({id:PROEF_POGING_ID,bestelling_id:'andere',soort:'verzenden',uitkomst:'verzonden'});await uit();assertEquals(calls.length,0);}));
for(const tabel of ['externe_bestelling_poging','externe_bestelling_log','externe_bestellingen','externe_kassa_config'])Deno.test(`leesfout ${tabel}: nul POST`,async()=>test(async({fout,uit,calls})=>{fout(tabel);await uit();assertEquals(calls.length,0);}));
for(const mode of ['timeout','weigering'])Deno.test(`${mode}: geen tweede hervatting/POST`,async()=>test(async({mode:set,uit,calls,t})=>{set(mode);await uit();await uit();assertEquals(calls.length,1);assertEquals(t.externe_bestelling_poging.length,1);}));
Deno.test('verlopen afhaalvenster: nul POST',async()=>test(async({uit,calls})=>{Date.now=()=>Date.parse('2026-11-22T16:23:29.909Z');await uit();assertEquals(calls.length,0);}));
Deno.test('verlopen Amsterdamse datum: nul POST',async()=>test(async({uit,calls})=>{Date.now=()=>Date.parse('2026-11-22T23:00:00Z');await uit();assertEquals(calls.length,0);}));
Deno.test('verzendspoor verschenen vóór laatste controle: nul POST',async()=>test(async({t,naOpslag,uit,calls})=>{
  naOpslag(()=>t.externe_bestelling_poging.push({id:'andere-poging',bestelling_id:PROEF_ORDER_ID,soort:'teruglezen',uitkomst:'geen_id'}));await uit();assertEquals(calls.length,0);
}));
Deno.test('klantconfig gewijzigd vóór laatste controle: nul POST',async()=>test(async({t,naOpslag,uit,calls})=>{naOpslag(()=>{t.externe_kassa_config[0].lightspeed_klant_id='901';});await uit();assertEquals(calls.length,0);}));
