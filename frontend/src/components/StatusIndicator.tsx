import React from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';

interface StatusIndicatorProps {
  isConnected?: boolean;
  isProcessing?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  isConnected = true, 
  isProcessing = false 
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-600/30 shadow-sm">
      {isProcessing ? (
        <>
          <Activity size={12} className="text-blue-500 animate-pulse" />
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Processing</span>
        </>
      ) : isConnected ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Wifi size={12} className="text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <WifiOff size={12} className="text-red-600 dark:text-red-400" />
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">Disconnected</span>
        </>
      )}
    </div>
  );
};

export default StatusIndicator;
