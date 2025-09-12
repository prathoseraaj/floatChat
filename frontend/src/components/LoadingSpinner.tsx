import React from 'react';
import { Bot, Brain } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex gap-4 animate-slide-up">
      {/* AI Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg">
          <Bot size={18} />
        </div>
      </div>

      {/* Loading Content */}
      <div className="flex-1">
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
          FloatChat AI is thinking...
        </div>
        
        <div className="relative px-4 py-3 rounded-2xl rounded-bl-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 shadow-md">
          {/* Typing Animation */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
              <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }} />
              <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }} />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Brain size={12} className="animate-spin" />
              <span>Analyzing ocean data...</span>
            </div>
          </div>

          {/* Message Tail */}
          <div className="absolute bottom-0 left-0 -translate-x-1 border-r-[8px] border-r-white/80 dark:border-r-slate-800/80 border-t-[8px] border-t-transparent" />
        </div>

        {/* Processing Indicators */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/30 opacity-70">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-700 dark:text-blue-300">Processing query...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;