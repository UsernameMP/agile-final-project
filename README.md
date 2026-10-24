# GeoMesh Overhauser — interactive optimization viewer

This is a static publication of the **scenario-based (not experimentally validated)** GeoMesh Overhauser magnetometer parametric study.

* 5,000 generated geometries, filtered by final outer diameter, height, bore, energy, and noise.
* 3D Pareto-front viewer and a rotatable coil geometry viewer; Canvas fallback if WebGL is not available.
* Five reference geometries, RF-mode and winding-topology comparison.
* Full mathematical model and assumptions in [formulas.md](./formulas.md).
* Ten CSV shards (`designs-00.csv` to `designs-09.csv`) containing all 5,000 solutions.

## Enable GitHub Pages

Repo settings → Pages → **Deploy from a branch** → branch **gh-pages**, folder **/(root)** → Save.

Expected public address: https://usernamemp.github.io/agile-final-project/

## Scope and limitations

The pT figures are **conditional predictions**, not calibrated sensitivity or absolute accuracy. RF/DNP and solution relaxation parameters are assumptions. Use FEM and laboratory calibration before engineering design freeze. No confidential GeoMesh source, keys, or credentials are included here.
