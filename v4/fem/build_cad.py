#!/usr/bin/env python3
"""Build a STEP CAD assembly for ONE tall annular Overhauser magnetometer.

Requires: pip install cadquery
CAD only: no FEM physics, meshing, RF feed or calculated pT sensitivity.
Units: mm. The LF winding is a homogenized 3D shell, NOT individual copper wires.
"""
import argparse
import json
import math
from pathlib import Path
import cadquery as cq

DEFAULTS={
 "outer_liquid_d_mm":70.0,"inner_liquid_d_mm":36.0,
 "liquid_height_mm":75.0,"corner_radius_mm":2.0,
 "vessel_wall_mm":0.7,"copper_electrode_thickness_mm":0.05,
 "electrode_end_clearance_mm":3.0,"electrode_axial_slot_mm":0.8,
 "rf_insulation_mm":0.45,"winding_envelope_mm":3.0,"epoxy_mm":0.85,
 "winding_turns":900,"winding_wire_d_mm":0.40,
 "rf_nominal_frequency_mhz":58.8,"lf_nominal_frequency_hz":2129.0,
 "rf_nominal_input_power_w":0.8,"nominal_earth_field_uT":50.0
}

def rounded_annulus(ri,ro,h,f):
 if ri<=0 or ro<=ri or h<=0 or f<0 or 2*f>min(h,ro-ri):
  raise ValueError("invalid annular rounded cross section")
 if f==0:
  return (cq.Workplane("XZ").polyline([(ri,-h/2),(ro,-h/2),(ro,h/2),(ri,h/2)])
          .close().revolve(360,(0,0),(0,1)))
 return (cq.Workplane("XZ").moveTo(ri+f,-h/2).lineTo(ro-f,-h/2)
  .radiusArc((ro,-h/2+f),-f).lineTo(ro,h/2-f)
  .radiusArc((ro-f,h/2),-f).lineTo(ri+f,h/2)
  .radiusArc((ri,h/2-f),-f).lineTo(ri,-h/2+f)
  .radiusArc((ri+f,-h/2),-f).close()
  .revolve(360,(0,0),(0,1)))

def slit_electrode(ri,ro,h,slit):
 part=cq.Workplane("XY").circle(ro).circle(ri).extrude(h/2,both=True)
 if slit>0:
  tool=cq.Workplane("XY").box(ro-ri+2,slit,h+2).translate(((ri+ro)/2,0,0))
  part=part.cut(tool)
 return part

def build(p,out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 ro=p["outer_liquid_d_mm"]/2;ri=p["inner_liquid_d_mm"]/2
 h=p["liquid_height_mm"];f=p["corner_radius_mm"]
 tw=p["vessel_wall_mm"];te=p["copper_electrode_thickness_mm"]
 tr=p["rf_insulation_mm"];tc=p["winding_envelope_mm"];tx=p["epoxy_mm"]
 t=tw+te+tr+tc+tx
 if ri<=t+1 or f<tw or h<2*f+6 or min(tw,te,tr,tc,tx)<=0:
  raise ValueError("layers do not fit into bore or section")
 fluid=rounded_annulus(ri,ro,h,f)
 wallouter=rounded_annulus(ri-tw,ro+tw,h+2*tw,f+tw)
 wall=wallouter.cut(fluid)
 elech=h-2*p["electrode_end_clearance_mm"]
 if elech<=0: raise ValueError("no electrode length")
 eouter=slit_electrode(ro+tw,ro+tw+te,elech,p["electrode_axial_slot_mm"])
 einner=slit_electrode(ri-tw-te,ri-tw,elech,p["electrode_axial_slot_mm"])
 inside=rounded_annulus(ri-tw-te,ro+tw+te,h+2*(tw+te),f+tw+te)
 outside=rounded_annulus(ri-tw-te-tr,ro+tw+te+tr,h+2*(tw+te+tr),f+tw+te+tr)
 insulator=outside.cut(inside)
 coilouter=rounded_annulus(ri-tw-te-tr-tc,ro+tw+te+tr+tc,h+2*(tw+te+tr+tc),f+tw+te+tr+tc)
 coil=coilouter.cut(outside)
 finalshape=rounded_annulus(ri-t,ro+t,h+2*t,f+t)
 epoxy=finalshape.cut(coilouter)
 parts=[
  ("01_radical_liquid",fluid),
  ("02_vessel_dielectric",wall),
  ("03_outer_RF_electrode_slit",eouter),
  ("04_inner_RF_electrode_slit",einner),
  ("05_RF_insulation",insulator),
  ("06_homogenized_poloidal_LF_coil",coil),
  ("07_encapsulation",epoxy)
 ]
 ass=cq.Assembly(name="GeoMesh_Overhauser_tall_one-head")
 for name,shape in parts:ass.add(shape,name=name)
 dest=out/"GeoMesh_V4_FEM_assembly.step";ass.save(str(dest))
 volume=math.pi*(ri+ro)*((ro-ri)*h-(4-math.pi)*f*f)
 assert abs(parts[0][1].val().Volume()-volume)/volume<1e-7
 manifest={
  "status":"CAD only, not an EM/thermal/spin solution",
  "step_file":dest.name,
  "full_outer_d_mm":2*(ro+t),
  "full_h_mm":h+2*t,"free_bore_d_mm":2*(ri-t),
  "liquid_volume_ml":volume/1000,
  "parameters":p,
  "parts":[{"name":name,"volume_mm3":round(s.val().Volume(),3)} for name,s in parts]
 }
 (out/"geometry_manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
 return manifest

if __name__=="__main__":
 cli=argparse.ArgumentParser()
 cli.add_argument("--out",default="generated")
 cli.add_argument("--config",type=Path,help="JSON overrides for DEFAULTS")
 a=cli.parse_args()
 p=DEFAULTS.copy()
 if a.config:p.update(json.loads(a.config.read_text(encoding="utf-8")))
 print(json.dumps(build(p,a.out),indent=2))
