import React, { useState } from 'react';
import EquationSolver from './EquationSolver';
import SystemSolver from './SystemSolver';
import TriangleSolver from './TriangleSolver';
import Grapher from './Grapher';
import { Sigma, Network, Triangle, LineChart } from 'lucide-react';

const TABS = [
  { id: 'equation', label: 'Equation', icon: Sigma },
  { id: 'system', label: 'System', icon: Network },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'graph', label: 'Graph', icon: LineChart },
];

export default function SolverPanel() {
  const [tab, setTab] = useState('equation');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/70 backdrop-blur rounded-2xl shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition ${
                active
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'equation' && <EquationSolver />}
      {tab === 'system' && <SystemSolver />}
      {tab === 'triangle' && <TriangleSolver />}
      {tab === 'graph' && <Grapher />}
    </div>
  );
}
