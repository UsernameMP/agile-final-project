#!/usr/bin/env python3
"""GeoMesh Overhauser research screening model v3.

Produces matched 1250 x 4 architectures = 5000 models under full envelope constraints.
**Scenario**, not a validated quantitative sensor model. See FORMULAS.md.
"""
from __future__ import annotations
from dataclasses import dataclass,asdict
from math import pi, log, sqrt, floor, exp, sin, cos
from pathlib import Path
import numpy as np
import csv, json, argparse, random

MU0=4*pi*1e-7
KB=1.380649e-23
HBAR=1.054571817e-34
GAMMA=267.52218744e6
RHO_CU=1.724e-8

@dataclass(frozen=True)
class Config:
    # Full package constraints (including two winding buildups, RF strip layer, epoxy)
    max_od:float=100.0
    min_od:float=60.0
    max_h:float=100.0
    min_h:float=20.0
    min_bore:float=10.0
    epoxy_mm:float=1.0
    rf_layer_mm:float=0.45
    winding_fill:float=0.92
    insulated_pitch:float=1.12
    b_earth_ut:float=50.0
    t_k:float=293.15
    proton_density:float=6.68e28
    rf_driver_efficiency:float=0.55
    controller_w:float=0.045
    rf_reference_volume_ml:float=100.0
    rf_fringe_volume_ml:float=20.0
    rf_reference_q:float=120.0
    rf_sat_reference_w:float=0.24
    esr_width_mhz:float=0.20
    esr_split_half_mhz:float=0.35
    multitone_transfer:float=0.80
    multitone_extra_j:float=0.03
    dnp_enhancement_max:float=450.0
    dnp_buildup_time_s:float=1.15
    t2_chemical_s:float=2.68
    gradient_nt_m:float=20.0
    amp_nv_root_hz:float=0.8
    amp_pa_root_hz:float=0.05
    v_lna_v:float=0.5
    input_load_ohm:float=50000.0
    read_time_s:float=1.5
    dead_base_shared_ms:float=25.0
    dead_base_separate_ms:float=8.0
    coupling_separate:float=0.65
    switch_noise_shared_nv:float=0.45
    switch_noise_separate_nv:float=0.15
    switch_r_shared_ohm:float=0.4
    switch_r_separate_ohm:float=0.1
    pulse_target_mt:float=3.0
    pulse_duration_ms:float=3.0
    pulse_off_us:float=30.0
    pulse_efficiency:float=0.85
    pulse_max_current_a:float=5.0
    pulse_max_clamp_v:float=600.0

@dataclass(frozen=True)
class Base:
    outer_mm:float
    inner_mm:float
    height_mm:float
    fillet_mm:float
    rx_turns:int
    rx_wire_mm:float
    pulse_turns:int
    pulse_wire_mm:float
    rf_power_w:float
    rf_s:float
    rf_q:float


def pack(turns,wire_d,ri_mm,start_offset,c:Config):
    pitch=wire_d*c.insulated_pitch
    nleft=int(turns)
    layers=[]
    for i in range(100):
        offset=start_offset+(i+0.5)*pitch
        inner_center=ri_mm-offset
        if inner_center<=0:return None
        cap=floor(c.winding_fill*2*pi*inner_center/pitch)
        if cap<=0:return None
        n=min(cap,nleft)
        layers.append((n,offset))
        nleft-=n
        if nleft==0:break
    if nleft:return None
    return dict(layers=layers,build_mm=len(layers)*pitch,pitch_mm=pitch)


