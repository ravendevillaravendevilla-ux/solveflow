import React from 'react';
import { ScrollText } from 'lucide-react';

export default function StepsList({ steps, title = 'Step-by-step' }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-700/50 p-4">
      <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-3">
        <ScrollText className="w-4 h-4" />
        {title}
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => {
          const lines = Array.isArray(step) ? step : [step];
          return (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-semibold">
                {i + 1}
              </span>
              <div className="text-slate-200 font-mono break-all leading-6 space-y-0.5">
                {lines.map((line, li) => (
                  <div key={li} className={li > 0 ? 'pl-2 text-slate-300' : ''}>
                    {line}
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
