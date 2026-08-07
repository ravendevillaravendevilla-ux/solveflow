import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { evaluateExpression, evaluateWithSteps, formatResult } from '@/lib/mathEngine';
import { getHistory, addToHistory, deleteHistoryItem, clearHistory } from '@/lib/history';
import { useToast } from '@/components/ui/use-toast';
import Display from '@/components/calculator/Display';
import Keypad from '@/components/calculator/Keypad';
import StepsList from '@/components/calculator/StepsList';
import HistoryPanel from '@/components/calculator/HistoryPanel';
import SolverPanel from '@/components/calculator/SolverPanel';
import { History, Sigma, FlaskConical, FunctionSquare } from 'lucide-react';

const MODES = [
  { id: 'basic', label: 'Basic', icon: Sigma },
  { id: 'scientific', label: 'Scientific', icon: FunctionSquare },
  { id: 'solver', label: 'Solver', icon: FlaskConical },
];

export default function Home() {
  const { toast } = useToast();
  const [mode, setMode] = useState('basic');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const preview = useMemo(() => {
    if (!expression) return '';
    try {
      return formatResult(evaluateExpression(expression));
    } catch {
      return '';
    }
  }, [expression]);

  const handlePress = useCallback(
    (action, value) => {
      if (action === 'input') {
        setResult(null);
        setError(null);
        setSteps([]);
        if (justEvaluated) {
          setJustEvaluated(false);
          setExpression(/^[0-9.]$/.test(value) ? value : String(result) + value);
        } else {
          setExpression((prev) => prev + value);
        }
      } else if (action === 'clear') {
        setExpression('');
        setResult(null);
        setError(null);
        setSteps([]);
        setJustEvaluated(false);
      } else if (action === 'back') {
        setJustEvaluated(false);
        setResult(null);
        setError(null);
        setSteps([]);
        setExpression((prev) => prev.slice(0, -1));
      } else if (action === 'equals') {
        if (!expression.trim()) return;
        try {
          const { result: res, steps: st } = evaluateWithSteps(expression);
          const formatted = formatResult(res);
          setResult(formatted);
          setError(null);
          setSteps(st);
          setJustEvaluated(true);
          setHistory(addToHistory({ type: 'calc', expression, result: formatted, steps: st }));
        } catch (e) {
          setError(e.message || 'Error');
          setResult(null);
          setSteps([]);
          setJustEvaluated(false);
        }
      }
    },
    [expression, justEvaluated, result]
  );

  // keyboard support for the calculator
  useEffect(() => {
    const onKey = (e) => {
      if (mode === 'solver') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key;
      if (/^[0-9.]$/.test(k)) handlePress('input', k);
      else if (['+', '-', '*', '/', '%', '^', '(', ')'].includes(k)) handlePress('input', k);
      else if (k === 'Enter' || k === '=') handlePress('equals');
      else if (k === 'Backspace') handlePress('back');
      else if (k === 'Escape') handlePress('clear');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePress, mode]);

  const handleCopy = (item) => {
    const text = `${item.expression} = ${item.result}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast({ title: 'Copied to clipboard' }));
    } else {
      toast({ title: 'Clipboard unavailable' });
    }
  };

  const handleDelete = (id) => setHistory(deleteHistoryItem(id));

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    toast({ title: 'History cleared' });
  };

  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase();
    return q
      ? history.filter(
          (h) =>
            h.expression.toLowerCase().includes(q) ||
            String(h.result).toLowerCase().includes(q)
        )
      : history;
  }, [history, historySearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-violet-100">
      <div className="max-w-md mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Math Solver</h1>
            <p className="text-xs text-slate-500">Offline-first calculator & solver</p>
          </div>
          <button
            onClick={() => setHistoryOpen(true)}
            className="relative p-2.5 rounded-xl bg-white shadow-sm hover:shadow-md transition text-slate-600"
          >
            <History className="w-5 h-5" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>
        </header>

        <div className="grid grid-cols-3 gap-1 p-1 bg-white/70 backdrop-blur rounded-2xl shadow-sm mb-5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4" /> {m.label}
              </button>
            );
          })}
        </div>

        {mode === 'solver' ? (
          <SolverPanel />
        ) : (
          <div className="space-y-4">
            <Display
              expression={expression}
              result={result}
              preview={preview}
              error={error}
            />
            {steps.length > 0 && <StepsList steps={steps} />}
            <Keypad mode={mode} onPress={handlePress} />
          </div>
        )}
      </div>

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        items={filteredHistory}
        search={historySearch}
        onSearch={setHistorySearch}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onClear={handleClear}
      />
    </div>
  );
}
