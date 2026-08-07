import React, { useState } from 'react';
import { solveTriangle } from '@/lib/triangleSolver';
import StepsList from './StepsList';
import { formatResult } from '@/lib/mathEngine';
import { Triangle as TriangleIcon } from 'lucide-react';

const FIELDS = [
  { key: 'a', label: 'a' },
  { key: 'b', label: 'b' },
  { key: 'c', label: 'c' },
  { key: 'A', label: 'A°' },
  { key: 'B', label: 'B°' },
  { key: 'C', label: 'C°' },
];

export default function TriangleSolver() {
  const [vals, setVals] = useState({ a: '3', b: '4', c: '5' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSolve = () => {
    try {
      const res = solveTriangle(vals);
      setResult(res);
      setError(null);
    } catch (e) {
      setError(e.message);
      setResult(null);
    }
  };

  const update = (k, v) => setVals((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5">
        <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-3">
          <TriangleIcon className="w-4 h-4" /> Triangle Solver
        </div>
        <p className="text-xs text-slate-400 mb-3">Enter any 3 known values (sides a,b,c or angles A,B,C in degrees).</p>
        <div className="grid grid-cols-3 gap-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-slate-400">{f.label}</label>
              <input
                value={vals[f.key] ?? ''}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder="—"
                inputMode="decimal"
                className="w-full mt-1 bg-slate-800 text-white rounded-lg px-2 py-2 text-sm font-mono outline-none focus:ring-1 ring-indigo-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSolve}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-500 hover:to-indigo-500 transition"
        >
          Solve Triangle
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-900/30 border border-rose-700/50 p-4 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.solutions.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 p-4"
            >
              <div className="text-slate-300 text-sm mb-2">
                {result.solutions.length > 1 ? `Solution ${i + 1}` : 'Solution'}
              </div>
              <div className="grid grid-cols-3 gap-2 text-white font-mono text-sm">
                <div>a = {formatResult(s.a)}</div>
                <div>b = {formatResult(s.b)}</div>
                <div>c = {formatResult(s.c)}</div>
                <div>A = {formatResult(s.A)}°</div>
                <div>B = {formatResult(s.B)}°</div>
                <div>C = {formatResult(s.C)}°</div>
              </div>
              <div className="text-indigo-200 font-mono text-sm mt-2">Area = {formatResult(s.area)}</div>
            </div>
          ))}
          <StepsList steps={result.steps} title="How it was solved" />
        </>
      )}
    </div>
  );
}
