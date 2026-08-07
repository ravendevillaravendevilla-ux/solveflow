import React from 'react';
import { X, Search, Copy, Trash2, Clock } from 'lucide-react';

export default function HistoryPanel({
  open,
  onClose,
  items,
  search,
  onSearch,
  onCopy,
  onDelete,
  onClear,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-slate-900 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Clock className="w-5 h-5" /> History
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-slate-800 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-center text-slate-500 mt-10 text-sm">No history yet</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-slate-800/60 rounded-xl p-3">
                <div className="text-slate-300 text-sm font-mono break-all">{item.expression}</div>
                <div className="text-white font-semibold font-mono break-all mt-0.5">
                  = {item.result}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500 text-xs">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onCopy(item)}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="p-3 border-t border-slate-700">
            <button
              onClick={onClear}
              className="w-full py-2 rounded-lg bg-rose-900/30 text-rose-300 hover:bg-rose-900/50 text-sm font-medium"
            >
              Clear all history
            </button>
          </div>
        )}
      </div>
    </>
  );
}
