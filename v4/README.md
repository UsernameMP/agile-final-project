# GeoMesh Overhauser V4.0 — single high-toroid head

[Open V4 on GitHub Pages](https://usernamemp.github.io/agile-final-project/v4/)

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
| 3D Pareto points (unfiltered) | 203 |
| Of those: single / dual RF | 124 / 79 |
| Smallest conditional frequency-error noise | ~826 pT/shot |
| Minimum energy among all candidates | ~0.366 J/shot |

The absolute values **must not be compared** with Li et al.'s 1.69 pT/√Hz without matched bandwidth/time and validated electron-radical and RF parameters. The large modeled noise is *not proof that the hardware will have this noise*: it illustrates how strongly the unverified RF electrode mode and DNP gain govern the forecast. **Critical parameter inconsistency:** `T2e=55 ns` requires homogeneous ESR HWHM ≥2.89 MHz, while V4 assumes 0.40 MHz; therefore the listed pT and Pareto noise rankings are not physically calibrated. The new viewer shows signed DNP polarization and spatial cancellation diagnostics. Read FORMULAS.md audit appendix.

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
