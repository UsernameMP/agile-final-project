/* GeoMesh Overhauser V4 — high rounded rectangular torus, coaxial inner/outer RF electrodes,
   ONE shared low-frequency pulse+receive winding. Research screening, not field solver.
   The response is not calibrated against an actual resonator, radical solution, or LNA. */
(function(root){
"use strict";
const PI=Math.PI, MU0=4e-7*PI, EPS0=8.8541878128e-12, KB=1.380649e-23,
 HBAR=1.054571817e-34, GP=267.52218744e6, GE=1.76085963e11,
 RHO=1.724e-8, WRF=2*PI*58.8e6, B0=50e-6;
const DEF=Object.freeze({
 maxOD:100,maxH:100,minBore:10,minOD:60,minH:20,
 epsilonR:72,lossTangent:0.030,conductivity:0.004,efieldShare:0.94,
 qMetal:85,qCoupler:33,feedFactor:1.0,xi:0.46,leakage:0.80,
 t1e:3.0e-6,t2e:420e-9,esrHalfMHz:0.82,esrWidthMHz:0.40,
 tDNP:1.0,T2star:2.0,gradientNTM:20,ampNV:0.85,ampPA:0.08,
 b0:B0,T:293.15,protonDensity:6.68e28,rfEfficiency:0.55,
 contW:0.055,rfOverheadDual:0.035,readS:1.6,rxLoad:100000,
 pulseClamp:240,baseBlankS:0.0008,rfBarrierMM:0.45,epoxyMM:0.85
});
const WIRE=[0.30,0.36,0.40,0.45,0.50,0.54];
const TURNS=[300,450,600,750,900,1100,1350,1600];
function RNG(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
const uniform=(r,a,b)=>a+(b-a)*r(), choice=(r,a)=>a[Math.floor(r()*a.length)];
function outerRadius(b){return b.outer/2000}
function innerRadius(b){return b.inner/2000}
function roundingH(r,ri,ro,h,fil){
 let edge=Math.min(r-ri,ro-r);
 if(fil<=0||edge>=fil)return h;
 return h-2*fil+2*Math.sqrt(Math.max(0,fil*fil-(fil-edge)*(fil-edge)));
}
function geometry(b,c){
 const w=(b.outer-b.inner)/2,h=b.height,f=b.fillet,ri=b.inner/2;
 if(w<6||f<.5||f>Math.min(w/2,h/2)||b.height<40)return null;
 let pitch=b.wire*1.12, rest=b.turns,layers=[],offset=c.rfBarrierMM;
 for(let j=0;j<45&&rest>0;j++){
  let turnR=ri-offset-(j+.5)*pitch;
  let cap=Math.floor(.92*2*PI*turnR/pitch);
  if(cap<=0)return null;
  let n=Math.min(cap,rest);layers.push([n,offset+(j+.5)*pitch]);rest-=n;
 }
 if(rest>0)return null;
 let buildup=c.rfBarrierMM+layers.length*pitch+c.epoxyMM;
 let od=b.outer+2*buildup,hh=b.height+2*buildup,bore=b.inner-2*buildup;
 if(od<c.minOD||od>c.maxOD||hh<c.minH||hh>c.maxH||bore<c.minBore)return null;
 let section=w*h-(4-PI)*f*f;
 let volume=PI*(b.outer+b.inner)*section/2000;
 let p0=2*(w+h)-(8-2*PI)*f;
 let length=layers.reduce((acc,[n,off])=>acc+n*(p0+2*PI*off)/1000,0);
 let R=RHO*length/(PI*Math.pow(b.wire/2000,2));
 let ro=outerRadius(b),r0=innerRadius(b),hm=h/1000,ff=f/1000;
 let intg=0,nstep=16;
 for(let k=0;k<=nstep;k++){
  let rr=r0+(ro-r0)*k/nstep;
  let height=roundingH(rr,r0,ro,hm,ff);
  intg+=(k==0||k==nstep?1:k%2?4:2)*height/rr*(ro-r0)/(3*nstep);
 }
 let L=MU0*b.turns*b.turns*intg/(2*PI);
 let wL=GP*c.b0*L; // omega*L
 let rt=R+0.26; // series LF switch/contacts, scenario estimate
 let cy=L/(rt*rt+wL*wL); // shunt C cancels susceptance of lossy coil at Larmor
 let yCoilRe=rt/(rt*rt+wL*wL);
 let yPar=yCoilRe+1/c.rxLoad;
 let gain=1/(Math.sqrt(rt*rt+wL*wL)*yPar);
 let zPar=1/yPar;
 let qSeries=wL/rt,qLoaded=qSeries/(1+(rt*rt+wL*wL)/(rt*c.rxLoad));
 let noise=Math.sqrt(4*KB*c.T*rt*gain*gain+Math.pow(c.ampNV*1e-9,2)+
   Math.pow(c.ampPA*1e-12*zPar,2)+Math.pow(.28e-9*gain,2));
 let rMid=(ro+r0)/2;
 let ip=b.pulseMT*1e-3*2*PI*rMid/(MU0*b.turns);
 let riseV=1.55*L*ip/(b.riseMS*1e-3)+ip*rt;
 let offSec=L*ip/(c.pulseClamp+ip*R);
 if(riseV>130||ip>4||offSec>.00055)return null;
 let epulse=(.3714*b.riseMS*.001+b.holdMS*.001)*ip*ip*R/.82 +
               .5*L*ip*ip/.82;
 let tauRx=2*qLoaded/(GP*c.b0);
 // Incomplete: clipping and diode recovery depend on actual LNA; this is explicitly a proxy.
 let dead=offSec+c.baseBlankS+tauRx*Math.log1p((c.pulseClamp*0.00015)/0.015);
 const hElectrode=(h-2*Math.max(1,f))/1000;
 if(hElectrode<=0)return null;
 const eps=EPS0*c.epsilonR;
 const C=2*PI*eps*hElectrode/Math.log(ro/r0);
 const tanEff=c.lossTangent+c.conductivity/(WRF*eps);
 const qDie=1/(c.efieldShare*tanEff);
 const qLoad=1/(1/qDie+1/c.qMetal+1/c.qCoupler);
 const Lrf=1/(WRF*WRF*(C+10e-12)); // includes provisional 10 pF stray
 const volEff=(1.12*volume+17)*1e-6; // m³, fringe-field approximation
 const pradius=hElectrode/Math.log(ro/r0);
 const heatFrac=Math.min(1,qLoad/qDie);
 const eenv=PI*(od*od-bore*bore)/4*hh/1000;
 return {od,hh,bore,volume,eenv,section,p0,length,R,L,gain,noise,qSeries,qLoaded,
  tuneUF:cy*1e6,layers:layers.length,buildup,pitch,ip,riseV,offUS:offSec*1e6,
  pulseEnergy:epulse,dead,capPF:C*1e12,rfLNH:Lrf*1e9,qDie,qLoad,tanEff,
  volEff,heatFrac,rfMaxERadial:pradius,he:hElectrode};
}
function makeBase(r){
 let outer=uniform(r,51,83), width=uniform(r,8.5,18.5),
 inner=outer-2*width, height=uniform(r,52,89),
 fillet=uniform(r,.8,Math.min(3.4,width*.24));
 return {outer,inner,height,fillet,
 turns:choice(r,TURNS),wire:choice(r,WIRE),
 rfPower:choice(r,[.16,.28,.42,.62,.85,1.0]),
 rfTime:choice(r,[.8,1.2,1.7,2.3,2.8]),
 pulseMT:choice(r,[1.8,2.4,3.0,3.5]),
 riseMS:choice(r,[1.5,3,5,8,12]),holdMS:choice(r,[.3,.6,1.0,1.5])};
}
const integrate = (fun,a,b,n=32)=>{let h=(b-a)/n,sum=fun(a)+fun(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*fun(a+i*h);return sum*h/3};
function rfSpectral(freqMHz,esrMHz,c,qL){
 const transfer=1/(1+Math.pow(2*qL*(freqMHz)/58.8,2));
 return transfer/(1+Math.pow((freqMHz-esrMHz)/c.esrWidthMHz,2));
}
function modePoints(mode,c){
 return mode==='dual'?[[-c.esrHalfMHz,.5],[c.esrHalfMHz,.5]]:[[c.esrHalfMHz,1]];
}
function precompute(b,g,mode,c){
 const modes=modePoints(mode,c);
 let rmid=(b.inner+b.outer)/4000;
 // Axisymmetric quasi-static Maxwell-Ampere field for a radial capacitor:
 // -(dH_phi/dz) ~= (sigma + i*omega*eps)*E_r. Symmetric feed: H_phi(0)=0.
 // Consequently B_phi changes sign at mid-plane; RF B1 is NOT uniform in z.
 // Feed geometry / axial return currents are still unknown: feedFactor is a fitted proxy.
 let er=EPS0*c.epsilonR,cap=g.capPF*1e-12;
 let vrms=Math.sqrt(b.rfPower*g.qLoad/(WRF*cap));
 let admittance=Math.hypot(c.conductivity,WRF*er);
 let axialRms=g.he/Math.sqrt(12);
 let b1rms=MU0*admittance*vrms/(rmid*Math.log(outerRadius(b)/innerRadius(b)))*axialRms*c.feedFactor;
 let alpha0=Math.pow(GE*b1rms,2)*c.t1e*c.t2e;
 let spl=[];
 for(let esr of [-c.esrHalfMHz,c.esrHalfMHz]){
  let spec=0;for(let [f,p] of modes) spec+=p*rfSpectral(f,esr,c,g.qLoad);
  spl.push(spec);
 }
 return {alpha0,spl,rmid,rfP:b.rfPower,rfT:b.rfTime,he:g.he,vrms,
  b1UT:b1rms*1e6,mode};
}
function ePolar(pre,r,z,phi,theta,c,b){
 // Axial displacement-current mode: B1_phi proportional to z; sample mid-plane has a node.
 let zz=Math.max(-pre.he/2,Math.min(pre.he/2,z));
 let b1shape=(pre.rmid/r)*(zz/(pre.he/Math.sqrt(12)));
 let x=Math.sin(theta)*Math.sin(phi);
 let transverse=1-x*x;
 let alpha=pre.alpha0*b1shape*b1shape*transverse;
 let sat=0.5*(alpha*pre.spl[0]/(1+alpha*pre.spl[0])+
                 alpha*pre.spl[1]/(1+alpha*pre.spl[1]));
 let grow=1-Math.exp(-pre.rfT*(1+.35*sat)/c.tDNP);
 let epsilon=1-(GE/GP)*c.xi*c.leakage*sat*grow;
 return {epsilon,sat};
}
function estimate(b,g,mode,c,detail=false){
 const pre=precompute(b,g,mode,c);
 const ri=innerRadius(b),ro=outerRadius(b),H=b.height/1000,F=b.fillet/1000;
 const rMid=(ri+ro)/2,bp=b.pulseMT*1e-3;
 const beta=GP*c.b0*c.b0*(b.riseMS*.001)/bp;
 // pulse proxy: real spin evolution needs driven Bloch solution (candidate inspector).
 const rampFactor=beta/Math.sqrt(1+beta*beta);
 const offFactor=1/Math.sqrt(1+Math.pow(GP*c.b0*g.offUS*1e-6*.55,2));
 const M0=c.protonDensity*Math.pow(GP*HBAR/2,2)*c.b0/(KB*c.T);
 const orientations=[0,PI/6,PI/3,PI/2];
 let worst=-1, best=Infinity,amin=Infinity,amax=0, worstTheta=0;
 let meanSat=0,meanEps=0,signedEps=0,wn=0;
 for(let th of orientations){
  let A=0,azMom=0,zMom=0,volW=0;
  // integrate actual filleted cross-section, uniform azimuthal sampling
  for(let ir=0;ir<7;ir++){
   let rr=ri+(ro-ri)*(ir+.5)/7,hr=roundingH(rr,ri,ro,H,F);
   for(let iz=0;iz<3;iz++){
    let z=hr*((iz+.5)/3-.5);
    let dV=2*PI*rr*(ro-ri)/7*hr/3/12;
    for(let ia=0;ia<12;ia++){
     let phi=(ia+.5)*2*PI/12;
     let x=Math.sin(th)*Math.sin(phi);
     let betaGeom=bp*rMid/rr;
     let gamma=Math.sqrt(c.b0*c.b0+betaGeom*betaGeom+2*c.b0*betaGeom*x);
     let tip=((betaGeom+c.b0*x)*(1-x*x))/gamma;
     let p=ePolar(pre,rr,z,phi,th,c,b);
     let weight=dV*p.epsilon*MU0*b.turns/(2*PI*rr)*
                 tip*rampFactor*offFactor;
     A+=weight; azMom+=weight*z;volW+=weight;
     if(th===0){meanSat+=p.sat*dV;meanEps+=Math.abs(p.epsilon)*dV;signedEps+=p.epsilon*dV;wn+=dV;}
    }
   }
  }
  let amp=GP*c.b0*M0*Math.abs(A)*g.gain;
  // Gaussian dephasing: external axial gradient only. No susceptibility bias prediction!
  const spreadZ=(H-2*F)*Math.sqrt(1/12);
  const sigmaW=GP*c.gradientNTM*1e-9*spreadZ;
  let i0=0,i1=0,i2=0,dt=c.readS/35;
  const t2=c.T2star;
  for(let k=0;k<=35;k++){
   let t=g.dead+k*dt,win=(k===0||k===35)?1:k%2?4:2;
   let w=win*Math.exp(-2*t/t2-(sigmaW*t)*(sigmaW*t))*dt/3;
   i0+=w;i1+=t*w;i2+=t*t*w;
  }
  let fisher=Math.max(1e-15,i2-i1*i1/Math.max(i0,1e-20));
  let sigma=g.noise/(GP*Math.max(amp,1e-30)*Math.sqrt(fisher))*1e12;
  if(sigma>worst){worst=sigma;worstTheta=th*180/PI;}
  best=Math.min(best,sigma);amin=Math.min(amin,amp);amax=Math.max(amax,amp);
 }
 let eRF=b.rfPower*b.rfTime/c.rfEfficiency;
 let eElec=c.contW*(b.rfTime+c.readS+g.dead+b.riseMS*.001);
 let modeEnergy=mode==='dual'?c.rfOverheadDual:0;
 const shotJ=eRF+eElec+g.pulseEnergy+modeEnergy;
 let heatJ=b.rfPower*b.rfTime*g.heatFrac;
 let deltaT=heatJ/(g.volume*1e-3*4180); // aqueous solution, rho~1g/ml
 // conservative sensitivity is a scenario stress, not a statistical 95% confidence interval
 let qSlope=pre.alpha0/(1+pre.alpha0);
 let robustScale=1.6+1.4*qSlope;
 let row={id:0,mode,outer:b.outer,inner:b.inner,height:b.height,fillet:b.fillet,
  turns:b.turns,wire:b.wire,rfPower:b.rfPower,rfTime:b.rfTime,pulseMT:b.pulseMT,riseMS:b.riseMS,holdMS:b.holdMS,
  od:g.od,hh:g.hh,bore:g.bore,volume:g.volume,envelope:g.eenv,
  errorPT:worst,conservativePT:worst*robustScale,energyJ:shotJ,
  angleRatio:amin/Math.max(amax,1e-30),worstTheta,ampUV:amin*1e6,
  rfQ:g.qLoad,rfQDielectric:g.qDie,rfCapPF:g.capPF,rfIndNH:g.rfLNH,rfB1UT:pre.b1UT,rfDriveVrms:pre.vrms,esrWidthMHz:c.esrWidthMHz,t2eNS:c.t2e*1e9,esrHomHWHMMHz:1/(2*PI*c.t2e*1e6),
  rfHeatJ:heatJ,deltaTmK:deltaT*1000,rfESRMean:meanSat/Math.max(wn,1e-30),
  dnpMean:meanEps/Math.max(wn,1e-30),dnpSignedMean:signedEps/Math.max(wn,1e-30),dnpCancellation:Math.abs(signedEps)/Math.max(meanEps,1e-30),coilR:g.R,coilLMH:g.L*1000,coilLayers:g.layers,
  rxGain:g.gain,rxNoiseNV:g.noise*1e9,coilLengthM:g.length,
  pulseCurrentA:g.ip,pulseOffUS:g.offUS,pulseRiseV:g.riseV,
  deadMS:g.dead*1000,energyPulseJ:g.pulseEnergy,rfInputJ:eRF,coilTuneUF:g.tuneUF,
  tipRampFactor:rampFactor,tipOffFactor:offFactor,headingBiasPT:null};
 return row;
}
function build(cIn,nBase=2500,seed=20261025,progress){
 let c=Object.assign({},DEF,cIn||{}),r=RNG(seed),out=[],tries=0,reasons={};
 // In the Lorentzian homogeneous ESR model, observed HWHM ≥ 1/(2π*T2e).
 // Inhomogeneous and hyperfine broadening may make an observed line wider.
 const homogeneousHWHMMHz=1/(2*Math.PI*c.t2e*1e6);
 if(!(c.t2e>0&&c.esrWidthMHz>0&&c.esrWidthMHz+1e-8>=homogeneousHWHMMHz))
  throw Error('Несогласованность ESR: при T₂e='+Math.round(c.t2e*1e9)+' нс полуширина ESR должна быть не меньше '+homogeneousHWHMMHz.toFixed(2)+' МГц. Измени T₂e или ширину ESR.');
 while(out.length<2*nBase &&tries<nBase*350){
  tries++;
  let b=makeBase(r),g=geometry(b,c);
  if(!g){reasons.geometry=(reasons.geometry||0)+1;continue}
  for(let mode of ['single','dual']){
   let p=estimate(b,g,mode,c);
   if(!Number.isFinite(p.errorPT)||p.errorPT<0)throw Error('bad sigma');
   p.id=out.length+1;p.baseId=Math.floor(out.length/2)+1;out.push(p);
  }
  if(progress&&out.length%500===0)progress(out.length);
 }
 if(out.length!==nBase*2)throw Error('Only '+out.length+'/'+nBase*2+' feasible');
 return {points:out,stats:{trials:tries,rejections:reasons,nbase:nBase,total:out.length},c};
}
function pareto(rows,useConservative=false){
 let key=useConservative?'conservativePT':'errorPT';
 let sorted=rows.slice().sort((a,b)=>a[key]-b[key]||a.energyJ-b.energyJ||a.envelope-b.envelope);
 let front=[];
 for(let p of sorted){
  let dominated=false;
  for(let q of front)if(q[key]<=p[key]&&q.energyJ<=p.energyJ&&q.envelope<=p.envelope){dominated=true;break}
  if(dominated)continue;
  front=front.filter(q=>!(p[key]<=q[key]&&p.energyJ<=q.energyJ&&p.envelope<=q.envelope));
  front.push(p);
 }
 return front;
}
// Detailed selectable-pulse spin integration (Rodrigues exact per time slice; rotating field sign is irrelevant for amplitude).
// This is nuclear Bloch precession during the pulse, with initial DNP-aligned M; does NOT
// simulate the electron spin-density matrix, liquid diffusion or RF electromagnetic field.
function blochPulse(row,thetaDeg=90,nPhi=24,dtUS=2.0){
 const b={outer:row.outer,inner:row.inner,height:row.height,fillet:row.fillet};
 const ri=innerRadius(b),ro=outerRadius(b),rm=(ri+ro)/2;
 let tt=row.riseMS*.001+row.holdMS*.001+row.pulseOffUS*1e-6;
 let n=Math.ceil(tt/(dtUS*1e-6)),dt=tt/n;
 let th=thetaDeg*PI/180,u=[Math.sin(th),0,Math.cos(th)];
 let ideal=0,real=0,energies=[];
 function rot(v,bx,by,bz,delta){
  let B=Math.hypot(bx,by,bz),ang=GP*B*delta;
  if(B<1e-16)return v;
  let nx=bx/B,ny=by/B,nz=bz/B,ca=Math.cos(ang),sa=Math.sin(ang),
   dot=nx*v[0]+ny*v[1]+nz*v[2];
  // sign from dM/dt = gamma M cross B, so rotate with -gamma B in Rodrigues
  return [v[0]*ca-(ny*v[2]-nz*v[1])*sa+nx*dot*(1-ca),
   v[1]*ca-(nz*v[0]-nx*v[2])*sa+ny*dot*(1-ca),
   v[2]*ca-(nx*v[1]-ny*v[0])*sa+nz*dot*(1-ca)];
 }
 for(let a=0;a<nPhi;a++){
  let phi=(a+.5)*2*PI/nPhi,tx=-Math.sin(phi),ty=Math.cos(phi),
   r=rm + .32*(ro-ri)*Math.sin(2*PI*a/nPhi);
  let v=[u[0],u[1],u[2]],field=row.pulseMT*.001*rm/r;
  for(let k=0;k<n;k++){
   let t=(k+.5)*dt, frac;
   if(t<row.riseMS*.001){let q=t/(row.riseMS*.001);frac=q*q*(3-2*q)}
   else if(t<(row.riseMS+row.holdMS)*.001)frac=1;
   else frac=Math.max(0,1-(t-(row.riseMS+row.holdMS)*.001)/(row.pulseOffUS*1e-6));
   v=rot(v,B0*u[0]+field*frac*tx,B0*u[1]+field*frac*ty,B0*u[2],dt);
  }
  let long=u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
  let mx=v[0]-long*u[0],my=v[1]-long*u[1],mz=v[2]-long*u[2];
  let rx=tx*mx+ty*my;
  let ix=ty*(u[2]*mx-u[0]*mz)+tx*(-u[2]*my); // receiver quadrature proxy
  real+=rx/nPhi;ideal+=(1-Math.pow(u[0]*tx+u[1]*ty,2))/nPhi;
  energies.push([phi,rx,Math.hypot(mx,my,mz)]);
 }
 return {complexCoherent:real,ideal,ratio:Math.abs(real)/Math.max(Math.abs(ideal),1e-10),
  samples:n*nPhi,dtUS:dt*1e6,trace:energies};
}
function validate(){
 let c=Object.assign({},DEF),b={outer:72,inner:42,height:72,fillet:2,turns:600,wire:.45,rfPower:.62,rfTime:1.7,pulseMT:2.4,riseMS:5,holdMS:.6};
 let g=geometry(b,c);
 if(!g)throw Error('reference fixture does not fit');
 let area=(b.outer-b.inner)/2*b.height-(4-PI)*b.fillet*b.fillet;
 let expected=PI*(b.outer+b.inner)*area/2000;
 if(Math.abs(expected-g.volume)>1e-9)throw Error('volume');
 if(g.qLoad>=g.qDie||g.qLoad>=c.qMetal)throw Error('Q physical');
 if(!Number.isFinite(g.noise)||g.noise<=0||g.gain<=0)throw Error('receiver');
 let b1=precompute(b,g,'single',c);
 if(!(b1.b1UT>0))throw Error('B1');
 let s1=estimate(b,g,'single',c),s2=estimate(b,g,'dual',c);
 if(!(s1.errorPT>0&&s2.errorPT>0))throw Error('noise');
 if(!(s1.energyJ<s2.energyJ))throw Error('extra channels energy');
 if(!(g.capPF>10&&g.rfLNH>0))throw Error('electrodes');
 let p=pareto([s1,s2]);
 if(!p.length)throw Error('pareto');
 return {ok:true,checks:8,fixture:{volumeML:g.volume,od:g.od,h:g.hh,bore:g.bore,
  qLoaded:g.qLoad,capPF:g.capPF,rfIndNH:g.rfLNH,singlePT:s1.errorPT,dualPT:s2.errorPT}};
}
root.GeoMeshV4={DEF,build,pareto,validate,geometry,estimate,blochPulse,makeBase,RNG};
})(typeof window!=='undefined'?window:globalThis);
