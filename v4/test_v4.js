/* Node.js reproducibility and consistency checks. These are NOT experimental validation. */
'use strict';
const assert=require('node:assert/strict');
require('./model.js');
const M=globalThis.GeoMeshV4;
function close(a,b,eps=1e-9){assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),a+' != '+b)}
console.time('GeoMesh V4 regression');
const fixture=M.validate();assert.equal(fixture.checks,8);
const a=M.build({},2500,20261025),b=M.build({},20,20261025);
assert.equal(a.points.length,5000);assert.equal(a.stats.nbase,2500);
assert.deepEqual(a.points.slice(0,40),b.points);
let front=M.pareto(a.points);
assert.ok(front.length>5);
const ids=new Set(front.map(x=>x.id));assert.equal(front.length,ids.size);
for(let n=0;n<a.points.length;n+=2){
 const x=a.points[n],y=a.points[n+1];
 assert.equal(x.baseId,y.baseId);
 assert.equal(x.mode,'single');assert.equal(y.mode,'dual');
 for(const key of ['outer','inner','height','fillet','turns','wire','rfPower','rfTime','od','hh','bore','volume','rfQ','rfCapPF','rfIndNH'])
   close(x[key],y[key]);
 assert.ok(x.od>=60&&x.od<=100&&x.hh<=100&&x.hh>=20&&x.bore>=10);
 assert.ok(y.energyJ>x.energyJ);
 for(const key of ['errorPT','energyJ','rfB1UT','rfQ','rfCapPF','rfIndNH','rxNoiseNV','pulseOffUS'])assert.ok(Number.isFinite(x[key])&&x[key]>0);
 assert.equal(x.headingBiasPT,null);
}
for(const p of front)for(const q of front){
 if(p.id===q.id)continue;
 assert.ok(!(q.errorPT<=p.errorPT&&q.energyJ<=p.energyJ&&q.envelope<=p.envelope),
  'dominated point '+p.id);
}
const fc={outer:72,inner:42,height:72,fillet:2,turns:600,wire:.45,rfPower:.62,rfTime:1.7,pulseMT:2.4,riseMS:5,holdMS:.6};
const g1=M.geometry(fc,{...M.DEF}),g2=M.geometry(fc,{...M.DEF,conductivity:.04});
assert.ok(g2.qLoad<g1.qLoad,'lossy fluid should decrease loaded Q');
const f1=M.estimate(fc,g1,'single',{...M.DEF});
const f2=M.estimate(fc,g2,'single',{...M.DEF,conductivity:.04});
assert.ok(f2.rfB1UT<f1.rfB1UT,'lower loaded Q lowers magnetic-energy proxy');
const ptest=M.blochPulse(a.points[0],90,16,4);
assert.ok(Number.isFinite(ptest.ratio)&&ptest.samples>1000);
const stress=M.pareto(a.points,true);assert.ok(stress.length>0);
const stats={status:'pass',cases:5000,bases:2500,pareto:front.length,
 modes:front.reduce((s,x)=>(s[x.mode]=(s[x.mode]||0)+1,s),{}),
 min_model_sigma_pt:Math.min(...a.points.map(x=>x.errorPT)),
 min_energy_j:Math.min(...a.points.map(x=>x.energyJ)),
 fixture:fixture.fixture,bloch_ratio:ptest.ratio};
console.log(JSON.stringify(stats,null,2));
console.timeEnd('GeoMesh V4 regression');
