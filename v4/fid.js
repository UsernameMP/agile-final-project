/* GeoMesh V4.4: conditional complex-FID forward model, NOT validated sensor sensitivity.
   Single Overhauser head; signed spatial DNP, axial scalar gradient,
   one shared LF coil, Gaussian complex receiver noise, coherent frequency fit.
   Real RF B1 phase maps, local Bloch tipping, susceptibility and ADC are not yet provided. */
(function(root){
'use strict';
const M=root.GeoMeshV4;
if(!M)throw Error('GeoMeshV4 model.js must load before fid.js');
const PI=Math.PI,GAMMA=267.52218744e6,MU0=4e-7*PI,HBAR=1.054571817e-34,KB=1.380649e-23;
function rng(seed){let s=seed>>>0;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296}}
function gauss(u){const x=Math.max(1e-12,u());return Math.sqrt(-2*Math.log(x))*Math.cos(2*PI*u())}
function guard(x,a,b,name){if(!Number.isFinite(x)||x<a||x>b)throw Error(name+' вне диапазона '+a+'…'+b);return x}
function weightedModel(row,c,theta){
 const b={outer:row.outer,inner:row.inner,height:row.height,fillet:row.fillet,
  turns:row.turns,wire:row.wire,rfPower:row.rfPower,rfTime:row.rfTime,
  pulseMT:row.pulseMT,riseMS:row.riseMS,holdMS:row.holdMS};
 const g=M.geometry(b,c);
 if(!g)throw Error('Геометрия выбранной головки не соответствует текущему сценарию');
 const pre=M.precompute(b,g,row.mode,c),ri=b.inner/2000,ro=b.outer/2000,H=b.height/1000,F=b.fillet/1000;
 const th=theta*PI/180,rMid=(ri+ro)/2,bp=b.pulseMT*.001;
 const beta=GAMMA*c.b0*c.b0*(b.riseMS*.001)/bp;
 const ramp=beta/Math.sqrt(1+beta*beta);
 const off=1/Math.sqrt(1+(GAMMA*c.b0*g.offUS*.00000055)**2);
 const M0=c.protonDensity*(GAMMA*HBAR/2)**2*c.b0/(KB*c.T);
 const scale=GAMMA*c.b0*M0*g.gain*ramp*off;
 const cells=[];
 const NR=7,NZ=5,NA=20;
 for(let ir=0;ir<NR;ir++){
  const r=ri+(ro-ri)*(ir+.5)/NR,hr=M.roundingH(r,ri,ro,H,F);
  for(let iz=0;iz<NZ;iz++){
   const z=hr*((iz+.5)/NZ-.5),dV=2*PI*r*(ro-ri)/NR*hr/NZ/NA;
   for(let ia=0;ia<NA;ia++){
    const phi=(ia+.5)*2*PI/NA,x=Math.sin(th)*Math.sin(phi);
    const betaGeom=bp*rMid/r;
    const magnitude=Math.sqrt(c.b0*c.b0+betaGeom*betaGeom+2*c.b0*betaGeom*x);
    const tip=((betaGeom+c.b0*x)*(1-x*x))/magnitude;
    const polarization=M.ePolar(pre,r,z,phi,th,c,b).epsilon;
    // Same coherent, signed receive projection as V4.3 Pareto screening.
    // No artificial change of spin phase with sign(B1); electron saturation is |B1|^2.
    const w=scale*dV*polarization*(MU0*b.turns/(2*PI*r))*tip;
    const deltaHz=GAMMA/(2*PI)*(c.gradientNTM*1e-9*z);
    cells.push({w,deltaHz});
   }
  }
 }
 return {cells,g,pre};
}
function baseband(row,config={},opts={}){
 const c={...M.DEF,...config};
 const deg=guard(Number(opts.orientationDeg??0),0,180,'Угол к оси');
 const fs=guard(Number(opts.sampleRateHz??80),20,500,'Частота IQ-дискретизации');
 const read=guard(Number(opts.durationS??c.readS),.25,4,'Длительность FID');
 const offset=guard(Number(opts.offsetHz??.23),-1,1,'Внесённое смещение частоты');
 const noiseScale=guard(Number(opts.noiseScale??1),0,20,'Множитель шума');
 const seed=(opts.seed??20261025)>>>0;
 const n=Math.floor(read*fs),{cells,g,pre}=weightedModel(row,c,deg);
 const t=[],idealRe=[],idealIm=[],hRe=[],hIm=[];
 const time0=g.dead;
 for(let i=0;i<n;i++){
  const ti=time0+i/fs;
  let re=0,im=0;
  for(const q of cells){
   const p=2*PI*q.deltaHz*ti;
   re+=q.w*Math.cos(p);im+=q.w*Math.sin(p);
  }
  const envelope=Math.exp(-ti/c.T2star);
  const er=re*envelope,ei=im*envelope;
  const ph=2*PI*offset*ti,cs=Math.cos(ph),sn=Math.sin(ph);
  t.push(ti);hRe.push(er);hIm.push(ei);
  idealRe.push(er*cs-ei*sn);idealIm.push(er*sn+ei*cs);
 }
 const sigma=g.noise*Math.sqrt(fs/2)*noiseScale;
 const u=rng(seed);
 const real=idealRe.map(x=>x+sigma*gauss(u));
 const imag=idealIm.map(x=>x+sigma*gauss(u));
 return {rowId:row.id,orientationDeg:deg,carrierHz:GAMMA*c.b0/(2*PI),
  offsetHz:offset,noiseStdV:sigma,fsHz:fs,readS:read,deadS:g.dead,
  cells:cells.length,rfB1UT:pre.b1UT,time:t,idealRe,idealIm,hRe,hIm,
  re:real,im:imag,seed};
}
function fitFrequency(sim,re=sim.re,im=sim.im){
 const t=sim.time,hR=sim.hRe,hI=sim.hIm,n=t.length;
 if(re.length!==n||im.length!==n||n<10)throw Error('Недостаточная длина IQ-данных');
 let qr=new Float64Array(n),qi=new Float64Array(n),signalEnergy=0,m1=0,m2=0;
 for(let i=0;i<n;i++){
  qr[i]=re[i]*hR[i]+im[i]*hI[i];
  qi[i]=im[i]*hR[i]-re[i]*hI[i];
  const wt=hR[i]*hR[i]+hI[i]*hI[i];
  signalEnergy+=wt;m1+=wt*t[i];m2+=wt*t[i]*t[i];
 }
 if(!(signalEnergy>1e-28))throw Error('Сигнал ниже численного порога модели');
 function score(freq){
  let x=0,y=0;
  for(let i=0;i<n;i++){
   const a=-2*PI*freq*t[i],ca=Math.cos(a),sa=Math.sin(a);
   x+=qr[i]*ca-qi[i]*sa;y+=qr[i]*sa+qi[i]*ca;
  }
  return x*x+y*y;
 }
 const limit=1.25,step=.025;
 let best=-Infinity,bf=0;
 for(let j=0;j<=Math.round(2*limit/step);j++){
  const f=-limit+j*step,s=score(f);
  if(s>best){best=s;bf=f}
 }
 // Golden-section local refinement of the sampled maximum.
 let lo=Math.max(-limit,bf-step),hi=Math.min(limit,bf+step);
 const gr=(Math.sqrt(5)-1)/2;
 let x1=hi-gr*(hi-lo),x2=lo+gr*(hi-lo),v1=score(x1),v2=score(x2);
 for(let k=0;k<24;k++){
  if(v1<v2){lo=x1;x1=x2;v1=v2;x2=lo+gr*(hi-lo);v2=score(x2)}
  else{hi=x2;x2=x1;v2=v1;x1=hi-gr*(hi-lo);v1=score(x1)}
 }
 const estimatedHz=(lo+hi)/2;
 // Complex unknown amplitude/phase is fitted as nuisance parameters.
 const timeVariance=Math.max(0,m2-m1*m1/signalEnergy);
 const crlbHz=sim.noiseStdV/(2*PI*Math.sqrt(timeVariance));
 return {offsetHz:estimatedHz,deltaHz:estimatedHz-sim.offsetHz,
  deltaPT:(estimatedHz-sim.offsetHz)*(2*PI/GAMMA)*1e12,
  crlbPT:crlbHz*(2*PI/GAMMA)*1e12,
  crlbHz,signalRmsUV:1e6*Math.sqrt(signalEnergy/n),
  noiseRmsUV:sim.noiseStdV*1e6,fitScore:score(estimatedHz)};
}
function run(row,c={},opts={}){
 const sim=baseband(row,c,opts),fit=fitFrequency(sim);
 const count=Math.floor(guard(Number(opts.trials??32),0,128,'Повторные циклы'));
 const u=rng((sim.seed^0x9e3779b9)>>>0);
 const results=[];
 for(let k=0;k<count;k++){
  let nr=sim.idealRe.map(v=>v+sim.noiseStdV*gauss(u));
  let ni=sim.idealIm.map(v=>v+sim.noiseStdV*gauss(u));
  results.push(fitFrequency(sim,nr,ni).deltaPT);
 }
 const mean=results.length?results.reduce((a,b)=>a+b,0)/results.length:null;
 const stdev=results.length>1?Math.sqrt(results.reduce((a,b)=>a+(b-mean)**2,0)/(results.length-1)):null;
 return {sim,fit,mc:{trials:count,biasPT:mean,stdPT:stdev},
  scope:'UNCALIBRATED coherent FID scenario. No RF-port FEM, susceptibility, measured ESR or ADC model.'};
}
root.GeoMeshV4FID={baseband,fitFrequency,run};
})(typeof window!=='undefined'?window:globalThis);
