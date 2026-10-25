# GeoMesh Overhauser V3 · 5000 paired geometries

Interactive [GitHub Pages](https://usernamemp.github.io/agile-final-project/v3/).

This is an **uncalibrated hypothesis model**, **not** FEM and **not** a measured sensitivity or absolute precision of the proposed magnetometer.

## Files

- `index.html`: rotating 3D Pareto and coil geometry viewer, compares four variants for every physical base.
- `data-00.csv` … `data-09.csv`: ten 500-row shards, 5000 records total.
- `FORMULAS.md`: all equations, coefficients, numerical approximations, unit conventions, omissions and physical caveats (Russian).
- `model_v3.py`: self-contained NumPy Python code that deterministically recomputes the entire dataset.
- `summary.json`: seed, assumptions and control counts.
- `test_model_v3.py`: smoke, geometry, paired-study and Pareto checks.

## Recompute

```bash
python -m pip install numpy
python model_v3.py --output output --nbase 1250 --seed 20261025
python test_model_v3.py
```

The model has 1250 matched geometry/RF bases. Each is evaluated as:
`shared/single`, `shared/dual`, `separate/single`, `separate/dual`.
**Every four treatment runs share the same reference vessel, receive winding, RF power/time/Q.** A base is accepted only when both winding topologies satisfy the full external 60–100 mm diameter, 20–100 mm height and free-bore limits.

## Crucial limits

RF spectral lines, radical chemistry, Overhauser enhancement, parasitic inductances, electronics recovery, temperature drift and calibration are not known for GeoMesh and are treated as explicit hypotheses. The geometry is a rounded annular cylinder, real winding layers are calculated, but 3D FEM and detailed Bloch dynamics are not solved. The system reports a **scenario-based frequency-error CRLB**, *not* absolute heading error and *not* guaranteed pT sensitivity. See `FORMULAS.md` sections 14–17.

The previous V2 is available in Git history and the earlier root-level CSV; this version supersedes it for exploration, not for manufacturing.