def geo(base:Base,topology:str,c:Config):
    out,inn,h,fil=base.outer_mm,base.inner_mm,base.height_mm,base.fillet_mm
    w=(out-inn)/2
    ri=inn/2
    if inn<=8 or w<2.5 or h<12 or fil<0 or fil>min(w/2,h/2):return None
    a=w*h-(4-pi)*fil**2
    vm=pi*(out+inn)*a/2000  # mL: 2pi mean radius (mm) * area (mm2) /1000
    if vm<7:return None
    rx=pack(base.rx_turns,base.rx_wire_mm,ri,c.rf_layer_mm,c)
    if rx is None:return None
    if topology=='separate':
        pul=pack(base.pulse_turns,base.pulse_wire_mm,ri,c.rf_layer_mm+rx['build_mm'],c)
        if pul is None:return None
        npulse=base.pulse_turns
        dpulse=base.pulse_wire_mm
        totalbuild=rx['build_mm']+pul['build_mm']
    elif topology=='shared':
        pul=rx; npulse=base.rx_turns; dpulse=base.rx_wire_mm;totalbuild=rx['build_mm']
    else:raise ValueError(topology)
    build_mm=c.rf_layer_mm+totalbuild+c.epoxy_mm
    dtotal=out+2*build_mm
    htotal=h+2*build_mm
    bore=inn-2*build_mm
    if not(c.min_od<=dtotal<=c.max_od and c.min_h<=htotal<=c.max_h and bore>=c.min_bore):return None
    # Envelope excludes empty bore; separate full cylinder volume displayed too.
    envelope=pi*(dtotal*dtotal-(max(bore,0))**2)/4*htotal/1000
    p0=2*(w+h)-(8-2*pi)*fil
    def get_length(pk):return sum(n*(p0+2*pi*off)/1000 for n,off in pk['layers'])
    lr=get_length(rx);lp=get_length(pul)
    rr=RHO_CU*lr/(pi*(base.rx_wire_mm/2000)**2)
    rp=RHO_CU*lp/(pi*(dpulse/2000)**2)
    # Ideal toroidal approximation (finite wire geometry not FEM): L=mu0*N^2 h ln(ro/ri)/(2pi)
    # rounded cross-section volume correction integral for L included via radial quadrature
    r=np.linspace(inn/2000,out/2000,120)
    f=fil/1000;h0=h/1000;min_edge=np.minimum(r-r[0],r[-1]-r)
    ze=np.where(min_edge<f,h0/2-f+np.sqrt(np.maximum(0,f*f-(f-min_edge)**2)),h0/2) if f>0 else np.full_like(r,h0/2)
    ll_shape=np.trapezoid(2*ze/r,r)
    lr_h=MU0*base.rx_turns**2*ll_shape/(2*pi)
    lp_h=MU0*npulse**2*ll_shape/(2*pi)
    # At mean radius, 3mT tipping field; locally B~1/r
    rmid=(out+inn)/4000
    pulse_i=c.pulse_target_mt*1e-3*2*pi*rmid/(MU0*npulse)
    # Sudden-off voltage, unclamped; actual driver must clamp below voltage rating.
    vdrive=lp_h*pulse_i/(c.pulse_off_us*1e-6)
    v_rx=(vdrive if topology=='shared' else c.coupling_separate*sqrt(lr_h*lp_h)*pulse_i/(c.pulse_off_us*1e-6))
    if pulse_i>c.pulse_max_current_a or vdrive>c.pulse_max_clamp_v:return None
    epulse=pulse_i**2*rp*c.pulse_duration_ms/1000/c.pulse_efficiency
    f0=GAMMA*c.b_earth_ut*1e-6/(2*pi)
    omega=2*pi*f0
    # explicit receiver RLC series network, same transfer for signal and copper noise
    Rsw=c.switch_r_shared_ohm if topology=='shared' else c.switch_r_separate_ohm
    Rseries=rr+Rsw
    Qraw=omega*lr_h/Rseries
    # Exact series LC at proton Larmor, not fake Q multiplication of amplifier noise.
    C_tune=1/(omega**2*lr_h)
    load=c.input_load_ohm
    Hsig=load/(load+Rseries) # at tuned resonance
    # short-pulse ringdown upper-bound proxy; topology-specific assumed front-end recovery
    qeff=min(50,Qraw)
    taur=2*qeff/omega
    deadbase=(c.dead_base_shared_ms if topology=='shared' else c.dead_base_separate_ms)/1000
    dead=deadbase+taur*np.log1p(v_rx/c.v_lna_v)
    if dead>.5:return None
    switch_n=(c.switch_noise_shared_nv if topology=='shared' else c.switch_noise_separate_nv)*1e-9
    enoise=np.sqrt((4*KB*c.t_k*Rseries)*Hsig*Hsig+(c.amp_nv_root_hz*1e-9)**2+switch_n**2+
                   (c.amp_pa_root_hz*1e-12*(Rseries*load/(Rseries+load)))**2)
    return dict(outer_total_mm=dtotal,height_total_mm=htotal,bore_free_mm=bore,
                envelope_cm3=envelope,volume_ml=vm,
                rx_layers=len(rx['layers']),pulse_layers=0 if topology=='shared' else len(pul['layers']),
                rx_length_m=lr,pulse_length_m=0 if topology=='shared' else lp,
                rx_ohm=rr,pulse_ohm=rp,rx_l_mh=lr_h*1000,pulse_l_mh=lp_h*1000,
                pulse_i_a=pulse_i,pulse_energy_j=epulse,pulse_off_v=vdrive,receiver_induced_v=v_rx,
                receiver_dead_s=dead,receiver_noise_nv_root_hz=enoise*1e9,rx_transfer=Hsig,
                rx_q=Qraw,rx_c_tune_nf=C_tune*1e9,rf_mode_volume_ml=1.15*vm+c.rf_fringe_volume_ml,
                layers_rx=rx['layers'],layers_pulse=[] if topology=='shared' else pul['layers'])


