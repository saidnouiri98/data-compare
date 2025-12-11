import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-3 h-3 text-amber-500" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <Info className="w-3 h-3 text-blue-400" />;
    }
  };

  const getColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-amber-300';
      case 'error': return 'text-red-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b] rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-[#0f172a] border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">System Log</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 scrollbar-thin">
        {logs.length === 0 && (
          <div className="text-slate-500 italic">Ready for input...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-slate-600 shrink-0 select-none">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
            <div className="mt-0.5 shrink-0">{getIcon(log.level)}</div>
            <span className={`${getColor(log.level)} break-all`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
