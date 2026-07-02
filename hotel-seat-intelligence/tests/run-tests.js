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

async function loadAndCalc(page,{vorlage}){
  if(vorlage) { await page.setInputFiles('#fi-tgst-vorlage',FIX(vorlage)); await page.waitForTimeout(1000); }
  await page.setInputFiles('#fi-tgst-vortag',FIX('vortag-anon.xlsx'));       await page.waitForTimeout(1000);
  await page.setInputFiles('#fi-tgst-ankuenfte',FIX('anreise-anon.xlsx'));   await page.waitForTimeout(1000);
  await page.setInputFiles('#fi-tgst-abreisen',FIX('abreise-anon.xlsx'));    await page.waitForTimeout(1000);
  await page.evaluate(d=>{ const rd=el('ref-date'); if(rd) rd.value=d; },REF_DATE);
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
        &&!warnings.some(w=>w.msg.includes(String(t.tisch_id)))).map(t=>t.tisch_id+':'+t.belegtPax+'/'+t.kapazitaet)
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
    return{built:true,exportMissing:(built.exportMissing||[]).length,t7Rows,t7Filled,wrongRow,missingGuest,noWrapLong,headDateOk,
      calcT7:(lastTables||[]).filter(t=>parseInt(t.tisch_id)>=711&&(t.belegtPax||0)>0).length};
  });
}

(async()=>{
  const {chromium}=resolvePlaywright();
  const browser=await chromium.launch({executablePath:resolveChromium(),args:['--no-sandbox']});

  const SZENARIEN=[
    {name:'S1 Blanco-Vorlage (zweispaltig — Panorama-Vorfall)',vorlage:'vorlage-blanco.xlsx',expectTemplate:true},
    {name:'S2 Mappe3-Vorlage (einspaltig, 3 Blätter)',vorlage:'vorlage-mappe3-anon.xlsx',expectTemplate:true},
    {name:'S3 Ohne Vorlage (Vortag-Fallback)',vorlage:null,expectTemplate:false},
  ];

  for(const sz of SZENARIEN){
    results.push('▶ '+sz.name);
    const page=await browser.newPage({viewport:{width:440,height:1000}});
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await page.goto(APP,{waitUntil:'networkidle'});
    await page.waitForTimeout(1400);
    await loadAndCalc(page,{vorlage:sz.vorlage});

    const ci=await calcInvariants(page);
    check('Keine JS-Laufzeitfehler',pageErrors.length===0,pageErrors.slice(0,2).join(' | '));
    check('Tische geladen (≥60)',ci.nTables>=60,'nur '+ci.nTables);
    check('Gäste geladen (≥40)',ci.nGuests>=40,'nur '+ci.nGuests);
    check('Alle Gäste platziert',ci.unplaced===0,ci.unplaced+' ohne Tisch');
    check('Keine Geister-Tische (Zuweisung auf unbekannten Tisch)',ci.ghosts===0,ci.ghosts+' Geister');
    if(sz.vorlage==='vorlage-blanco.xlsx'){
      check('Keine STILLE Überbelegung (echte Platzzahlen greifen)',ci.overfullSilent.length===0,ci.overfullSilent.join(', '));
    }

    const ei=await exportInvariants(page);
    check('Export baubar',ei.built===true);
    if(ei.built){
      check('Export-Selbstprüfung: kein Gast verloren',ei.exportMissing===0,ei.exportMissing+' Tische fehlen');
      check('Lange Extras brechen um (kein Überlauf)',ei.noWrapLong===0,ei.noWrapLong+' Zellen ohne Umbruch');
      check('Kopfzeile trägt das Plandatum (nicht das der Vorlage)',ei.headDateOk===true);
      if(sz.expectTemplate){
        check('7xx-Tischzeilen im Export vorhanden (≥30)',ei.t7Rows>=30,'nur '+ei.t7Rows+' — rechter Block fehlt?');
        check('7xx-Belegung Export == Berechnung',ei.t7Filled===ei.calcT7,ei.t7Filled+' ≠ '+ei.calcT7);
        check('Kein Gast in falscher Tischzeile',ei.wrongRow===0,ei.wrongRow+' falsch');
        check('Kein platzierter Gast ohne Zeile',ei.missingGuest===0,ei.missingGuest+' fehlen');
      }
    }
    await page.close();
  }

  await browser.close();
  console.log('\n'+results.join('\n'));
  console.log('\n'+(failures===0?'✅ ALLE TESTS BESTANDEN':'❌ '+failures+' TEST(S) FEHLGESCHLAGEN — NICHT PUSHEN!'));
  process.exit(failures===0?0:1);
})().catch(e=>{ console.error('Testlauf abgebrochen:',e.message); process.exit(1); });
