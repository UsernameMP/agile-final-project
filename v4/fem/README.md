# GeoMesh Overhauser V4.2 — FEM geometry and solver handoff

**Scope:** ONE tall annular Overhauser scalar magnetic sensor, not the GeoMesh column. Nearly rectangular rounded liquid-section; electrodes on **inner and outer cylindrical walls**, one shared toroidal LF winding for tipping + FID pickup. **No FEM solver has been run here** and no calibrated prediction of pT sensitivity is claimed.

## 0. Prepared model files

- `build_cad.py` — CadQuery Python script generating a *real, parametric 3D assembly*, not just a picture. Run `python build_cad.py --out generated`. Requires `cadquery`.
- `generated/GeoMesh_V4_FEM_assembly.step` — tested CAD STEP assembly with named 3D parts: liquid, vessel, two azimuthally slotted RF electrodes, insulating shell, **homogenized** LF winding envelope, epoxy. The LF winding envelope is **not** 900 separate wires: use the multi-turn / stranded-coil physics of the solver.
- `generated/geometry_manifest.json` — part volumes and sizes.

Baseline geometry: liquid OD 70 mm, ID 36 mm, axial height 75 mm, round radius 2 mm; vessel wall 0.7 mm, Cu electrodes 0.05 mm, LF winding build 3.0 mm, barrier 0.45 mm, epoxy 0.85 mm; assembled full Ø80.1 mm × H85.1 mm, free bore Ø25.9 mm, liquid 211.721 mL. These **are an illustrative starting point, not an optimized result**.

**Physical electrode warning:** The CAD places RF metal films *outside the quartz/polymer vessel wall*. The wall therefore lies in the RF electrical path, reducing capacitance/coupling. Current V4 analytical capacitor formula did not correctly include this layered dielectric; recompute in FEM. Longitudinal 0.8-mm electrode slits are added to break closed LF circumferential loops; actual RF feed/return paths are not defined by the CAD and must be modeled.

## 1. COMSOL Multiphysics

Recommended licensed modules:

1. **RF Module → Electromagnetic Waves, Frequency Domain** at ~58.8 MHz. Import STEP as **assembly with identity pairs/continuity** if adjacent solids are not fused; retain named selections. Add surrounding air domain with sufficiently distant scattering / impedance / radiation boundary (for quasi-static benchmarking also compare with enlarging domain). Electrical contacts of inner/outer RF films require real **feed terminals**, not arbitrary imposed voltage on the entire cylinder: draw feed and return traces, add a lumped terminal/port, and model copper with transition boundary condition / impedance boundary or volumetric conductor depending on skin depth.
2. **AC/DC Module → Magnetic Fields, Frequency Domain / Transient** for low-frequency receiver and switch transients. Represent the LF winding as an **N-turn poloidal/toroidal winding** with properly defined winding direction around each rectangular *cross section*. Configure approximately 900 turns / independent design parameter, and drive the actual `I(t)` current. Compute `B_p(r,t)`, induced electrode eddy current, mutual inductance, `L`, and the receiver sensitivity map from a 1-A reciprocity solve. Validate field at mid-height against the no-core ideal toroid `mu0*N*I/(2*pi*r)` before adding conductive electrodes.
3. **AC/DC → Magnetic Fields, No Currents** or relevant Magnetostatics solve for static geomagnetic field 50 µT at multiple orientations and explicit susceptibilities `chi` of liquid, walls, electrodes, epoxy and wire. Output `B_internal(x,y,z;theta,phi)` and **heading-dependent bias**. RF/receiver simulations alone do not establish absolute field accuracy.
4. Optional **Heat Transfer in Solids and Fluids** for RF deposited power with pulse/relaxation cycle, with complex permittivity and conductivity of the real radical solution.

For a valid comparison use `f=56–61 MHz` sweep for RF, and avoid treating the RF system as a resonant capacitor with an arbitrarily assigned Q. Instead obtain `S11`, power delivered to fluid, mode patterns, loaded Q, **transverse complex `B1+`** to B0 and the field spatial distribution; include copper/solution losses. Geometry must include a real RF feed and a current return path. Conductivity (`0.004 S/m`), `epsilon_r=72`, `tan(delta)=0.03` are **hypothetical screening inputs only**.

## 2. ANSYS Electronics Desktop

Use **HFSS Driven Terminal** (or Driven Modal where appropriate) for 58.8-MHz *electromagnetic* excitation with capacitive RF electrodes and physically defined feed/return conductors. Assign complex solution permittivity, quartz/polymer wall, Cu electrode surface impedance, radiation/open air boundary, terminal excitation, and analyze `E(r)`, complex `B1(r)`, losses, `S11` and loaded RF Q. The **Maxwell 3D Eddy Current** solver by itself is not an adequate replacement for full EM RF displacement-current modeling at 58.8 MHz for this particular electrode topology.

Use **Maxwell 3D Transient** or Eddy Current for LF pulsing/receiver and electrode eddy currents; setup stranded multi-turn winding around each poloidal section and simulate `I(t)` plus switch-circuit via Twin Builder / AEDT Circuit when available. A separate Magnetostatic study with susceptibility contrasts estimates orientation-dependent internal field. Export `B1`, `B_p`, `B0` and receiver sensitivity to the external Bloch-Torrey / DNP solver.

## 3. Solver exports needed by our parametric Python/JS optimizer

All fields in SI, orientation specified, with coordinate axes and complex phasor convention written into metadata.

- RF: `x,y,z, Re(B1x), Im(B1x), Re(B1y), Im(B1y), Re(B1z), Im(B1z), Re(Ex), ..., loss_density_W_m3`; 58.8MHz; normalize by **accepted** power, not only source/forward power.
- LF: `x,y,z, Btip_x_per_A, Btip_y_per_A, Btip_z_per_A, brx_x_per_A, brx_y_per_A, brx_z_per_A`, plus coil `R,L,C_parasitic`, mutual couplings, transient switch voltage/decay.
- DC susceptibility: `x,y,z, B0x,B0y,B0z`, material chi and several orientations, `B_ref`, deviation `|B|-|B_ref|`.
- Temperature: fluid and wall temperature, heat deposition, if solved.

## 4. Verification gates before quoting any pT number

1. Mesh independence: refine until `B1_rms`, spatial RF uniformity, liquid absorbed power, coil L, and static field shift converge. Test air-domain radius and conductor representation separately.
2. Energy conservation: `P_accepted = P_dielectric + P_conductor + P_radiation + ...` within solver tolerance.
3. Compare RF port current / capacitance to analytical **layered coaxial capacitor** in the low-frequency reference model.
4. Compare ideal LF field (non-conductive walls, no electrodes) to `mu0 NI/(2pi r)` with analytic winding filling limits. Validate 900-turn coil placement in the entire bore.
5. Conductivity, susceptibility, radical ESR and T1e/T2e/T1n/T2n are measured data requirements; do not infer them from FEM itself.
6. Result of EM solve is **not** directly a sensor noise in pT. Compute DNP saturation and spatiotemporal proton magnetization from fitted spin parameters; simulate actual FID and amplifier+ADC noise and estimate frequency using same digital method as hardware.

The V4.2 website contains an illustrative RF-feed sensitivity sweep `kappa=0.5,1,2`. These are model variations, not confidence bounds; FEM field maps are the next required evidence.