def scene(base:Base, cfg:Config):
    # Centerline Gaussian-Legendre quadrature for rounded rectangle and azimuthal copies.
    from numpy.polynomial.legendre import leggauss
    ro,ri=base.outer_mm/2000,base.inner_mm/2000
    h,c=base.height_mm/1000,base.fillet_mm/1000
    xr,wr=leggauss(7)
    xz,wz=leggauss(5)
    r=ri+(1+xr)*(ro-ri)/2
    zw=np.minimum(r-ri,ro-r)
    zmax=np.where(zw<c,h/2-c+np.sqrt(np.maximum(0,c*c-(c-zw)**2)),h/2) if c>0 else np.full_like(r,h/2)
    z=zmax[:,None]*xz[None,:]
    phi=2*pi*(np.arange(16)+.5)/16
    R,Z,P=np.broadcast_arrays(r[:,None,None],z[:,:,None],phi[None,None,:])
    W=np.broadcast_to(R*(wr[:,None,None]*(ro-ri)/2)*(wz[None,:,None]*zmax[:,None,None])*(2*pi/16),R.shape)
    return R.reshape(-1), Z.reshape(-1), P.reshape(-1),W.reshape(-1)


def phys_signal(base:Base, topo:str, mode:str, gg:dict,c:Config,scen=None):
    R,Z,P,W=scene(base,c)
    omega=GAMMA*c.b_earth_ut*1e-6
    rmid=(base.inner_mm+base.outer_mm)/4000
    wx=np.cos(P);wy=np.sin(P)
    tx=-wy; ty=wx # local e_phi
    Mthermal=c.proton_density*(GAMMA*HBAR/2)**2/(KB*c.t_k)*c.b_earth_ut*1e-6
    rf_eff_volume=gg['rf_mode_volume_ml']
    # Energy-balance motivated proxy: B1^2 ~ P*Q /(omega_rf V_mode)
    # Calibrated only in chosen reference state (100mL, Q=120), not absolute EM solution.
    b1=(rmid/R)*(1-.12*(2*Z/(base.height_mm/1000))**2)*(1+0.06*np.cos(2*P))
    brms=np.sqrt(np.sum(W*b1*b1)/max(W.sum(),1e-30));b1=b1/brms
    psat=c.rf_sat_reference_w*(rf_eff_volume/c.rf_reference_volume_ml)*(c.rf_reference_q/base.rf_q)
    # Two distinct ES(R) subensembles, phenomenological line model (NOT a measured radical spectrum).
    # Single tone tuned to +Delta; time-multiplex dual tuned +/-Delta, retaining finite tuning loss.
    centers=[-c.esr_split_half_mhz,c.esr_split_half_mhz]
    freqs=[centers[1]] if mode=='single' else centers
    fractions=[1.] if mode=='single' else [.5,.5]
    eta_rf=1. if mode=='single' else c.multitone_transfer
    s_list=[]
    for center in centers:
        alpha=np.zeros_like(R)
        for freq,frac in zip(freqs,fractions):
            lorentz=1/(1+((freq-center)/c.esr_width_mhz)**2)
            alpha+= (base.rf_power_w/psat)*eta_rf*frac*lorentz*(b1*b1)
        s_list.append(alpha/(1+alpha))
    sat=0.5*(s_list[0]+s_list[1])
    gamma_real=c.dnp_enhancement_max if scen is None else scen['enhancement_max']
    buildup=1-np.exp(-base.rf_s*(1+.35*sat)/c.dnp_buildup_time_s)
    enh=1+gamma_real*sat*buildup
    rx_unit_per_a=MU0*base.rx_turns/(2*pi*R)
    # Local impulse field Bp~1/r. Adiabatic onset and fast cutoff upper-bound model:
    Bp=c.pulse_target_mt*1e-3*rmid/R
    b0=c.b_earth_ut*1e-6
    angles=[(t,a) for t in (0,25,50,70,90) for a in (0,45,90,135)]
    results=[]
    for theta,azimuth in angles:
        t=theta*pi/180;ph=azimuth*pi/180
        ux=sin(t)*cos(ph);uy=sin(t)*sin(ph);uz=cos(t)
        dot=ux*tx+uy*ty
        btot=np.sqrt(b0*b0+Bp*Bp+2*b0*Bp*dot)
        # M_tip dot b_rx: rotate/reorient magnetization toward B_total during pulse,
        # then sudden release in Earth-field frame. This is NOT a full Bloch integration.
        realproj=((Bp+b0*dot)*(1-dot*dot))/np.maximum(btot,1e-20)
        # Non-ideal rapid cutoff: transparency factor, held common to avoid fabricating relative gain
        coil_proj=realproj
        amp=omega*np.sum(W*Mthermal*enh*rx_unit_per_a*coil_proj)*gg['rx_transfer']
        wg=W*enh*np.maximum(coil_proj,0)*rx_unit_per_a
        zm=np.sum(wg*Z)/max(wg.sum(),1e-40)
        vr=np.sum(wg*(Z-zm)**2)/max(wg.sum(),1e-40)
        sigma_w=GAMMA*c.gradient_nt_m*1e-9*sqrt(max(vr,0))
        # Frequency-information equivalent signal: spatial-gradient Gaussian dephasing
        dead=gg['receiver_dead_s']
        x=np.linspace(dead,dead+c.read_time_s,72)
        y=np.exp(-2*x/(c.t2_chemical_s if scen is None else scen['t2_s'])-(sigma_w*x)**2)
        i0=np.trapezoid(y,x);i1=np.trapezoid(x*y,x);i2=np.trapezoid(x*x*y,x)
        fisher=max(i2-i1*i1/max(i0,1e-40),1e-30)
        err=gg['receiver_noise_nv_root_hz']*1e-9/(GAMMA*max(amp,1e-30)*sqrt(fisher))*1e12
        results.append((err,amp,theta,azimuth))
    worst=max(results,key=lambda x:x[0]);best=min(results,key=lambda x:x[0]);
    rf_energy=base.rf_power_w*base.rf_s/c.rf_driver_efficiency
    controller=c.controller_w*(base.rf_s+c.read_time_s+gg['receiver_dead_s'])
    rf_extra=c.multitone_extra_j if mode=='dual' else 0
    return dict(delta_worst_pt=worst[0],delta_best_pt=best[0],energy_j=rf_energy+controller+gg['pulse_energy_j']+rf_extra,
      rf_input_energy_j=rf_energy,controller_energy_j=controller,
      heading_amp_ratio=min(x[1] for x in results)/max(x[1] for x in results),
      amp_worst_uv=min(x[1] for x in results)*1e6,amp_best_uv=max(x[1] for x in results)*1e6,
      saturation_mean=float(np.sum(W*sat)/np.sum(W)),enhancement_mean=float(np.sum(W*enh)/np.sum(W)),
      worst_theta_deg=worst[2],worst_azimuth_deg=worst[3],receiver_dead_ms=gg['receiver_dead_s']*1000)


