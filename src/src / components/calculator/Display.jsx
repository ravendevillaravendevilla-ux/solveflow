import React from 'react';

export default function Display({ expression, result, preview, error }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 min-h-[150px] flex flex-col justify-end shadow-inner">
      <div className="text-slate-400 text-right text-lg break-all min-h-[28px] font-mono">
        {expression || '0'}
      </div>
      <div className="text-right text-4xl font-semibold text-white break-all mt-2 min-h-[48px]">
        {error ? (
          <span className="text-rose-400 text-xl font-medium">{error}</span>
        ) : result !== null ? (
          result
        ) : preview ? (
          <span className="text-slate-300">{preview}</span>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}
