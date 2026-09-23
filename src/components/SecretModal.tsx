import React, { useState, useEffect, useRef } from 'react';
import { Terminal, AlertTriangle, ArrowRight } from 'lucide-react';

interface SecretModalProps {
  isOpen: boolean;
  onClose: (enteredValue: string) => void;
}

export const SecretModal: React.FC<SecretModalProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose(inputValue);
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose(inputValue);
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-slate-950 border border-red-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 font-mono">
        <div className="flex items-center gap-2 mb-3 text-red-400">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">System Alert</span>
        </div>

        <p className="text-sm md:text-base font-semibold text-red-300 mb-5">
          error: type anything to go back.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="type here..."
              className="w-full bg-slate-900 text-amber-300 placeholder-slate-600 text-sm font-bold py-3 pl-4 pr-10 rounded-xl border border-slate-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Submit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
