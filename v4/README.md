# GeoMesh Overhauser V4.5 — literature-anchored MVP for one toroidal head

[Open V4 on GitHub Pages](https://usernamemp.github.io/agile-final-project/v4/?rev=4.5.0)

## V4.5 (2026-10-25) — CURRENT DEFAULT

**This revision replaces the V4.3 default RF prediction with a literature-anchored, explicitly provisional coaxial-resonator scenario.** Values in older V4.0–V4.4 sections below are historical and *do not* describe the current default Pareto forecast.

- Gong et al. [JOM-4S](https://doi.org/10.3390/s21227698): RF frequency 58.8 MHz, Q=1278, liquid 175 mL, 700 turns × 0.53 mm, 22 Ω, 35 mH, measured FID decay 2.68 s, amplifier noise 1.4 nV/√Hz and 0.1 pA/√Hz, RF power 1 W in reported characterization.
- Gong et al. [2025 noise optimization](https://doi.org/10.3390/s25247491): 1400 turns × 0.54 mm, 22.5 Ω, 33.5 mH, nonmonotone SNR(N) with a scenario optimum near 1500 turns.
- Gong et al. [2026 pulse](https://doi.org/10.3390/s26082347): Q≈1500, low-frequency pulse 3 mT / 3 ms in a fast-cycle geometry. NOT evidence that the same current/turn count applies to toroidal LF winding.
- [Diglyme solvent properties](https://chem.libretexts.org/Ancillary_Materials/Reference/Reference_Tables/Solvents/S1%3A_Solvent_Properties): εᵣ≈7.23, density ≈944 kg/m³, cₚ≈2035 J/(kg K), replacing the old water-like properties.
- Source-to-parameter audit, **measured versus inferred**, and 10 design references: [LITERATURE_PARAMETERS.md](LITERATURE_PARAMETERS.md).

**RF topology toggle:** `literature` is a fitted high-Q coaxial EM-mode transfer *hypothesis for the toroidal head*, using a measured reference Q and an inferred saturation/volume law. `radial` retains the idealized current-return/symmetric-capacitor control model. Their RF fields, dielectric loading and meanings of capacitance/Q **must not be combined**. Neither option replaces a 3D electromagnetic field solution with real feed paths.

**Not directly measured:** RF saturation half-power 0.40 W, Q-volume penalty 0.35, B1 spatial nonuniformity, absorbed RF heat fraction 0.28, liquid loss tangent and radical relaxation. All are changeable in the viewer. Replacing these with the first prototype's data is a core MVP milestone.

**Optimization:** The viewer now distinguishes conditional error `pT/shot` from `pT/√Hz` time-normalized equivalent, computed as `σshot×√Tcycle` assuming independent cycles. The old randomized set is regenerated under new source ranges for turns, wire diameter and liquid properties, so old case IDs/Pareto counts must not be compared directly.

**CAD:** The checked selected-case STEP from the current solver scenario is [selected_90mm_4J/](fem/selected_90mm_4J/) and is automatically regenerated when `model.js` or CAD scripts change. STEP is geometry only, not a verified RF mode. Old case #2332 in historical V4.3 prose below is not the active V4.5 selection.

## Architecture locked for V4

**One** tall annular sensor ampule with a nearly rectangular, only mildly filleted cross-section; RF capacitor electrodes on the **inner and outer cylindrical ampule surfaces**; **one common toroidally wound low-frequency coil** used for magnetization tipping and proton FID pickup (with switched protection).

There is no probe column, radio, second head, differential LF winding, or geophysical inversion in V4.

## Main physical change

Previous revisions assumed an adjustable RF magnetic-energy participation. V4 estimates the spatial RF magnetic field for an *ideal symmetric radial-electrode capacitor* from the quasi-static **Maxwell–Ampere displacement current**:

- radial electric field \`E_r ∝ 1/r\`;
- radial displacement + conduction current \`J_r = (σ+iωε) E_r\`;
- azimuthal RF magnetic field \`B1_phi ∝ J_r·z\`;
- **an RF magnetic-field node near the liquid middle plane** in the ideal symmetric limit;
- electrode capacitance, RF inductive matching, loaded Q and dielectric/conductive heating;
- **unknown RF feed and return-current geometry represented by κ_feed**, selectable in the app.

This is a *hypothesis for a particular Maxwell boundary-value problem*, not a validated RF field for the proposed split-electrode layout. RF FEM or an experimental B1/ESR scan is a mandatory feasibility gate. Merely energizing two RF plates does not guarantee enough transverse RF magnetic field to drive DNP.

## Files

- [index.html](index.html) — responsive no-build standalone interactive viewer, 3D Pareto, 3D high-torus coil and plates, pairwise RF compare, filters, CSV export and selective Bloch pulse check.
- [model.js](model.js) — seeded deterministic scenario engine (2500 high-torus winding/pulse/RF geometries × 2 frequency modes = 5000).
- [FORMULAS.md](FORMULAS.md) — equations, assumptions, RF capacitor loading and Maxwell–Ampere approximation, winding pack, common-coil pulse, parallel RLC receiver, DNP and CRLB caveats.
- [test_v4.js](test_v4.js) — reproducibility and computational self-consistency checks.

Run tests with Node.js:

\`\`\`bash
node test_v4.js
\`\`\`

No Python runtime or backend is required to use the published website; it computes 5,000 candidates in the browser and can export the current filtered dataset.

## Initial reference outcome (seed 20261025, not calibrated)

| Metric | Result |
|---|---:|
| Generated variants | 5,000 |
| Independent candidate vessels | 2,500 |
| 3D Pareto points (unfiltered) | 263 |
| Of those: single / dual RF | 143 / 120 |
| Smallest conditional frequency-error noise | ~258 pT/shot |
| Minimum energy among all candidates | ~0.366 J/shot |

The absolute values **must not be compared** with Li et al.'s 1.69 pT/√Hz without matched bandwidth/time and validated electron-radical and RF parameters. The large modeled noise is *not proof that the hardware will have this noise*: it illustrates how strongly the unverified RF electrode mode and DNP gain govern the forecast. **Critical parameter inconsistency:** `T2e=55 ns` requires homogeneous ESR HWHM ≥2.89 MHz, while V4 assumes 0.40 MHz; therefore the listed pT and Pareto noise rankings are not physically calibrated. The V4.2 viewer shows signed DNP polarization and spatial cancellation diagnostics. Read FORMULAS.md audit appendix.

## Critical unfinished physics

1. Real complex RF-field map and feed/return-current paths including electrode segmentation and liquid losses.
2. Measured radical ESR spectrum, electron/nuclear relaxation and concentration-dependent DNP.
3. Susceptibility and internal fields from liquid, RF electrodes, low-frequency coil and case; heading bias.
4. Actual switching/overvoltage/LNA recovery on the same LF winding.
5. Full phase-coherent FID forward simulation with ADC and frequency estimator; current Pareto uses a screening CRLB.
6. Bloch pulse integration is **on demand** for the selected configuration, not yet the 5000-point optimization kernel.

No claim of verified sensitivity or metrological absolute accuracy is made.

## Prior revisions

[V3](../v3/) remains accessible. This V4 uses a **fixed single-coil toroid** rather than randomizing among physically different LF winding topologies.

## V4.1 errata and parameter consistency (2026-10-25)

The earlier V4.0 nominal RF/ESR assumptions used `T2e=55 ns` with a hypothetical Lorentzian ESR HWHM of `0.40 MHz`. These values cannot both describe one homogeneous ESR line: `Γ_HWHM >= 1 / (2π T2e)`; at 55 ns the lower bound is 2.89 MHz.

**V4.1 defaults are `T2e=420 ns` and ESR HWHM `0.40 MHz`** (minimum 0.379 MHz), an internally consistent **hypothetical example**, **not** measured radical parameters. Both values are user-editable. The model explicitly rejects inconsistent combinations on rebuild.

The large shift ~826 → ~124 pT/shot is a **sensitivity-to-assumptions demonstration, not an observed increase in magnetometer performance**. Loaded resonator RF Q is still approximately 11.6 in this scenario, and the idealized symmetric electrode current-return geometry may not represent the eventual hardware. A full 3D complex RF field and measured radical ESR/relaxation are essential. Literature's 1.69 pT/√Hz is not numerically equivalent to predicted pT/shot.

Previous browser bug `PI is not defined` has been addressed by defining `PI` in the page code and versioning `model.js?v=4.1.1`. A browser simulation tests: initial 5,000, diameter 90 mm → 4,924, press Recalculate → 4,924, and inconsistent ESR → clear message.

## Reproducible execution, GitHub Actions and Ansible

All regressions on a local machine with Node.js 22:

```bash
bash v4/run-tests.sh
```

Run directly:

```bash
node v4/test_v4.js
node v4/test_browser_smoke.js
```

Each push that changes `v4/**` runs [GeoMesh V4 regression](../../.github/workflows/geomesh-v4-regression.yml) via GitHub Actions (no VPS needed).

To run the *same checks*, not a field solver, through Ansible:

```bash
ansible-playbook -i v4/ansible/inventory.example.ini v4/ansible/verify.yml
```

The inventory targets **localhost**; change it explicitly to an authorized machine only if remote execution is intended. The playbook uses a public read-only clone in `/tmp/geomesh-v4-verification` and checks that `git` and `node` are installed. No private repository, VPS credentials, or GeoMesh column-specific code is involved.

**Scope reminder:** these are software regression checks. They do not validate spin physics or measured pT sensitivity.


## FEM handoff (V4.2)

- [3D STEP assembly](fem/generated/GeoMesh_V4_FEM_assembly.step) with separate named solids for liquid, vessel, slotted RF electrodes, effective LF winding and encapsulation.
- [Geometry manifest](fem/generated/geometry_manifest.json) and [CadQuery source](fem/build_cad.py).
- [Machine-readable solver study specification](fem/solver_config.json): RF (COMSOL RF / ANSYS HFSS), LF and static susceptibility (COMSOL AC/DC / ANSYS Maxwell).
- [FEM setup guidance](fem/README.md) including port topology, results required for the optimizer and verification gates.

The CAD export was generated and checked by GitHub Actions, but **no COMSOL/ANSYS model has been solved**: no software license or physically defined RF feeds were available in this environment. The STEP baseline is an illustrative candidate, **not** the selected Pareto optimum.

## V4.3 layered-vessel correction (2026-10-25)

The V4.0–4.2 circuit incorrectly modeled an RF capacitor directly across the liquid, even though the actual STEP vessel places RF metal electrodes **outside the insulating vessel walls**. V4.3 introduces the two dielectric wall layers in series with the liquid, recomputes RF capacitance, liquid voltage division, effective liquid RF B1, dielectric Q, liquid/wall heat deposition and winding package dimensions. The code exposes wall thickness, wall dielectric constant and wall loss tangent.

With the representative Ø70/36 × H75 mm liquid and 0.7 mm walls (electrode end clearance 3 mm), the ideal-coaxial capacitance changes **415.6 pF → 154.3 pF**, and the nominal calculated B1 at 0.5 W **2.04 µT → 1.48 µT**, while Q increases due to reduced liquid participation. These are **analytic screening numbers**, not RF FEM.

GitHub Actions check both model physics and the UI at Ø90 mm. Current regression reports **5,000 scenarios, 263 Pareto points, and 257.6 pT/shot minimum conditional frequency error**. This is not measured sensor noise or proof that this topology cannot reach a few pT. Actual RF feed and liquid-specific ESR parameters remain the dominant unknowns. Full [derivation](FORMULAS.md).

## Exported selected single-head STEP (V4.3)

The research-screened candidate with minimum conditional sigma under package OD ≤90 mm, full height ≤100 mm and cycle energy ≤4 J was built by GitHub Actions as a **real CAD STEP solid assembly**, with the same geometry parameters as the live model:

- Case **#2332**, liquid OD **73.091 mm**, liquid ID **37.184 mm**, liquid height **85.159 mm**, corner radius **3.399 mm**;
- Common LF winding **1350 turns**, 0.45 mm conductor, computed winding build **4.032 mm**;
- Full assembly diameter **85.255 mm**, full height **97.323 mm**, free bore **25.020 mm**;
- Liquid volume **263.120 ml**;
- Conditional frequency error **257.64 pT/shot**, cycle energy **3.322 J** (uncalibrated scenario).

Files: [3D STEP](fem/selected_90mm_4J/GeoMesh_V4_FEM_assembly.step), [JSON input](fem/selected_90mm_4J/candidate_config.json), [CAD manifest](fem/selected_90mm_4J/geometry_manifest.json).
You can download any chosen case from the viewer as a CAD JSON, then invoke `python v4/fem/build_cad.py --config selected.json --out output`. The selected assembly has **seven CAD solids**, not 1350 explicit copper wire turns. No COMSOL/ANSYS Maxwell field calculation has been executed, and this case is not necessarily physically optimal.

## V4.4 — phase-coherent synthetic FID and digital frequency estimator (2026-10-25)

The [GitHub Pages V4 viewer](index.html) now offers **an on-demand selected-case complex IQ FID simulation**, not just the screening CRLB. The existing 5,000 cases and their Pareto ranking are intentionally unchanged.

- `fid.js`: integrates 700 cylindrical-volume sample cells (7 radial × 5 axial × 20 azimuthal) using signed Overhauser enhancement, coil receive weighting, the currently *screened* nuclear-tip approximation, uniform proton `T2*` decay and an axial **scalar** linear gradient. It calculates a complex baseband FID after the pulse blanking interval. The common phase convention is a scenario assumption; phase-resolved RF FEM / local Bloch simulations have **not** been imported.
- Adds Gaussian independent I/Q receiver noise from the assumed LF noise density and ideal antialias sampling, deterministic by seed. The default synthetic trial has a known +0.23 Hz offset. The digital estimator fits an unknown complex amplitude and searches coherent frequency offset on a coarse grid with local refinement; it **does not cheat by inserting the known offset into the fit**.
- Displays ideal I, noisy I and noisy Q; the viewer can **export time-stamped ideal/noisy I/Q samples with provenance as CSV**. Outputs fitted frequency, its error in pT for that cycle, local white-noise conditional CRLB and 16/32/64-trial Monte Carlo standard deviation and bias. Angular choices: 0°, 45°, 90°.
- The output is a *reproducible algorithmic experiment*, not a measurement of sensitivity, a calibrated pT number or a completed signal-chain design. The estimator assumes the same `T2*`, gradient and spatial weighting as its generator. This matched-model lower bound must be revisited with real phase-resolved B1, LF sensitivity, susceptibility, ADC quantization/jitter, filtering, power-line interference, magnetic 1/f noise and measured radical relaxation.
- `test_fid.js` checks zero-noise frequency recovery, seeded reproducibility, geometry sampling, angular response and nonzero simulated noise. `test_browser_smoke.js` invokes the new published UI action. Both are run by `run-tests.sh` and the GitHub Actions regression workflow.

**Important:** V4.4 does not redefine the Pareto `errorPT` from V4.3 as Monte Carlo standard deviation. Their forward models differ and must not be conflated or presented as agreement until the RF field, relaxation, pulse and receive circuit have been validated. The current frequency simulator handles one selected construction at a time to keep interactivity fast.
