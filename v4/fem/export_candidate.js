#!/usr/bin/env node
'use strict';
/* Export one Pareto-screened *geometry* for CadQuery / STEP, not a solved RF field.
 * All numbers remain conditional scenario outputs of GeoMesh V4.3.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('../model.js');
const M=globalThis.GeoMeshV4, c=M.DEF;
const maxOD=90,maxH=100,maxEnergy=4,minBore=10;
const rows=M.build({},2500,20261025).points;
const candidates=rows.filter(x=>x.od<=maxOD&&x.hh<=maxH&&x.energyJ<=maxEnergy&&x.bore>=minBore);
assert.ok(candidates.length>0,'no feasible candidates for reference CAD');
const chosen=candidates.reduce((a,b)=>a.errorPT<=b.errorPT?a:b);
assert.ok(chosen.fillet>=chosen.vesselWallMM,'rounded vessel incompatible with wall');
const overlap=Math.max(c.electrodeEndClearanceMM,chosen.fillet);
const cfg={
 outer_liquid_d_mm:chosen.outer,
 inner_liquid_d_mm:chosen.inner,
 liquid_height_mm:chosen.height,
 corner_radius_mm:chosen.fillet,
 vessel_wall_mm:chosen.vesselWallMM,
 copper_electrode_thickness_mm:c.electrodeCopperMM,
 electrode_end_clearance_mm:overlap,
 electrode_axial_slot_mm:.8,
 rf_insulation_mm:c.rfBarrierMM,
 winding_envelope_mm:chosen.coilLayers*chosen.wire*1.12,
 epoxy_mm:c.epoxyMM,
 winding_turns:chosen.turns,
 winding_wire_d_mm:chosen.wire,
 rf_nominal_frequency_mhz:58.8,
 lf_nominal_frequency_hz:267.52218744e6*50e-6/(2*Math.PI),
 rf_nominal_input_power_w:chosen.rfPower,
 nominal_earth_field_uT:50,
 source_case_id:chosen.id,source_model_version:'4.5',source_rf_mode:chosen.mode,
 source_conditional_error_pT_per_shot:chosen.errorPT,
 source_rf_architecture:chosen.rfArchitecture,
 source_cycle_s:chosen.cycleS,source_resolution_pt_sqrt_s:chosen.resolutionPTsqrtHz,
 source_cycle_energy_j:chosen.energyJ,
 source_status:'V4.5 literature-anchored scenario only; RF mode extrapolated to torus, not measured or Maxwell FEM'
};
const buildup=cfg.vessel_wall_mm+cfg.copper_electrode_thickness_mm+cfg.rf_insulation_mm+
 cfg.winding_envelope_mm+cfg.epoxy_mm;
function approx(a,b,eps=1e-7){assert.ok(Math.abs(a-b)<eps,'CAD and numeric package mismatch '+a+' vs '+b)}
approx(chosen.od,cfg.outer_liquid_d_mm+2*buildup);
approx(chosen.hh,cfg.liquid_height_mm+2*buildup);
approx(chosen.bore,cfg.inner_liquid_d_mm-2*buildup);
const output=process.argv[2]||path.join(__dirname,'selected_90mm_4J','candidate_config.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(cfg,null,2)+'\n');
console.log(JSON.stringify({output,case_id:chosen.id,scenario_sigma_pT:chosen.errorPT,cycle_j:chosen.energyJ,
 full_OD_mm:chosen.od,full_H_mm:chosen.hh,free_bore_mm:chosen.bore,geometry_screen_count:candidates.length},null,2));