def sample_base(rng:random.Random)->Base:
    outer=rng.uniform(40,82)
    inner=outer*rng.uniform(.43,.78)
    h=rng.uniform(22,88)
    fil=rng.uniform(0,min((outer-inner)/4,h/2)*.9)
    rx_turns=rng.choice((300,450,600,750,900,1100,1400))
    rx_wire=rng.choice((.30,.36,.40,.45,.50,.54))
    pulse_turns=rng.choice((80,120,180,240,360))
    pulse_wire=rng.choice((.45,.60,.75,.9))
    rf_power=rng.choice((.12,.20,.35,.50,.75,1.0))
    rf_s=rng.choice((.7,1.,1.5,2.,2.5))
    rf_q=rng.choice((60.,100.,160.,240.))
    return Base(round(outer,4),round(inner,4),round(h,4),round(fil,4),rx_turns,rx_wire,pulse_turns,pulse_wire,rf_power,rf_s,rf_q)


def generate(nbase=1250,seed=20261025,c=Config()):
    rng=random.Random(seed)
    out=[];attempts=0
    topologies=['shared','separate'];modes=['single','dual']
    rejects={}
    while len(out)<nbase*4 and attempts<nbase*500:
        attempts+=1
        base=sample_base(rng)
        gs={top:geo(base,top,c) for top in topologies}
        if any(v is None for v in gs.values()):
            rejects['geometry_or_pulse_limits']=rejects.get('geometry_or_pulse_limits',0)+1
            continue
        baseline_id=len(out)//4+1
        for top in topologies:
            for mode in modes:
                m=phys_signal(base,top,mode,gs[top],c)
                cols={k:v for k,v in gs[top].items() if not k.startswith('layers_')}
                out.append(dict(id=len(out)+1,base_id=baseline_id,topology=top,rf_mode=mode,
                                **asdict(base),**cols,**m))
    if len(out)!=4*nbase:raise RuntimeError('Unable to sample enough feasible pairs')
    return out,dict(attempts=attempts,rejected=rejects)


