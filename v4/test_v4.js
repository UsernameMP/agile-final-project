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
 assert.ok(Number.isFinite(x.dnpSignedMean));
 assert.ok(x.dnpCancellation>=0&&x.dnpCancellation<=1+1e-12);
}
for(const p of front)for(const q of front){
 if(p.id===q.id)continue;
 assert.ok(!(q.errorPT<=p.errorPT&&q.energyJ<=p.energyJ&&q.envelope<=p.envelope),
  'dominated point '+p.id);
}
const fc={outer:72,inner:42,height:72,fillet:2,turns:600,wire:.45,rfPower:.62,rfTime:1.7,pulseMT:2.4,riseMS:5,holdMS:.6};
const g1=M.geometry(fc,{...M.DEF}),g2=M.geometry(fc,{...M.DEF,conductivity:.04});
assert.ok(g2.qLoad<g1.qLoad,'lossy fluid should decrease loaded Q');
assert.ok(g1.qLoad>100,'literature Q not artificially capped at 23');
const qRef=M.geometry(fc,{...M.DEF,rfQReference:1500});
assert.ok(qRef.qLoad>g1.qLoad,'higher published Q reference increases effective RF Q');
const gRad=M.geometry(fc,{...M.DEF,rfArchitecture:'radial'});
assert.ok(gRad.qLoad<30,'original radial fully loaded capacitor remains a low-Q control');
const narrow=M.estimate(fc,g1,'single',{...M.DEF,rfSaturationPowerW:.1});
const broad=M.estimate(fc,g1,'single',{...M.DEF,rfSaturationPowerW:1.2});
assert.ok(narrow.rfB1UT>broad.rfB1UT,'low saturation threshold raises B1 equivalent at fixed P');
const f1=M.estimate(fc,g1,'single',{...M.DEF});
const taller={...fc,height:80},gtaller=M.geometry(taller,{...M.DEF});
assert.ok(gtaller&&gtaller.volume>g1.volume,'more liquid via height at same coil should fit');
assert.ok(gtaller.qLoad<g1.qLoad,'Q volume-loss penalty must be visible');
assert.ok(M.precompute(taller,gtaller,'single',{...M.DEF}).b1UT<
 M.precompute(fc,g1,'single',{...M.DEF}).b1UT,'same RF power must dilute effective B1 with extra volume');
const p01=M.estimate({...fc,rfPower:.1},g1,'dual',{...M.DEF});
const p05=M.estimate({...fc,rfPower:.5},g1,'dual',{...M.DEF});
const p15=M.estimate({...fc,rfPower:1.5},g1,'dual',{...M.DEF});
assert.ok(p01.rfESRMean<p05.rfESRMean&&p05.rfESRMean<p15.rfESRMean,'ESR saturation must rise with RF power');
assert.ok((p15.rfESRMean-p05.rfESRMean)/1 < (p05.rfESRMean-p01.rfESRMean)/.4,
 'RF saturation grows with diminishing returns');
const timed=M.pareto(a.points,false,'time');
assert.ok(timed.length>0&&timed.every(p=>Number.isFinite(p.resolutionPTsqrtHz)));

const f2=M.estimate(fc,g2,'single',{...M.DEF,conductivity:.04});
assert.ok(f2.rfB1UT>0&&f1.rfB1UT>0,'Maxwell-Ampere estimates remain finite');
// Conductivity changes both RF losses and displacement/conduction currents; B1 need not be monotonic.
// RF dielectric stack regression: real inner/outer vessel walls are in series with liquid.
const sample={outer:72,inner:42,height:72,fillet:2,turns:600,wire:.45,rfPower:.62,rfTime:1.7,pulseMT:2.4,riseMS:5,holdMS:.6};
const cwall={...M.DEF,rfArchitecture:'radial'};
const cBare={...M.DEF,rfArchitecture:'radial',vesselWallMM:0};
const gwall=M.geometry(sample,cwall),gBare=M.geometry(sample,cBare);
assert.ok(gwall&&gBare,'baseline and zero-wall control geometry are admissible');
const ri=sample.inner/2000,ro=sample.outer/2000,tw=cwall.vesselWallMM/1000;
const Dliq=Math.log(ro/ri)/cwall.epsilonR;
const Dtot=Dliq+Math.log(ri/(ri-tw))/cwall.vesselEpsilonR+
 Math.log((ro+tw)/ro)/cwall.vesselEpsilonR;
close(gwall.capPF/gBare.capPF,Dliq/Dtot,1e-10);
assert.ok(gwall.capPF<gwall.capBarePF&&gwall.capPF<gBare.capPF);
assert.ok(gwall.od>gBare.od&&gwall.hh>gBare.hh&&gwall.bore<gBare.bore);
close(gwall.rfLiquidVoltageFraction,Dliq/Dtot,1e-10);
assert.ok(gwall.rfLiquidEnergyShare>0&&gwall.rfWallEnergyShare>0);
assert.ok(gwall.heatFrac>=0&&gwall.heatWallFrac>=0);
const swall=M.estimate(sample,gwall,'single',cwall);
const sBare=M.estimate(sample,gBare,'single',cBare);
assert.ok(swall.rfB1UT<sBare.rfB1UT,
 'at current assumed load, dielectric vessel walls should lower delivered liquid RF B1');
for(const v of ['rfCapBarePF','rfLiquidVoltageFraction','rfLiquidEnergyShare','rfWallEnergyShare','rfWallHeatingJ'])
 assert.ok(Number.isFinite(swall[v]),'missing wall diagnostic '+v);
console.log('PASS: layered radial control + literature RF-Q anchor, saturated ESR proxy and winding build');
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
