import React, { useState } from 'react';
import { solveEquation, formatResult } from '@/lib/mathEngine';
import StepsList from './StepsList';
import { Calculator } from 'lucide-react';

const EXAMPLES = ['2x + 5 = 11', 'x^2 - 5x + 6 = 0', '3x - 7 = 14', 'x^2 + 4 = 0', '5x = 25'];

export default function EquationSolver() {
  const [equation, setEquation] = useState('x^2 - 5x + 6 = 0');
  const [solution, setSolution] = useState(null);
  const [error, setError] = useState(null);

  const handleSolve = () => {
    try {
      const sol = solveEquation(equation);
      setSolution(sol);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not solve');
      setSolution(null);
    }
  };

  const solutionText = () => {
    if (!solution) return null;
    if (solution.solutions.length === 0) {
      return solution.type === 'identity' ? 'All real numbers' : 'No real solution';
    }
    return solution.solutions.map((s, i) => (
      <span key={i} className="font-mono">
        {solution.solutions.length > 1 ? `x${'₁₂'[i] || i + 1} = ` : 'x = '}
        {formatResult(s)}
      </span>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5">
        <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-3">
          <Calculator className="w-4 h-4" /> Equation Solver
        </div>
        <input
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
          placeholder="e.g. 2x^2 + 3x - 5 = 0"
          className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-lg font-mono outline-none focus:ring-2 ring-indigo-500"
        />
        <button
          onClick={handleSolve}
          className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-500 hover:to-indigo-500 transition"
        >
          Solve
        </button>
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setEquation(ex)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-900/30 border border-rose-700/50 p-4 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {solution && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 p-5">
            <div className="text-slate-300 text-sm mb-2">Solution</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white text-2xl font-semibold">
              {solutionText()}
            </div>
            <div className="text-slate-400 text-xs mt-2 capitalize">{solution.type} equation</div>
          </div>
          <StepsList steps={solution.steps} title="How it was solved" />
        </>
      )}
    </div>
  );
}
