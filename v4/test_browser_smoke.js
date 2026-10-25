#!/usr/bin/env node
/* Browser interaction regression without a native browser: DOM/canvas mocks run the
   exact published inline JS and production model in an isolated Node VM.
   This is a regression check, not a physical validation or full browser E2E. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=__dirname;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const model=fs.readFileSync(path.join(root,'model.js'),'utf8');
assert.match(html,/const PI=Math\.PI/,'canvas and geometry must define PI locally');
const script=html.match(/<script src="model\.js\?v=[^"]+"><\/script><script>([\s\S]*?)<\/script>/);
assert.ok(script,'published UI script must follow the versioned model.js script');
new vm.Script(script[1],{filename:'index-inline.js'});
const ids={},downloaded=[],blobs=[];
for(const match of html.matchAll(/<(?:input|select|button|canvas|p|div|strong|tbody|section)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
 const tag=match[0],id=match[1];
 const value=tag.match(/\bvalue="([^"]*)"/);
 ids[id]={
  id,value:value?value[1]:'',textContent:'',innerHTML:'',
  disabled:false,clientWidth:550,clientHeight:400,width:550,height:400,
  listeners:{},addEventListener(event,cb){this.listeners[event]=cb},
  querySelectorAll(){return[]},
  getBoundingClientRect(){return{left:0,top:0,width:550,height:400}},
  getContext(){return new Proxy({},{
    get(t,k){return t[k]||(()=>{})},
    set(t,k,v){t[k]=v;return true}
  })}
 };
}
for(const [id,v] of Object.entries({
 rfMode:'all',scenario:'nominal',feedFactor:'1',conductivity:'.004',
 vesselWallMM:'.7',vesselEpsilonR:'3.8',vesselTanDelta:'.001',
 lossTangent:'.030',xi:'.46',T2star:'2',t2eNs:'420',esrWidthMHz:'.4',
 dMax:'100',hMax:'100',bMin:'10',eMax:'8'
})){
 assert.ok(ids[id],'missing input '+id);
 ids[id].value=v;
}
const window={devicePixelRatio:1,addEventListener(){}};
const document={
 getElementById(id){assert.ok(ids[id],'unknown ID '+id);return ids[id]},
 createElement(){return{click(){downloaded.push(this)}}}
};
const ctx={
 window,document,performance:{now(){return 0}},
 setTimeout(fn){fn();return 0},clearTimeout(){},
 console,Math,Number,String,Array,Object,Map,Set,Date,Error,Infinity,NaN,
 Blob:class{constructor(parts,options){this.parts=parts;this.options=options;blobs.push(this)}},URL:{createObjectURL(){return'blob:stub'},revokeObjectURL(){}}
};
vm.createContext(ctx);
vm.runInContext(model,ctx,{filename:'model.js',timeout:25000});
assert.ok(window.GeoMeshV4,'model exports GeoMeshV4');
vm.runInContext(script[1],ctx,{filename:'index-inline.js',timeout:45000});
assert.match(ids.status.textContent,/Готово:/);
assert.equal(ids.count.textContent.replace(/\s/g,''),'5000');
const fullFront=Number(ids.frontcount.textContent.replace(/\s/g,''));
assert.ok(fullFront>0);
ids.dMax.value='90';
ids.dMax.listeners.input();
const count90=Number(ids.count.textContent.replace(/\s/g,''));
assert.ok(count90>0&&count90<5000,'90mm filter removes some designs');
const front90=Number(ids.frontcount.textContent.replace(/\s/g,''));
assert.ok(front90>0&&front90<=fullFront);
ids.rebuild.onclick();
assert.match(ids.status.textContent,/Готово:/);
assert.equal(Number(ids.count.textContent.replace(/\s/g,'')),count90);
assert.equal(Number(ids.frontcount.textContent.replace(/\s/g,'')),front90);
ids.t2eNs.value='55';
ids.esrWidthMHz.value='.4';
ids.rebuild.onclick();
assert.match(ids.status.textContent,/Несогласованность ESR/,'invalid ESR parameters must report an informative message');
ids.t2eNs.value='420';ids.esrWidthMHz.value='.4';ids.vesselWallMM.value='1.1';
ids.rebuild.onclick();assert.match(ids.status.textContent,/Готово:/,'wall scenario rebuild');
const countThick=Number(ids.count.textContent.replace(/\s/g,''));
assert.ok(countThick>0&&countThick<=5000);
ids.vesselWallMM.value='.7';ids.rebuild.onclick();assert.match(ids.status.textContent,/Готово:/);
assert.equal(Number(ids.count.textContent.replace(/\s/g,'')),count90);
assert.equal(typeof ids.exportCad.onclick,'function','CAD export button should be active');
ids.exportCad.onclick();
assert.ok(downloaded.length>0&&blobs.length>0,'CAD configuration downloaded');
const cad=JSON.parse(blobs.at(-1).parts.join(''));
assert.ok(cad.source_case_id>0&&cad.source_model_version==='4.3');
assert.ok(cad.corner_radius_mm>=cad.vessel_wall_mm,'STEP rounded vessel geometry physically fit');
const buildup=cad.vessel_wall_mm+cad.copper_electrode_thickness_mm+
 cad.rf_insulation_mm+cad.winding_envelope_mm+cad.epoxy_mm;
assert.ok(cad.outer_liquid_d_mm+2*buildup<=90+1e-8,'selected CAD fits filtered diameter');
assert.ok(cad.liquid_height_mm+2*buildup<=100+1e-8,'selected CAD fits height');
console.log('PASS: exported Pareto-selected physical vessel parameters for STEP CAD');
console.log(JSON.stringify({
 status:'pass',revision:'V4.3',defaultCount:5000,filteredCount90:count90,
 defaultFront:fullFront,front90,recalculation90:'PASS',invalidESR:'PASS'
},null,2));