def pareto(rows,objectives=('delta_worst_pt','energy_j','envelope_cm3')):
    # exact finite Pareto, with floating tolerance. Sort by first axis then skyline on others.
    sorted_rows=sorted(rows,key=lambda x:tuple(x[k] for k in objectives))
    front=[]
    for r in sorted_rows:
        if any(all(q[k]<=r[k]+1e-12 for k in objectives) and any(q[k]<r[k]-1e-12 for k in objectives) for q in front):continue
        front=[q for q in front if not (all(r[k]<=q[k]+1e-12 for k in objectives) and any(r[k]<q[k]-1e-12 for k in objectives))]
        front.append(r)
    return front


def write_results(outdir:Path,nbase=1250,seed=20261025,c=Config()):
    outdir.mkdir(exist_ok=True,parents=True)
    data,stat=generate(nbase,seed,c)
    fr=pareto(data)
    keys=list(data[0].keys())
    with (outdir/'designs_5000.csv').open('w',encoding='utf-8',newline='') as f:
        wr=csv.DictWriter(f,fieldnames=keys);wr.writeheader();wr.writerows(data)
    with (outdir/'pareto.csv').open('w',encoding='utf-8',newline='') as f:
        wr=csv.DictWriter(f,fieldnames=keys);wr.writeheader();wr.writerows(fr)
    topo={k:sum(row['topology']==k for row in fr) for k in ('shared','separate')}
    rfmode={k:sum(row['rf_mode']==k for row in fr) for k in ('single','dual')}
    errs=[row['delta_worst_pt'] for row in data]
    stats=dict(total=len(data),base=nbase,pairs=nbase,front=len(fr),topology_front=topo,rfmode_front=rfmode,
               min_err_pt=min(errs),median_err_pt=float(np.median(errs)),attempts=stat['attempts'],
               limits=dict(min_od=c.min_od,max_od=c.max_od,min_h=c.min_h,max_h=c.max_h,min_bore=c.min_bore),
               status='SCENARIO MODEL UNCALIBRATED',physics=asdict(c))
    (outdir/'summary.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
    return data,fr,stats

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--output',default='out');ap.add_argument('--nbase',type=int,default=1250);ap.add_argument('--seed',type=int,default=20261025)
    args=ap.parse_args()
    _,_,stats=write_results(Path(args.output),args.nbase,args.seed)
    print(json.dumps({k:v for k,v in stats.items() if k!='physics'},ensure_ascii=False,indent=2))