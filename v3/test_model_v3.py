#!/usr/bin/env python3
"""Regression checks for GeoMesh V3 screening model; NOT scientific validation."""
import csv
from dataclasses import replace
from pathlib import Path
import numpy as np
from model_v3 import Config, Base, geo, scene, generate, pareto

ROOT=Path(__file__).parent

def test_precomputed():
    rows=list(csv.DictReader((ROOT/'output'/'designs_5000.csv').open(encoding='utf-8')))
    assert len(rows)==5000
    ids=sorted(set(int(r['base_id']) for r in rows));assert ids==list(range(1,1251))
    for k in ids:
        a=rows[4*(k-1):4*k]
        assert { (r['topology'],r['rf_mode']) for r in a }=={('shared','single'),('shared','dual'),('separate','single'),('separate','dual')}
        assert len({r['outer_mm'] for r in a})==1
        assert len({r['inner_mm'] for r in a})==1
        assert len({r['height_mm'] for r in a})==1
        assert len({r['rx_turns'] for r in a})==1
        for r in a:
            assert 60<=float(r['outer_total_mm'])<=100
            assert 20<=float(r['height_total_mm'])<=100
            assert float(r['bore_free_mm'])>=10
            assert float(r['energy_j'])>0
            assert float(r['delta_worst_pt'])>0
    front=pareto([{k:(float(v) if k in {'delta_worst_pt','energy_j','envelope_cm3'} else v) for k,v in r.items()} for r in rows])
    assert len(front)==223, len(front)
    modes={r['rf_mode'] for r in front};tops={r['topology'] for r in front}
    assert modes=={'single','dual'} and tops=={'shared','separate'}
    print('PASS 1: 5000 matching rows, four treatments per 1250 bases, bounds')
    print('PASS 2: exact Pareto has 223 points, both RF and winding types present')


def test_geometry_and_physics():
    c=Config()
    b=Base(68,36,55,4,700,.40,120,.75,.5,1.5,100)
    for t in ['shared','separate']:
        g=geo(b,t,c);assert g is not None
        R,Z,P,W=scene(b,c)
        error=abs(W.sum()*1e6-g['volume_ml'])/g['volume_ml']
        assert error<.004,error
    assert geo(b,'shared',c)['envelope_cm3']<geo(b,'separate',c)['envelope_cm3']
    assert geo(b,'separate',c)['rx_layers']>=1
    assert geo(b,'separate',c)['pulse_layers']>=1
    assert geo(b,'shared',c)['pulse_layers']==0
    assert geo(b,'shared',replace(c,max_h=20.0)) is None
    print('PASS 3: rounded-volume quadrature, layers, relative envelope and height constraints')


def test_paired_features():
    rows,_=generate(100,seed=999,c=Config())
    dRF=[];dE=[];dTopology=[]
    for k in range(100):
        four=rows[4*k:4*k+4];shared1,shared2,separate1,separate2=four
        assert shared1['topology']=='shared' and shared1['rf_mode']=='single'
        assert shared2['rf_mode']=='dual' and separate1['topology']=='separate'
        assert shared1['outer_total_mm']<separate1['outer_total_mm']
        assert shared1['receiver_dead_ms']>0 and separate1['receiver_dead_ms']>0
        assert shared1['receiver_induced_v']>0 and separate1['receiver_induced_v']>0
        dRF.append(shared2['delta_worst_pt']<shared1['delta_worst_pt'])
        dE.append(shared1['energy_j']<separate1['energy_j'])
        dTopology.append(shared1['delta_worst_pt']<separate1['delta_worst_pt'])
    assert 0<sum(dRF)<100,('RF winner always fixed',sum(dRF))
    assert 0<sum(dE)<100,('energy topology winner always fixed',sum(dE))
    assert sum(dTopology)==0, 'Shared has model-imposed RX dead-time disadvantage; this test documents, not validates, it'
    print('PASS 4: both RF modes win in different sampled regimes; energy tradeoff nontrivial')
    print('PASS 5: topology receiver dead-time assumption is explicit and not observational proof')

if __name__=='__main__':
    test_precomputed();test_geometry_and_physics();test_paired_features();print('ALL REPRODUCIBILITY TESTS PASSED')