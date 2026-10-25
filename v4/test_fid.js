#!/usr/bin/env node
'use strict';
/* Research-code regression: the analytic RF/DNP scenario is NOT physically validated. */
const assert=require('node:assert/strict');
require('./model.js');
require('./fid.js');
const M=globalThis.GeoMeshV4,F=globalThis.GeoMeshV4FID;
assert.equal(typeof F.run,'function');
const candidate=M.build({},12,20261025).points[0];
const opts={orientationDeg:0,sampleRateHz:80,durationS:1.6,offsetHz:.23,seed:13};
const exact=F.baseband(candidate,{}, {...opts,noiseScale:0});
assert.equal(exact.time.length,128);
assert.equal(exact.cells,700);
assert.ok(exact.deadS>0);
const ideal=F.fitFrequency(exact);
assert.ok(Math.abs(ideal.offsetHz-opts.offsetHz)<.001,'noiseless frequency recovers injected offset');
assert.equal(ideal.crlbPT,0);
const sim=F.run(candidate,{}, {...opts,noiseScale:1,trials:24});
const same=F.run(candidate,{}, {...opts,noiseScale:1,trials:24});
assert.deepEqual(sim.fit,same.fit,'reproducible random seed');
assert.deepEqual(sim.mc,same.mc,'reproducible Monte Carlo');
assert.ok(Number.isFinite(sim.fit.crlbPT)&&sim.fit.crlbPT>0);
assert.ok(Number.isFinite(sim.mc.stdPT)&&sim.mc.stdPT>=0);
assert.ok(Number.isFinite(sim.fit.deltaPT));
assert.equal(sim.mc.trials,24);
const cross=F.baseband(candidate,{}, {...opts,orientationDeg:90,noiseScale:0});
assert.ok(Math.abs(exact.idealRe[0]-cross.idealRe[0])>1e-16,'angular dependence retained');
assert.throws(()=>F.baseband(candidate,{}, {...opts,sampleRateHz:5}),/Частота/);
console.log(JSON.stringify({status:'pass',revision:'V4.4',samples:exact.time.length,
 cells:exact.cells,noiselessOffsetHz:ideal.offsetHz,coherentCRLBpT:sim.fit.crlbPT,
 monteCarloStdPT:sim.mc.stdPT,monteCarloCycles:sim.mc.trials},null,2));
