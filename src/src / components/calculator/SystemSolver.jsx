import React, { useState } from 'react';
import { solveSystem } from '@/lib/linearAlgebra';
import StepsList from './StepsList';
import { formatResult } from '@/lib/mathEngine';
import { Network } from 'lucide-react';

const DEFAULTS = {
  2: { coeffs: [[1, 1], [1, -1]], consts: [5, 1] },
  3: { coeffs: [[1, 1, 1], [1, -1, 0], [0, 1, -1]], consts: [6, 1, 1] },
};
const VARS = ['x', 'y', 'z'];

export default function SystemSolver() {
  const [size, setSize] = useState(2);
  const [coeffs, setCoeffs] = useState(DEFAULTS[2].coeffs.map((r) => [...r]));
  const [consts, setConsts] = useState([...DEFAULTS[2].consts]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const changeSize = (n) => {
    setSize(n);
    setCoeffs(DEFAULTS[n].coeffs.map((r) => [...r]));
    setConsts([...DEFAULTS[n].consts]);
    setResult(null);
    setError(null);
  };

  const updateCoeff = (i, j, v) => {
    setCoeffs((prev) =>
      prev.map((row, ri) => (ri === i ? row.map((c, ci) => (ci === j ? v : c)) : row))
    );
  };
  const updateConst = (i, v) => {
    setConsts((prev) => prev.map((c, ci) => (ci === i ? v : c)));
  };

  const handleSolve = () => {
    try {
      const cNum = coeffs.map((row) => row.map(Number));
      const bNum = consts.map(Number);
      const res = solveSystem(cNum, bNum);
      setResult(res);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not solve');
      setResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5">
        <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-4">
          <Network className="w-4 h-4" /> Systems of Equations
        </div>
        <div className="flex gap-2 mb-4">
          {[2, 3].map((n) => (
            <button
              key={n}
              onClick={() => changeSize(n)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                size === n
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {n}×{n} System
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: size }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-wrap">
              {Array.from({ length: size }).map((_, j) => (
                <React.Fragment key={j}>
                  <input
                    value={coeffs[i]?.[j] ?? ''}
                    onChange={(e) => updateCoeff(i, j, e.target.value)}
                    inputMode="decimal"
                    className="w-12 bg-slate-800 text-white rounded-lg px-1 py-1.5 text-sm font-mono text-center outline-none focus:ring-1 ring-indigo-500"
                  />
                  <span className="text-slate-300 text-sm w-4">{VARS[j]}</span>
                  <span className="text-slate-500 text-sm w-3">{j < size - 1 ? '+' : '='}</span>
                </React.Fragment>
              ))}
              <input
                value={consts[i] ?? ''}
                onChange={(e) => updateConst(i, e.target.value)}
                inputMode="decimal"
                className="w-14 bg-slate-800 text-white rounded-lg px-1 py-1.5 text-sm font-mono text-center outline-none focus:ring-1 ring-indigo-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSolve}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-500 hover:to-indigo-500 transition"
        >
          Solve System
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-900/30 border border-rose-700/50 p-4 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 p-4">
            <div className="text-slate-300 text-sm mb-2">Solution</div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-white text-xl font-semibold font-mono">
              {result.solution.map((v, i) => (
                <span key={i}>
                  {VARS[i]} = {formatResult(v)}
                </span>
              ))}
            </div>
          </div>
          <StepsList steps={result.steps} title="Elimination steps" />
        </>
      )}
    </div>
  );
}
