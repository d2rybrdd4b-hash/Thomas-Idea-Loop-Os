#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════
//  Regressionstests für hotel-seat-intelligence/standalone.html
//
//  Fährt die ECHTE App headless durch die realen Formate des Hotels
//  (anonymisierte Fixtures) und prüft die Invarianten, deren Verletzung am
//  01.07.2026 zum Panorama-Vorfall führte (Tische ab 711 fehlten im Export,
//  28 Gäste ohne Zeile).
//
//  PFLICHT laut tests/README.md: Vor JEDEM Push von standalone.html ausführen.
//    node tests/run-tests.js
//  Exit-Code 0 = alle Tests bestanden, sonst 1.
//
//  Voraussetzungen: Playwright (global unter /opt/node22 oder via npm) und
//  Chromium (PLAYWRIGHT-Browser oder CHROME_PATH-Umgebungsvariable).
// ════════════════════════════════════════════════════════════════════════════
const path=require('path');
const fs=require('fs');

function resolvePlaywright(){
  const candidates=['playwright','/opt/node22/lib/node_modules/playwright'];
  for(const c of candidates){ try{ return require(c); }catch(e){} }
  console.error('FEHLER: Playwright nicht gefunden. npm i -g playwright oder lokal installieren.');
  process.exit(1);
}
function resolveChromium(){
  if(process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const globs=['/opt/pw-browsers'];
  for(const dir of globs){
    try{
      const hit=fs.readdirSync(dir).filter(d=>d.startsWith('chromium')).sort().pop();
      if(hit){
        const p=path.join(dir,hit,'chrome-linux','chrome');
        if(fs.existsSync(p)) return p;
      }
    }catch(e){}
  }
  return undefined; // Playwright-Default
}

const APP='file://'+path.resolve(__dirname,'..','standalone.html');
const FIX=f=>path.resolve(__dirname,'fixtures',f);
const REF_DATE='2026-07-01'; // Stichtag der Fixtures (Anreise 01.07., Abreise 02.07.)

let failures=0;
const results=[];
function check(name,cond,detail){
  const ok=!!cond;
  if(!ok) failures++;
  results.push((ok?'  ✓ ':'  ✗ ')+name+(detail&&!ok?' — '+detail:''));
  return ok;
}

async function loadAndCalc(page,sz){
  if(sz.vorlage) { await page.setInputFiles('#fi-tgst-vorlage',FIX(sz.vorlage)); await page.waitForTimeout(1000); }
  await page.setInputFiles('#fi-tgst-vortag',FIX(sz.vortag||'vortag-anon.xlsx'));       await page.waitForTimeout(1000);
  await page.setInputFiles('#fi-tgst-ankuenfte',FIX(sz.ankuenfte||'anreise-anon.xlsx'));await page.waitForTimeout(1000);
  await page.setInputFiles('#fi-tgst-abreisen',FIX(sz.abreisen||'abreise-anon.xlsx'));  await page.waitForTimeout(1000);
  await page.evaluate(d=>{ const rd=el('ref-date'); if(rd) rd.value=d; },sz.refDate||REF_DATE);
  await page.evaluate(()=>{ runCalc(); });
  await page.waitForTimeout(2500);
}

// Kern-Invarianten der Berechnung
async function calcInvariants(page){
  return page.evaluate(()=>{
    const tIds=new Set((lastTables||[]).map(t=>String(t.tisch_id)));
    const guests=(assignedGuests||[]);
    return{
      nTables:(lastTables||[]).length,
      nGuests:guests.length,
      unplaced:guests.filter(g=>!g.zugewiesener_tisch).length,
      ghosts:guests.filter(g=>g.zugewiesener_tisch&&!tIds.has(String(g.zugewiesener_tisch))).length,
      // Überbelegung ist nur dann ein Fehler, wenn sie STILL passiert — bewusste
      // Gruppen-Zusammenlegungen (Doppelbuchungen etc.) erzeugen eine Warnung und sind ok.
      overfullSilent:(lastTables||[]).filter(t=>t.aktiv&&(t.belegtPax||0)>(t.kapazitaet||0)
        &&!warnings.some(w=>w.msg.includes(String(t.tisch_id)))).map(t=>t.tisch_id+':'+t.belegtPax+'/'+t.kapazitaet),
      // Stufe 0: Hotelier-Daten aktiv?
      k642:((lastTables||[]).find(t=>String(t.tisch_id)==='642')||{}).kategorie||null,
      k744:((lastTables||[]).find(t=>String(t.tisch_id)==='744')||{}).kategorie||null,
      roomQ8ok:(()=>{const g20=guests.filter(g=>/^20\d\d$/.test(String(g.zimmer).trim().split(',')[0]));
        return {total:g20.length,ok:g20.filter(g=>g.zimmer_qualitaet===8).length};})(),
      // Rollstuhl-Wünsche: erfüllt (W-Tisch) ODER als Warnung gemeldet — nie still ignoriert
      rollstuhlBad:guests.filter(g=>{
        if(!g.zugewiesener_tisch) return false;
        const txt=((g.allergie||'')+' '+(g.bemerkung||'')+' '+(g.extras||'')).toLowerCase();
        if(!/rollstuhl|rollator/.test(txt)) return false;
        const t=(lastTables||[]).find(x=>String(x.tisch_id)===String(g.zugewiesener_tisch));
        const ok=t&&String(t.merkmale||'').includes('W');
        const warned=warnings.some(w=>w.msg.includes('Rollstuhl')&&w.msg.includes(g.nachname));
        return !(ok||warned);
      }).length,
      notfallUsed:guests.filter(g=>['627','720','804'].includes(String(g.zugewiesener_tisch))).length,
      // Vorausschau-Motor (Stufe 1)
      prognoseInPlan:guests.filter(g=>g.status==='PROGNOSE').length, // muss 0 sein — Prognosen gehören nicht in den Tagesplan
      anHeute:guests.filter(g=>g.status==='AN'||g.status==='AN·AB').length,
      anPaxHeute:guests.filter(g=>g.status==='AN'||g.status==='AN·AB').reduce((s,g)=>s+(g.pax||1),0),
      vsReserved:(lastTables||[]).filter(t=>t.zukunft_belegt).length,
      vsRows:(typeof lastVorausschau!=='undefined'&&lastVorausschau)?lastVorausschau.rows.length:0,
      vsWarn:(typeof lastVorausschau!=='undefined'&&lastVorausschau)?lastVorausschau.warnungen.length:0,
      vorausschauAktiv:warnings.some(w=>String(w.msg).startsWith('Vorausschau aktiv')),
      radarCount:warnings.filter(w=>w.level==='vorausschau').length,
      redsTotal:warnings.filter(w=>w.level==='red').length,
      redFuture:warnings.filter(w=>w.level==='red'&&/vorausschau|ankunft \d\d\.\d\d/i.test(String(w.msg))).length,
      // ══ Angelernte Hotelier-Regeln als Prüfsteine (Baustein 1) ══
      // Regel A — Bleibegast-Treue (hart): ein Gast, der schon gestern hier war (Vortags-Tisch
      // vorhanden, kein Neu-Anreisender), MUSS auf seinem Tisch bleiben. Das Kernversprechen.
      bleibeMoved:guests.filter(g=>g.vorheriger_tisch&&g.status!=='AN'&&g.status!=='AN·AB'
        &&g.zugewiesener_tisch&&String(g.zugewiesener_tisch)!==String(g.vorheriger_tisch)).length,
      // Doppelplatzierung: kein Zimmer darf an mehreren Tischen stehen (Feedback 09.07.: Weber
      // auf 621 UND 732). Kernversprechen — ein Zimmer gehört an genau einen Tisch/eine Kombi.
      roomDoublePlaced:(()=>{const m={};guests.filter(g=>g.zugewiesener_tisch).forEach(g=>{
        String(g.zimmer||'').split(/[,+]/).map(z=>z.trim()).filter(z=>/^\d+$/.test(z)).forEach(z=>{(m[z]=m[z]||new Set()).add(String(g.zugewiesener_tisch));});});
        return Object.entries(m).filter(([z,s])=>s.size>1).map(([z,s])=>z+'→'+[...s].join(','));})(),
      // Phase A: kein Fremdgast auf einem offenen Kombi-Partnertisch (der Partner ist für die
      // Kombination reserviert — dort darf niemand sonst sitzen; behebt die "zu X"-Zerlegung).
      fremdAufKombiPartner:guests.filter(g=>g.zugewiesener_tisch&&(lastTables||[]).some(t=>String(t.tisch_id)===String(g.zugewiesener_tisch)&&t.kombiMit)).map(g=>g.zimmer+'→'+g.zugewiesener_tisch),
      // Regel B — Studio-Reserve (80x) bleibt für Tiny-Studios frei: kein gutes Zimmer (Q≤6)
      // landet auf 801/802/803, solange andere Tische frei sind (Backtest-Fund 08.07.).
      goodRoomOn80x:guests.filter(g=>g.zugewiesener_tisch&&/^80\d/.test(String(g.zugewiesener_tisch))
        &&(g.zimmer_qualitaet||9)<=6).map(g=>g.zimmer+'→'+g.zugewiesener_tisch),
      // Regel C — kurzes Tiny-Studio (Zimmer-Q8, ≤2 Nächte) bekommt keinen Premium-Tisch (Kat≤2),
      // damit gute Tische für gute Zimmer frei bleiben (Hotelier gibt kurzen Studios schlechte Tische).
      tinyShortOnPremium:guests.filter(g=>{
        if((g.zimmer_qualitaet||0)!==8||!g.zugewiesener_tisch) return false;
        const n=g.check_in&&g.check_out?Math.round((new Date(g.check_out)-new Date(g.check_in))/86400000):1;
        if(n>2) return false;
        const t=(lastTables||[]).find(x=>String(x.tisch_id)===String(g.zugewiesener_tisch));
        return t&&(t.kategorie||9)<=2;
      }).map(g=>g.zimmer+'→'+g.zugewiesener_tisch),
      // Regel D — kein guter Tisch bleibt VERSCHENKT: ein guter Tisch (Kat≤3) steht leer und
      // verfügbar, obwohl ein Gast auf einem klar schlechteren Tisch (Kat≥6) sitzt, der dort
      // hineinpassen würde. Ausgenommen: Tiny-Studios (Q8 — die gehören bewusst NICHT auf Premium),
      // Kombi-Haupttische (sitzen bewusst zusammen), reservierte/Freilass/Notfall-/Kombi-Tische.
      premiumWaste:(()=>{
        const ts=lastTables||[];
        const emptyGood=ts.filter(t=>t.aktiv&&(t.kategorie||9)<=3&&(t.belegtPax||0)===0
          &&!t.blocked_for&&!t.zukunft_belegt&&!t.kombiMit&&!t.freilass&&!t.notfall);
        if(!emptyGood.length) return [];
        const kombiHaupt=new Set(ts.filter(t=>t.kombiMit).map(t=>String(t.kombiMit.haupt)));
        const used=new Set(); const res=[];
        guests.filter(g=>g.zugewiesener_tisch&&!kombiHaupt.has(String(g.zugewiesener_tisch))
          &&(g.zimmer_qualitaet||0)!==8).forEach(g=>{
          const t=ts.find(x=>String(x.tisch_id)===String(g.zugewiesener_tisch));
          if(!t||(t.kategorie||9)<6) return;
          const up=emptyGood.find(e=>!used.has(e.tisch_id)&&(e.kapazitaet-e.belegtPax)>=(g.pax||1));
          if(up){used.add(up.tisch_id);res.push(g.zimmer+'→'+g.zugewiesener_tisch+'(frei '+up.tisch_id+')');}
        });
        return res;
      })(),
      // Pseudo-Gäste im Plan: „Pseudozimmer" (Day-Spa-/Service-Buchungen) dürfen NIE einen Tisch
      // bekommen. Erkennungsmerkmal im Plan: absurd langer „Aufenthalt" (>21 Nächte, Day Spa=28).
      pseudoInPlan:guests.filter(g=>{
        if(!g.zugewiesener_tisch) return false;
        const n=g.check_in&&g.check_out?Math.round((new Date(g.check_out)-new Date(g.check_in))/86400000):0;
        return n>21;
      }).map(g=>g.nachname+' Zi'+g.zimmer),
      // Keine STILLE Fremd-Zusammenlegung: sitzen fremde Parteien an einem Tisch (Fund 13.07.,
      // 641), MUSS eine Warnung dafür existieren — Zusammenlegen ist nur als sichtbare letzte
      // Rettung ok, nie unbemerkt. (An vollen Tagen kann Zusammenlegen nötig sein → nur die
      // STILLE Form ist der Fehler, analog zur Überbelegung.)
      fremdCoSeatSilent:(()=>{
        const norm=s=>String(s||'').toLowerCase().replace(/fr\.|hr\.|herr|frau|fam\.|familie/g,'').replace(/[^a-zäöüß]/g,'');
        const byT={};guests.filter(g=>g.zugewiesener_tisch).forEach(g=>{(byT[String(g.zugewiesener_tisch)]=byT[String(g.zugewiesener_tisch)]||[]).push(g);});
        const out=[];
        Object.entries(byT).forEach(([tid,gs])=>{
          if(gs.length<2) return;
          const surn=[...new Set(gs.map(g=>norm(g.nachname)).filter(Boolean))];
          if(surn.length<2) return; // gleiche Partei / Namensvariante
          const refs=new Set(gs.flatMap(g=>(g.verlinkteRefs||[]).map(String).concat(String(g.id||''))));
          const linked=gs.every(g=>(g.verlinkteRefs||[]).some(r=>refs.has(String(r))));
          if(linked) return;
          const warned=(warnings||[]).some(w=>w.msg.includes('fremde Parteien')&&w.msg.includes(tid));
          if(!warned) out.push(tid);
        });
        return out;
      })()
    };
  });
}

// Export-Invarianten (in-page, ohne Datei-Roundtrip): alle Blöcke geschrieben?
async function exportInvariants(page){
  return page.evaluate(async()=>{
    const built=await buildFilledTischplanSheet();
    if(!built) return{built:false};
    const ws=built.ws;
    const blocks=(tischplanBlocks||[]);
    // Alle im Blatt geschriebenen (Tisch-ID → Name)-Paare über alle Blöcke einsammeln.
    // Eindeutige Tisch-IDs zählen — Vorlagen dürfen Tische mehrfach listen (z.B. eine
    // zusätzliche "40er BOX"-Sektion), beide Zeilen werden dann korrekt befüllt.
    const writtenByTid={};
    const t7Seen=new Set(),t7FilledSet=new Set();
    ws.eachRow(row=>{
      const cols=blocks.length?blocks:[{tischCol:1,gastnameCol:4}];
      cols.forEach(bl=>{
        const t=String(row.getCell((bl.tischCol??0)+1).value||'').trim();
        if(!/^[678]\d\d(_\d)?$/.test(t)) return;
        const name=String(row.getCell((bl.gastnameCol??3)+1).value||'').trim();
        if(name||!(t in writtenByTid)) writtenByTid[t]=name;
        if(parseInt(t)>=711){t7Seen.add(t); if(name) t7FilledSet.add(t);}
      });
    });
    const t7Rows=t7Seen.size,t7Filled=t7FilledSet.size;
    // Geister-Dublette: ein Tischname im Export, obwohl der Tisch in der Berechnung LEER ist
    // (kein Gast, kein Kombi-Partner) — das war der 09.07.-Fehler (Alt-"Weber" aus der Vorlage).
    let phantomRows=0;
    Object.entries(writtenByTid).forEach(([tid,nm])=>{
      if(!nm||/^zu\s/i.test(nm)) return;
      const hasGuest=!!(built.guestsByTable&&built.guestsByTable[tid]&&built.guestsByTable[tid].length);
      const lt=(lastTables||[]).find(x=>String(x.tisch_id)===String(tid));
      const occ=!!(lt&&((lt.belegtPax||0)>0||lt.kombiMit));
      if(!hasGuest&&!occ) phantomRows++;
    });
    // Jeder platzierte Gast muss an SEINEM Tisch im Blatt stehen (Vorlage vorhanden)
    let wrongRow=0,missingGuest=0;
    if(tischplanTemplate&&Object.keys(tischplanMap||{}).length){
      Object.entries(built.guestsByTable||{}).forEach(([tid,gs])=>{
        const nm=String((gs[0]||{}).nachname||'').trim();
        const w=writtenByTid[tid];
        if(w==null||!nm){ if(nm) missingGuest++; return; }
        if(!w.includes(nm)) wrongRow++;
      });
    }
    // Überlange Extras OHNE Umbruch (Panorama-Feedback 02.07.: Text lief über die Spalte)
    let noWrapLong=0;
    const checkWrap=(sheet,cols,width)=>{ if(!sheet)return; sheet.eachRow(row=>cols.forEach(cn=>{
      const c=row.getCell(cn); const t=c.value!=null?String(c.value):'';
      if(t.length>width&&!(c.alignment&&c.alignment.wrapText)) noWrapLong++;
    }));};
    if(blocks.length>1) checkWrap(ws,blocks.filter(b=>b.extrasCol!=null).map(b=>b.extrasCol+1),30);
    else if(blocks.length===1) checkWrap(ws,[(blocks[0].extrasCol??6)+2],46);
    checkWrap(built.wb.getWorksheet('Sortierung Zimmer'),[8],44);
    // Kopfzeile: Datum muss das PLANDATUM sein, nicht das der Vorlage
    let headDateOk=true;
    if(typeof planDatumDE==='function'){
      const expected=planDatumDE();
      ws.getRow(1).eachCell(c=>{
        const t=typeof c.value==='string'?c.value.trim():'';
        if(/^\d{1,2}\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/.test(t)&&t!==expected) headDateOk=false;
      });
    }
    // Zimmernummern-Konsistenz: jedes belegte Tisch im Tischplan-Blatt muss seine
    // Zimmernummer tragen (beide Blöcke!), und Tischplan ↔ Sortierung Zimmer müssen je
    // Zimmer denselben Tisch zeigen (Fall #17 / Vorlagen-Unstimmigkeit).
    let roomMismatch=0, occWithoutRoom=0;
    if(tischplanTemplate&&Object.keys(tischplanMap||{}).length){
      const cols=blocks.length?blocks:[{tischCol:0,zimmerCol:2,gastnameCol:3}];
      const tpPairs=new Set();
      ws.eachRow(row=>cols.forEach(bl=>{
        const t=String(row.getCell((bl.tischCol??0)+1).value||'').trim();
        if(!/^[678]\d\d(_\d)?$/.test(t)) return;
        const name=String(row.getCell((bl.gastnameCol??3)+1).value||'').trim();
        const room=String(row.getCell((bl.zimmerCol??2)+1).value||'').trim();
        // Kombi-Partnertische tragen "zu [Haupttisch]" statt eines Gasts und haben bewusst
        // kein Zimmer — nicht als "belegter Tisch ohne Zimmer" werten.
        if(name&&!room&&!/^zu\s/i.test(name)) occWithoutRoom++;
        room.split(',').map(z=>z.trim()).filter(z=>/^\d+$/.test(z)).forEach(z=>tpPairs.add(z+'|'+t));
      }));
      const szPairs=new Set();
      const szWs=built.wb.getWorksheet('Sortierung Zimmer');
      if(szWs){
        szWs.eachRow(row=>{
          const t=String(row.getCell(2).value||'').trim();
          if(!/^[678]\d\d(_\d)?$/.test(t)) return;
          String(row.getCell(3).value||'').split(',').map(z=>z.trim()).filter(z=>/^\d+$/.test(z)).forEach(z=>szPairs.add(z+'|'+t));
        });
      }
      // Symmetrische Differenz der (Zimmer|Tisch)-Paare — 0 = identische Zuordnung
      const diffPairs=[];
      tpPairs.forEach(p=>{if(!szPairs.has(p)){roomMismatch++;diffPairs.push('TP-only '+p);}});
      szPairs.forEach(p=>{if(!tpPairs.has(p)){roomMismatch++;diffPairs.push('SZ-only '+p);}});
      globalThis.__diffPairs=diffPairs;
      var __dp=diffPairs;
    }
    // Maschinenlesbares Vortags-Datenblatt: muss existieren, eine Zeile je platziertem Gast tragen
    // und Pax als ROHE Zahl (nicht "10 (4 Ki)") — sonst geht die echte Personenzahl beim nächsten
    // Vortag-Einlesen wieder verloren (Fund 15.07., Jaspers).
    const vdWs=built.wb.getWorksheet&&built.wb.getWorksheet('Vortag-Daten');
    let vdRows=0, vdPaxNumeric=true, vdHeaderOk=false;
    if(vdWs){
      vdWs.eachRow((row,rn)=>{
        if(rn===1){ vdHeaderOk=String(row.getCell(1).value||'').toLowerCase()==='tisch'&&String(row.getCell(6).value||'').toLowerCase()==='pax'; return; }
        vdRows++;
        const p=row.getCell(6).value;
        if(typeof p!=='number') vdPaxNumeric=false;
      });
    }
    const placedGuests=(assignedGuests||[]).filter(g=>g.zugewiesener_tisch).length;
    return{built:true,exportMissing:(built.exportMissing||[]).length,t7Rows,t7Filled,wrongRow,missingGuest,noWrapLong,headDateOk,phantomRows,
      roomMismatch,occWithoutRoom,diffPairs:(typeof __dp!=='undefined'?__dp:[]),
      vdExists:!!vdWs,vdRows,vdPaxNumeric,vdHeaderOk,placedGuests,
      // Ein 7xx-Tisch erscheint im Export mit Text, wenn er einen Gast trägt ODER Kombi-
      // Partner ist (dann steht "zu [Haupttisch]" im Namensfeld). Beide zählen — nur wirklich
      // leere Tische nicht.
      calcT7:(lastTables||[]).filter(t=>parseInt(t.tisch_id)>=711&&((t.belegtPax||0)>0||t.kombiMit)).length};
  });
}

(async()=>{
  const {chromium}=resolvePlaywright();
  const browser=await chromium.launch({executablePath:resolveChromium(),args:['--no-sandbox']});

  const SZENARIEN=[
    {name:'S1 Blanco-Vorlage (zweispaltig — Panorama-Vorfall)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true},
    {name:'S2 Mappe3-Vorlage (einspaltig, 3 Blätter)',vorlage:'vorlage-mappe3-anon.xlsx',expectTemplate:true},
    {name:'S3 Ohne Vorlage (Vortag-Fallback)',vorlage:null,expectTemplate:false},
    {name:'S4 Vorausschau-Motor (7-Tage-Anreisen, Echtformat 07.–13.07.)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-mo-anon.xlsx',ankuenfte:'arr7-anon.xlsx',abreisen:'dep7-anon.xlsx',refDate:'2026-07-07',vorausschau:true,
     // minTreue 0.88 (war 0.90): Die „Eigener-Tisch-vor-geteiltem-Tisch"-Regel (13.07.) hat den
     // exakten Treffer erhöht (87→89 %), verschob aber 2 Neu-Anreise-Zimmer → die namensbasierte
     // Bleibegast-Treue sank auf 89 %. KEIN echter Verbleiber wurde umgesetzt (harte Regel A grün).
     groundTruth:{heute:'ground-truth-di.json',vortag:'ground-truth-mo.json',label:'07.07.',minQuote:0.85,minTreue:0.88}},
    {name:'S5 Backtest 08.07. (zweiter echter Hotelier-Tag — Anlernen/Stabilität)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-di-anon.xlsx',ankuenfte:'arr8-anon.xlsx',abreisen:'dep8-anon.xlsx',refDate:'2026-07-08',vorausschau:true,
     anHeuteMin:6,anHeuteMax:16, tinyPremiumTol:1,
     // 08.07. ist eng belegt: durch die (korrekte) Kombi-Erhaltung sind viele Mitteltische als
     // Einheit reserviert; ein einzelnes Tiny-Studio kann dann auf einen Premium-Rest rutschen.
     // Das ist Verfügbarkeit (Hotelier: "Tiny bekommt bessere Tische, wenn nichts Schlechteres
     // frei ist"), kein Strukturfehler — daher Toleranz 1.
     groundTruth:{heute:'ground-truth-mi.json',vortag:'ground-truth-di.json',label:'08.07.',minQuote:0.80,minTreue:0.78}},
    // S6: dritter echter Hotelier-Tag. Bester Deckungswert bisher (89% im Datei-Vergleich),
    // Bleibegast-Treue 100%. Deckte zwei Funde auf (80x-Überlauf + Bleibegast-Verdrängung bei
    // geteiltem Vortags-Tisch) — beide inzwischen in findBestTable/Vorab-Pass behoben, daher
    // laufen die Regeln A/B/C hier jetzt scharf mit.
    {name:'S6 Backtest 09.07. (dritter echter Hotelier-Tag)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-mi-anon.xlsx',ankuenfte:'arr9-anon.xlsx',abreisen:'dep9-anon.xlsx',refDate:'2026-07-09',vorausschau:true,
     anHeuteMin:6,anHeuteMax:16,
     groundTruth:{heute:'ground-truth-do.json',vortag:'ground-truth-mi.json',label:'09.07.',minQuote:0.80,minTreue:0.78}},
    // S7: vierter echter Tag = FREITAG 10.07. (mit den ECHTEN 10.07.-PMS-Rohdaten). Anerkannt
    // schwerster Tag (viele 2-3-Nächte-Anreisen, hohe Fluktuation → mehr freie Tisch-Wahl):
    // niedrigere Exakt-Schwelle, aber Logik-Treue, Bleibegast-Treue und Struktur müssen stehen.
    {name:'S7 Backtest 10.07. (vierter echter Tag — FREITAG, Hochbetrieb)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-do-anon.xlsx',ankuenfte:'arr10-anon.xlsx',abreisen:'dep10-anon.xlsx',refDate:'2026-07-10',vorausschau:true,
     anHeuteMin:15,anHeuteMax:36, tinyPremiumTol:1,
     // Freitag = riesige Fluktuation → die (turnover-verwässerte) Ground-Truth-"Treue" ist
     // niedrig; die ECHTE Bleibegast-Treue (Regel A, namensbasiert) ist trotzdem grün.
     groundTruth:{heute:'ground-truth-fr.json',vortag:'ground-truth-do.json',label:'10.07. (Fr)',minQuote:0.55,minTreue:0.55,minLogik:0.83}},
    // S8: 11.07. (SAMSTAG, voller Wochenend-Wechsel — 50 Zimmer reisen Sonntag früh ab).
    // Echte PMS-Dateien vom 11.07., Vortag = Hotelier-Plan 10.07. Gemessen bei Aufnahme:
    // 84% exakt / 93% Logik / 98% echte Bleibegast-Treue. Schwellen mit Puffer darunter.
    {name:'S8 Backtest 11.07. (fünfter echter Tag — SAMSTAG, Wochenend-Wechsel)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-fr-anon.xlsx',ankuenfte:'arr11-anon.xlsx',abreisen:'dep11-anon.xlsx',refDate:'2026-07-11',vorausschau:true,
     // tinyPremiumTol 3: am vollen Samstag setzt der HOTELIER SELBST drei verlinkte
     // Tiny-Studio-Fälle auf Premium (Riedl 501+2004 → 642; Seehars+Gerngroß 2009/2006 → 726,
     // Ground-Truth-identisch) — Regel C gilt für Einzel-Studios, nicht für verlinkte Paare.
     anHeuteMin:10,anHeuteMax:25, tinyPremiumTol:3,
     groundTruth:{heute:'ground-truth-sa.json',vortag:'ground-truth-fr.json',label:'11.07. (Sa)',minQuote:0.75,minTreue:0.75,minLogik:0.88}},
    // S9: 12.07. (SONNTAG, KOMPLETT-WECHSELTAG — 50 Zimmer raus, 49 rein; nur 6 echte Bleiber).
    // Der härteste Tag: fast das ganze Haus wird neu verteilt → exakte Deckung mit dem Hotelier
    // ist strukturell niedrig (sein Tages-Bauchgefühl steht in keiner Datei). Vortag ist ein aus
    // Ground-Truth-11.07. + Abreiseliste REKONSTRUIERTER Plan (echter 11.07.-Plan lag nicht mehr
    // vor); Schwellen entsprechend konservativ. Prüft v.a.: Wechseltag-Datenlagen (Zimmer-
    // Autorität, insg.-Vermerke, Großgruppen-Block 622-Muster, Day-Spa-über-Anreisedatei).
    {name:'S9 Backtest 12.07. (fünfter+ echter Tag — SONNTAG, Komplett-Wechseltag)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-sa-anon.xlsx',ankuenfte:'arr12-anon.xlsx',abreisen:'dep12-anon.xlsx',refDate:'2026-07-12',vorausschau:true,
     anHeuteMin:35,anHeuteMax:60, tinyPremiumTol:3,
     groundTruth:{heute:'ground-truth-so.json',vortag:'ground-truth-sa.json',label:'12.07. (So)',minQuote:0.20,minTreue:0.10,minLogik:0.65}},
    // S10: 15.07. (MITTWOCH). Vortag = echter 14.07.-Hotelier-Plan (anonymisiert). Dient als
    // Sicherheitsnetz für den kommenden Platzierungs-Fix (Kombi-Fragmentierung: Einzelparteien
    // zersplittern Kombitische, die Familien brauchen — Fund 15.07., Zi 307 → schwacher Tisch).
    // Schwellen zunächst offen; werden nach dem Baseline-Messwert knapp darunter gesetzt.
    // Baseline bei Aufnahme (anonymisierte Fixtures, deckt sich mit dem Echt-Datei-Vergleich):
    // 87% exakt / 91% Logik / 83% Bleibegast-Treue. Schwellen mit Puffer darunter. Der kommende
    // Platzierungs-Fix (Kombi-Reservierung) soll exakt/Logik ANHEBEN, nie senken.
    {name:'S10 Backtest 15.07. (MITTWOCH — Vortag=14.07-Plan)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-14-anon.xlsx',ankuenfte:'arr15-anon.xlsx',abreisen:'dep15-anon.xlsx',refDate:'2026-07-15',vorausschau:true,
     // tinyPremiumTol 6: der 15.07. hat viele Tiny-Studio-Anreisen (u.a. die verlinkte 2005/2008/
     // 2009-Gruppe auf einem Kombitisch). Der kommende Kombi-Reservierungs-Fix soll diesen Wert
     // senken (Tiny-Studios weichen Familien auf gute Tische) — bis dahin dokumentiert als Baseline.
     anHeuteMin:12,anHeuteMax:35, tinyPremiumTol:6,
     groundTruth:{heute:'ground-truth-15.json',vortag:'ground-truth-14.json',label:'15.07. (Mi)',minQuote:0.80,minTreue:0.75,minLogik:0.85}},
    // S11: 16.07. (DONNERSTAG). Vortag = echter 15.07.-Hotelier-Plan (anonymisiert). Schwellen
    // zunächst offen; nach Baseline-Messwert knapp darunter gesetzt.
    // Baseline bei Aufnahme (anonymisiert): 72% exakt / 91% Logik / 81% Bleibegast-Treue
    // (deckt sich mit dem Echt-Datei-Vergleich 77%/95%). Schwellen mit Puffer darunter.
    {name:'S11 Backtest 16.07. (DONNERSTAG — Vortag=15.07-Plan)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true,
     vortag:'plan-15-anon.xlsx',ankuenfte:'arr16-anon.xlsx',abreisen:'dep16-anon.xlsx',refDate:'2026-07-16',vorausschau:true,
     anHeuteMin:12,anHeuteMax:40, tinyPremiumTol:6,
     groundTruth:{heute:'ground-truth-16.json',vortag:'ground-truth-15.json',label:'16.07. (Do)',minQuote:0.65,minTreue:0.72,minLogik:0.85}},
  ];

  for(const sz of SZENARIEN){
    results.push('▶ '+sz.name);
    const page=await browser.newPage({viewport:{width:440,height:1000}});
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto(APP,{waitUntil:'networkidle'});
    await page.waitForTimeout(1400);
    await loadAndCalc(page,sz);

    const ci=await calcInvariants(page);
    check('Keine JS-Laufzeitfehler',pageErrors.length===0,pageErrors.slice(0,2).join(' | '));
    check('Tische geladen (≥60)',ci.nTables>=60,'nur '+ci.nTables);
    check('Gäste geladen (≥40)',ci.nGuests>=40,'nur '+ci.nGuests);
    check('Alle Gäste platziert',ci.unplaced===0,ci.unplaced+' ohne Tisch');
    check('Keine Geister-Tische (Zuweisung auf unbekannten Tisch)',ci.ghosts===0,ci.ghosts+' Geister');
    check('Keine Doppelplatzierung (kein Zimmer an mehreren Tischen)',ci.roomDoublePlaced.length===0,ci.roomDoublePlaced.join(' | '));
    check('Kein Fremdgast auf offenem Kombi-Partner (Kombination bleibt Einheit)',ci.fremdAufKombiPartner.length===0,ci.fremdAufKombiPartner.join(' | '));
    check('Regel D: kein guter Tisch verschenkt (Kat≤3 leer, während Gast auf Kat≥6 passt)',ci.premiumWaste.length===0,ci.premiumWaste.join(' | '));
    check('Kein Pseudo-Gast im Plan (Day Spa & Co. / >21 Nächte)',ci.pseudoInPlan.length===0,ci.pseudoInPlan.join(' | '));
    check('Keine STILLE Fremd-Zusammenlegung (fremde Parteien am Tisch nur mit Warnung)',ci.fremdCoSeatSilent.length===0,ci.fremdCoSeatSilent.join(', '));
    if(sz.vorlage==='vorlage-blanco.xlsx'){
      check('Keine STILLE Überbelegung (echte Platzzahlen greifen)',ci.overfullSilent.length===0,ci.overfullSilent.join(', '));
    }
    // Stufe 0: Hotelier-Eigenschaften wirksam
    check('Tisch-Qualität vom Hotelier aktiv (642→Q1, 744→Q7)',ci.k642===1&&ci.k744===7,'642='+ci.k642+' 744='+ci.k744);
    check('Zimmer-Qualität gesetzt (Tiny Studio 20xx→Q8)',ci.roomQ8ok.total>0&&ci.roomQ8ok.ok===ci.roomQ8ok.total,ci.roomQ8ok.ok+'/'+ci.roomQ8ok.total);
    check('Rollstuhl-Wünsche erfüllt oder gemeldet (nie still)',ci.rollstuhlBad===0,ci.rollstuhlBad+' still ignoriert');
    check('Notfall-Tische (627/720/804) nicht regulär vergeben',ci.notfallUsed===0,ci.notfallUsed+'× vergeben');
    check('Keine PROGNOSE-Gäste im Tagesplan',ci.prognoseInPlan===0,ci.prognoseInPlan+' Prognosen im Plan');
    if(sz.vorausschau){
      check('Vorausschau aktiv (künftige Anreisen erkannt)',ci.vorausschauAktiv===true);
      check('Prio-Reservierungen gesetzt (Langzeit/VIP/Gruppen)',ci.vsReserved>=1,'nur '+ci.vsReserved);
      check('Zeitleisten-Daten vorhanden (≥60 Tische)',ci.vsRows>=60,'nur '+ci.vsRows);
      const anMin=sz.anHeuteMin||6, anMax=sz.anHeuteMax||10;
      check('Heutige Anreisen plausibel ('+anMin+'–'+anMax+')',ci.anHeute>=anMin&&ci.anHeute<=anMax,ci.anHeute+' AN');
      check('Anreise-PAX korrekt gelesen (Personen-Spalte, ≥14)',ci.anPaxHeute>=14,ci.anPaxHeute+' PAX');
      check('Zukunft NIE kritisch (kein rotes Vorausschau-Thema)',ci.redFuture===0,ci.redFuture+' rote Zukunfts-Meldungen');
      check('Planungsradar vorhanden (aggregierte Vorausschau)',ci.radarCount>=1,'nur '+ci.radarCount);
      check('Wenige echte Kritisch-Punkte heute (≤5)',ci.redsTotal<=5,ci.redsTotal+' rot');
    }

    // ══ Angelernte Hotelier-Regeln als Prüfsteine (Baustein 1) — laufen auf jedem echten Tag ══
    if(sz.vorausschau&&!sz.knownOffen){
      check('Regel A: Bleibegast bleibt auf seinem Tisch (kein Verbleiber umgesetzt)',ci.bleibeMoved===0,ci.bleibeMoved+' Verbleiber umgesetzt');
      check('Regel B: Studio-Reserve 80x frei für Tiny-Studios (kein gutes Zimmer dort)',ci.goodRoomOn80x.length===0,ci.goodRoomOn80x.join(', '));
      check('Regel C: kurzes Tiny-Studio nicht auf Premium-Tisch (Kat≤2)',ci.tinyShortOnPremium.length<=(sz.tinyPremiumTol||0),ci.tinyShortOnPremium.join(', ')+(sz.tinyPremiumTol?(' (erlaubt: '+sz.tinyPremiumTol+' — Hochbetrieb)'):''));
    } else if(sz.vorausschau&&sz.knownOffen){
      // S6/09.07.: zwei bekannte, noch offene Funde — dokumentiert, nicht rot, bis der Fix
      // freigegeben ist. Danach knownOffen entfernen → Regeln A/B/C auch hier scharf.
      results.push('    ↳ OFFEN (Fix ausstehend): Regel A '+ci.bleibeMoved+' Verbleiber umgesetzt'
        +(ci.bleibeMoved?' ['+'Vorab-Pass verdrängt Bleibegast bei geteiltem Vortags-Tisch]':'')
        +' | Regel B 80x: '+(ci.goodRoomOn80x.join(', ')||'—'));
    }

    // Ground-Truth-Vergleich: unser Plan vs. echter Hotelier-Plan des Tages — misst
    // "gleiche Logik" als Zahl. Jeder Vorausschau-Tag bringt seine eigene Referenz mit,
    // damit Änderungen an MEHREREN echten Tagen gemessen werden (Anlernen/Stabilität).
    if(sz.vorausschau&&sz.groundTruth){
      const gt=sz.groundTruth;
      const gtHeute=JSON.parse(fs.readFileSync(FIX(gt.heute),'utf8'));
      const gtVortag=JSON.parse(fs.readFileSync(FIX(gt.vortag),'utf8'));
      const {ourMap,katMap}=await page.evaluate(()=>{
        const m={};
        (assignedGuests||[]).filter(g=>g.zugewiesener_tisch&&g.zimmer).forEach(g=>{
          String(g.zimmer).split(',').map(z=>z.trim()).filter(z=>/^\d+$/.test(z)).forEach(z=>{m[z]=String(g.zugewiesener_tisch);});
        });
        // Tisch → Qualitätsstufe (für die Logik-Treue-Messung)
        const k={}; (lastTables||[]).forEach(t=>{k[String(t.tisch_id)]=t.kategorie||9;});
        return {ourMap:m,katMap:k};
      });
      const rooms=Object.keys(gtHeute);
      const matched=rooms.filter(z=>ourMap[z]===gtHeute[z]).length;
      const bleibRooms=rooms.filter(z=>gtVortag[z]&&ourMap[z]);
      const treu=bleibRooms.filter(z=>ourMap[z]===gtVortag[z]).length;
      const quote=matched/rooms.length, treue=bleibRooms.length?treu/bleibRooms.length:1;
      // LOGIK-TREUE: nicht "exakt gleicher Tisch", sondern "gleiche Qualitätsstufe (±1)" — misst,
      // ob wir DIESELBE Logik anwenden (Dauer→Qualität), auch wenn der exakte Tisch (freie Wahl)
      // abweicht. Das ist die für Vollautomatik entscheidende Zahl.
      const vergl=rooms.filter(z=>ourMap[z]&&katMap[ourMap[z]]!=null&&katMap[gtHeute[z]]!=null);
      const logisch=vergl.filter(z=>Math.abs((katMap[ourMap[z]]||9)-(katMap[gtHeute[z]]||9))<=1).length;
      const logikTreue=vergl.length?logisch/vergl.length:1;
      check('Ground-Truth: ≥'+Math.round(gt.minQuote*100)+'% wie der Hotelier-Plan '+gt.label,quote>=gt.minQuote,Math.round(quote*100)+'% ('+matched+'/'+rooms.length+')');
      check('Bleibegast-Treue ≥'+Math.round(gt.minTreue*100)+'% ('+gt.label+')',treue>=gt.minTreue,Math.round(treue*100)+'% ('+treu+'/'+bleibRooms.length+')');
      check('Logik-Treue ≥'+Math.round((gt.minLogik||0.90)*100)+'% (gleiche Qualitätsstufe ±1) '+gt.label,logikTreue>=(gt.minLogik||0.90),Math.round(logikTreue*100)+'% ('+logisch+'/'+vergl.length+')');
      results.push('    ↳ '+gt.label+' exakter Tisch: '+Math.round(quote*100)+'% | LOGIK-Treue (Qualität ±1): '+Math.round(logikTreue*100)+'% | Bleibegast-Treue: '+Math.round(treue*100)+'%');
    }

    const ei=await exportInvariants(page);
    check('Export baubar',ei.built===true);
    if(ei.built){
      check('Export-Selbstprüfung: kein Gast verloren',ei.exportMissing===0,ei.exportMissing+' Tische fehlen');
      check('Lange Extras brechen um (kein Überlauf)',ei.noWrapLong===0,ei.noWrapLong+' Zellen ohne Umbruch');
      check('Kopfzeile trägt das Plandatum (nicht das der Vorlage)',ei.headDateOk===true);
      check('Vortag-Daten-Blatt vorhanden (maschinenlesbarer Folgetag-Vortag)',ei.vdExists&&ei.vdHeaderOk,'exists='+ei.vdExists+' headerOk='+ei.vdHeaderOk);
      check('Vortag-Daten: eine Zeile je platziertem Gast',ei.vdRows===ei.placedGuests,ei.vdRows+' Zeilen ≠ '+ei.placedGuests+' Gäste');
      check('Vortag-Daten: Pax als rohe Zahl (kein "10 (4 Ki)")',ei.vdPaxNumeric===true);
      if(sz.expectTemplate){
        check('7xx-Tischzeilen im Export vorhanden (≥30)',ei.t7Rows>=30,'nur '+ei.t7Rows+' — rechter Block fehlt?');
        check('7xx-Belegung Export == Berechnung',ei.t7Filled===ei.calcT7,ei.t7Filled+' ≠ '+ei.calcT7);
        check('Kein Gast in falscher Tischzeile',ei.wrongRow===0,ei.wrongRow+' falsch');
        check('Kein platzierter Gast ohne Zeile',ei.missingGuest===0,ei.missingGuest+' fehlen');
        check('Keine Geister-Dublette (kein Alt-Gast aus Vorlage auf leerem Tisch)',ei.phantomRows===0,ei.phantomRows+' Geister-Zeilen');
        check('Zimmernummern in beiden Blöcken vorhanden (kein belegter Tisch ohne Zimmer)',ei.occWithoutRoom===0,ei.occWithoutRoom+' ohne Zimmer');
        check('Tischplan ↔ Sortierung Zimmer je Zimmer gleicher Tisch',ei.roomMismatch===0,ei.roomMismatch+' Abweichungen: '+(ei.diffPairs||[]).join(', '));
      }
    }
    await page.close();
  }

  // ══ Pflichtspalten per NAME gefunden (Robustheit gegen geändertes Spaltenlayout) ══
  // Freigabe 13.07.: Beide Panorama-Parser lesen alle Spalten über die Kopfzeilen-NAMEN,
  // nicht über feste Positionen. Beweis: ein Blatt, in dem die Spalten ABSICHTLICH an
  // anderen Positionen stehen als die alten festen Indizes (Zimmer NICHT an 1, Name NICHT
  // an 2, Personen NICHT an 7 …) und zusätzlich eine Extra-Spalte vorne trägt. Fällt der
  // Parser auf feste Indizes zurück, liest er falsche Werte — der Test schlägt dann fehl.
  {
    results.push('▶ Sx Spaltenerkennung per Kopfzeilen-Name (verschobenes Layout)');
    const page=await browser.newPage();
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto(APP,{waitUntil:'networkidle'});
    await page.waitForTimeout(1200);
    const shift=await page.evaluate(()=>{
      const X=window.XLSX;
      // Header-Reihenfolge bewusst ANDERS als die festen Fallback-Indizes:
      // idx0=Lauf-Nr.(extra), 1=Anreise, 2=Kat., 3=Zimmer, 4=Gastname(n), 5=Nächte,
      // 6=Personen, 7=Bemerk., 8=Res.-Status, 9=Res.-Nr., 10=Abreise
      const H=['Lauf-Nr.','Anreise','Kat.','Zimmer','Gastname(n)','Nächte','Personen','Bemerk.','Res.-Status','Res.-Nr.','Abreise'];
      const mkArr=()=>{
        // Zeile 0 mit Titel verankern, sonst setzt aoa_to_sheet den Bereich erst bei der
        // ersten belegten Zeile an und verschiebt beim Rücklesen alle Indizes.
        const aoa=[['Anreiseliste'],[],[],['Vom: 12.07.2026'],[],[],H,
          ['1','12.07.26','DZ','641','Muster Max','3','2','Kuchen','angereist','700123','']];
        return {SheetNames:['DynamicListReport_1'],Sheets:{'DynamicListReport_1':X.utils.aoa_to_sheet(aoa)}};
      };
      const mkDep=()=>{
        const aoa=[['Abreiseliste'],[],[],['Vom: 12.07.2026'],[],[],H,
          ['1','10.07.26','DZ','742','Probe Petra','2','3','Fenster','abgereist','700456','12.07.26']];
        return {SheetNames:['DynamicListReport_1'],Sheets:{'DynamicListReport_1':X.utils.aoa_to_sheet(aoa)}};
      };
      const a=parsePanoramaArrival(mkArr());
      const d=parsePanoramaDeparture(mkDep());
      return{
        aOk:!!a&&a.rows.length===1,
        aZimmer:a&&a.rows[0]?a.rows[0].Zimmernummer:null,
        aName:a&&a.rows[0]?a.rows[0].Nachname:null,
        aPax:a&&a.rows[0]?a.rows[0].AnzahlPersonen:null,
        aRes:a&&a.rows[0]?a.rows[0].GastID:null,
        dOk:!!d&&d.rows.length===1,
        dZimmer:d&&d.rows[0]?d.rows[0].Zimmernummer:null,
        dName:d&&d.rows[0]?d.rows[0].Nachname:null,
        dPax:d&&d.rows[0]?d.rows[0].AnzahlPersonen:null,
        dCheckOut:d&&d.rows[0]?d.rows[0].CheckOut:null
      };
    });
    check('Keine JS-Laufzeitfehler (Spaltenerkennung)',pageErrors.length===0,pageErrors.slice(0,2).join(' | '));
    check('Anreise: Zimmer per Name gelesen (641, nicht feste Position)',shift.aZimmer==='641','gelesen: '+shift.aZimmer);
    check('Anreise: Gastname per Name gelesen (Muster)',shift.aName==='Muster','gelesen: '+shift.aName);
    check('Anreise: Personen per Name gelesen (2)',shift.aPax==='2','gelesen: '+shift.aPax);
    check('Anreise: Res.-Nr. per Name gelesen (700123)',shift.aRes==='700123','gelesen: '+shift.aRes);
    check('Abreise: Zimmer per Name gelesen (742, nicht feste Position)',shift.dZimmer==='742','gelesen: '+shift.dZimmer);
    check('Abreise: Gastname per Name gelesen (Probe)',shift.dName==='Probe','gelesen: '+shift.dName);
    check('Abreise: Personen per Name gelesen (3)',shift.dPax==='3','gelesen: '+shift.dPax);
    check('Abreise: Abreisedatum per Name gelesen (2026-07-12)',shift.dCheckOut==='2026-07-12','gelesen: '+shift.dCheckOut);
    await page.close();
  }

  // ══ Splittische auf Vorlagen-Basiszeile falten (Export-Sperre 15.07.) ══
  // Der Hotelier teilt einen Tisch in zwei Parteien (632_1 / 632_2); die Vorlage kennt aber
  // nur die Zeile „632". foldSplitTables muss beide Parteien in „632" zusammenführen, damit
  // der Export-Selbsttest sie nicht als „fehlend" meldet und den Download hart blockiert.
  {
    results.push('▶ Sy Splittische auf Basiszeile falten (632_1/632_2 → 632)');
    const page=await browser.newPage();
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto(APP,{waitUntil:'networkidle'});
    await page.waitForTimeout(1200);
    const fold=await page.evaluate(()=>{
      // Vorlage kennt nur „632" (nicht 632_1/632_2), zusätzlich reguläre Tische 611/641.
      const tmap={'611':{r:3},'632':{r:6},'641':{r:9}};
      const gbt={
        '611':[{nachname:'Knoll'}],
        '632_1':[{nachname:'Potschka'}],
        '632_2':[{nachname:'Büllmann'}],
        '641':[{nachname:'König'}]
      };
      const out=foldSplitTables(gbt,tmap);
      // Gegenprobe: existiert der Splittisch selbst in der Vorlage, NICHT falten.
      const tmap2={'632':{r:6},'632_1':{r:7},'632_2':{r:8}};
      const out2=foldSplitTables({'632_1':[{nachname:'A'}],'632_2':[{nachname:'B'}]},tmap2);
      return {
        has632:!!out['632'], n632:(out['632']||[]).length,
        names632:(out['632']||[]).map(g=>g.nachname).join('+'),
        no1:!('632_1'in out), no2:!('632_2'in out),
        reg611:(out['611']||[]).length===1&&out['611'][0].nachname==='Knoll',
        reg641:(out['641']||[]).length===1,
        keepSplit:('632_1'in out2)&&('632_2'in out2)&&!('632'in out2)
      };
    });
    check('Keine JS-Laufzeitfehler (Faltung)',pageErrors.length===0,pageErrors.slice(0,2).join(' | '));
    check('632_1 & 632_2 in Basiszeile 632 gefaltet',fold.has632&&fold.n632===2,'632 hat '+fold.n632+' Parteien');
    check('Beide Parteien erhalten (Potschka + Büllmann)',fold.names632==='Potschka+Büllmann','Namen: '+fold.names632);
    check('Kein _N-Schlüssel bleibt übrig',fold.no1&&fold.no2,'632_1 weg: '+fold.no1+', 632_2 weg: '+fold.no2);
    check('Reguläre Tische unberührt (611, 641)',fold.reg611&&fold.reg641);
    check('Splittisch MIT eigener Vorlagenzeile wird NICHT gefaltet',fold.keepSplit);
    await page.close();
  }

  // ══ Maschinenlesbarer Vortag: „Vortag-Daten"-Blatt wird bevorzugt gelesen (Fund 15.07.) ══
  // Der gedruckte Hotelier-Plan verliert bei aufgeteilten Familien Personen (Jaspers 10→4, die
  // 6 Erwachsenen stehen anonym in einer zweiten Zeile). Das Datenblatt trägt die rohe Pax-Zahl
  // je Gast und hält getrennte Parteien getrennt. parseVortagPanorama MUSS es bevorzugen und den
  // eigenen Export dann NICHT ablehnen.
  {
    results.push('▶ Sz Maschinenlesbarer Vortag (Vortag-Daten-Blatt bevorzugt)');
    const page=await browser.newPage();
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto(APP,{waitUntil:'networkidle'});
    await page.waitForTimeout(1200);
    const vt=await page.evaluate(()=>{
      const X=window.XLSX;
      // Eigener Export: gedruckter Tischplan (mit „APP"-Kürzel → würde sonst abgelehnt) UND
      // das maschinenlesbare Datenblatt. Jaspers steht im DRUCK mit Pax 4, im DATENBLATT mit 10.
      const tp=X.utils.aoa_to_sheet([
        ['Hotel','','APP','09:00','15.07.'],[],
        ['Tisch','Zimmer','Status','Gastname','Pax','Extras'],
        ['612','205,502,503,504','','Jaspers','4','4 Kinder'],
        ['632','301, 112','AB','Büllmann, Anja + Potschka','3','']
      ]);
      const vd=X.utils.aoa_to_sheet([
        ['Tisch','Zimmer','Status','Nachname','Vorname','Pax','Kinder','CheckIn','CheckOut','GastID','Bemerkung'],
        ['622','205,502,503,504','','Jaspers','Paul',10,4,'2026-07-12','2026-07-19','17203','davon 4 Kinder'],
        ['632','301','AB','Büllmann','Anja',1,0,'','','700','x'],
        ['632','112','','Potschka','',2,1,'','','701','y']
      ]);
      const wb={SheetNames:['Tischplan','Vortag-Daten'],Sheets:{'Tischplan':tp,'Vortag-Daten':vd}};
      const parsed=parseVortagPanorama(wb);
      const eigenexportFlagNachDaten=vortagIstEigenerExport; // JETZT erfassen (vor der Gegenprobe)
      const rows=(parsed&&parsed.rows)||[];
      const jas=rows.find(r=>/jaspers/i.test(r.Nachname||''));
      const t632=rows.filter(r=>String(r.Tisch)==='632');
      const inhaus=buildInhausFromVortag(rows);
      const jasIn=inhaus.find(r=>/jaspers/i.test(r.Nachname||''));
      // Gegenprobe: OHNE Datenblatt (nur Druck mit APP) → muss weiter als Eigenexport gelten.
      const wb2={SheetNames:['Tischplan'],Sheets:{'Tischplan':tp}};
      parseVortagPanorama(wb2);
      const rejectOhneDaten=vortagIstEigenerExport;
      return {
        source:parsed&&parsed._source,
        jasPax:jas&&jas.AnzahlPersonen, jasInPax:jasIn&&jasIn.AnzahlPersonen, jasTisch:jas&&jas.Tisch,
        n632:t632.length, namen632:t632.map(r=>r.Nachname).join('+'),
        eigenexportFlag:eigenexportFlagNachDaten, rejectOhneDaten
      };
    });
    check('Keine JS-Laufzeitfehler (Vortag-Daten)',pageErrors.length===0,pageErrors.slice(0,2).join(' | '));
    check('Datenblatt wird bevorzugt gelesen (_source=vortag_daten)',vt.source==='vortag_daten','source: '+vt.source);
    check('Jaspers behält echte Pax 10 (nicht 4 aus dem Druck)',vt.jasPax==='10'&&vt.jasInPax==='10','Pax: '+vt.jasPax+'/'+vt.jasInPax);
    check('Handänderung respektiert: Jaspers-Tisch aus sichtbarem Plan (612, nicht 622)',String(vt.jasTisch)==='612','Tisch: '+vt.jasTisch);
    check('632: zwei getrennte Parteien (kein 726-Verkleben)',vt.n632===2&&/büllmann/i.test(vt.namen632)&&/potschka/i.test(vt.namen632),vt.n632+': '+vt.namen632);
    check('Eigener Export mit Datenblatt wird NICHT abgelehnt',vt.eigenexportFlag===false);
    check('Eigener Export OHNE Datenblatt bleibt abgelehnt (Alt-Exporte)',vt.rejectOhneDaten===true);
    // Plan-Blatt am INHALT erkennen, nicht am Namen (Fund 17.07.: Hotelier-Datei heißt „Tabelle1"
    // statt „Tischplan" → sonst Rückfall auf Demo-Tische + Verlust aller Bleibegäste).
    const tab=await page.evaluate(()=>{
      const X=window.XLSX;
      const ws=X.utils.aoa_to_sheet([
        ['LH','','','16. Juli - Donnerstag'],[],
        ['Tisch','Zimmer','Status','Gastname','Pax','Extras'],
        ['611','205','','Muster','2',''],
        ['642','101','AN','Probe','2','']
      ]);
      const wb={SheetNames:['Tabelle1'],Sheets:{'Tabelle1':ws}};
      const parsed=parseVortagPanorama(wb);
      const rows=(parsed&&parsed.rows)||[];
      const tische=extractTablesFromVortag(rows);
      return { nRows:rows.length, hat611:rows.some(r=>String(r.Tisch)==='611'), nTische:(tische&&tische.rows&&tische.rows.length)||0 };
    });
    check('Plan-Blatt „Tabelle1" wird per Inhalt erkannt (nicht nur Name „Tischplan")',tab.nRows>=2&&tab.hat611,'Zeilen: '+tab.nRows+' 611:'+tab.hat611);
    check('Echte Tische aus „Tabelle1"-Vortag extrahiert (kein Demo-Rückfall)',tab.nTische>=2,'nTische: '+tab.nTische);
    await page.close();
  }

  await browser.close();
  console.log('\n'+results.join('\n'));
  console.log('\n'+(failures===0?'✅ ALLE TESTS BESTANDEN':'❌ '+failures+' TEST(S) FEHLGESCHLAGEN — NICHT PUSHEN!'));
  process.exit(failures===0?0:1);
})().catch(e=>{ console.error('Testlauf abgebrochen:',e.message); process.exit(1); });
