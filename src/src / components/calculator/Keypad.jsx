import React from 'react';
import { cn } from '@/lib/utils';

const numericRows = [
  [{ l: 'C', a: 'clear' }, { l: '⌫', a: 'back' }, { l: '%', a: 'input', v: '%' }, { l: '÷', a: 'input', v: '/', op: true }],
  [{ l: '7', a: 'input', v: '7' }, { l: '8', a: 'input', v: '8' }, { l: '9', a: 'input', v: '9' }, { l: '×', a: 'input', v: '*', op: true }],
  [{ l: '4', a: 'input', v: '4' }, { l: '5', a: 'input', v: '5' }, { l: '6', a: 'input', v: '6' }, { l: '−', a: 'input', v: '-', op: true }],
  [{ l: '1', a: 'input', v: '1' }, { l: '2', a: 'input', v: '2' }, { l: '3', a: 'input', v: '3' }, { l: '+', a: 'input', v: '+', op: true }],
  [{ l: '0', a: 'input', v: '0', span: 2 }, { l: '.', a: 'input', v: '.' }, { l: '=', a: 'equals', accent: true }],
];

const scientificRows = [
  [{ l: 'sin', a: 'input', v: 'sin(' }, { l: 'cos', a: 'input', v: 'cos(' }, { l: 'tan', a: 'input', v: 'tan(' }, { l: 'asin', a: 'input', v: 'asin(' }, { l: 'acos', a: 'input', v: 'acos(' }, { l: 'atan', a: 'input', v: 'atan(' }],
  [{ l: 'log', a: 'input', v: 'log(' }, { l: 'ln', a: 'input', v: 'ln(' }, { l: '√', a: 'input', v: 'sqrt(' }, { l: 'xʸ', a: 'input', v: '^' }, { l: 'x²', a: 'input', v: '^2' }, { l: 'n!', a: 'input', v: '!' }],
  [{ l: '(', a: 'input', v: '(' }, { l: ')', a: 'input', v: ')' }, { l: 'π', a: 'input', v: 'pi' }, { l: 'e', a: 'input', v: 'e' }, { l: 'exp', a: 'input', v: 'exp(' }, { l: '|x|', a: 'input', v: 'abs(' }],
];

function KeyButton({ def, onPress, compact }) {
  const { l, a, v, op, accent, span } = def;
  return (
    <button
      onClick={() => onPress(a, v)}
      className={cn(
        'rounded-2xl font-medium transition-all active:scale-95 select-none flex items-center justify-center',
        compact ? 'h-12 text-sm' : 'h-16 text-lg',
        span === 2 && 'col-span-2',
        accent
          ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:from-violet-500 hover:to-indigo-500'
          : op
            ? 'bg-indigo-600/90 text-white hover:bg-indigo-500'
            : a === 'clear' || a === 'back'
              ? 'bg-rose-900/30 text-rose-200 hover:bg-rose-900/50'
              : 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80'
      )}
    >
      {l}
    </button>
  );
}

export default function Keypad({ mode, onPress }) {
  return (
    <div className="space-y-2">
      {mode === 'scientific' && (
        <div className="space-y-2">
          {scientificRows.map((row, ri) => (
            <div key={`s-${ri}`} className="grid grid-cols-6 gap-2">
              {row.map((def, ci) => (
                <KeyButton key={`s-${ri}-${ci}`} def={def} onPress={onPress} compact />
              ))}
            </div>
          ))}
        </div>
      )}
      {numericRows.map((row, ri) => (
        <div key={`n-${ri}`} className="grid grid-cols-4 gap-2">
          {row.map((def, ci) => (
            <KeyButton key={`n-${ri}-${ci}`} def={def} onPress={onPress} />
          ))}
        </div>
      ))}
    </div>
  );
}
