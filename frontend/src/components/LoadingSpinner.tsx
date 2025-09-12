import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative">
        {/* Ocean wave animation */}
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-full bg-primary animate-wave" style={{ animationDelay: '0ms' }} />
          <div className="h-3 w-3 rounded-full bg-primary animate-wave" style={{ animationDelay: '150ms' }} />
          <div className="h-3 w-3 rounded-full bg-primary animate-wave" style={{ animationDelay: '300ms' }} />
        </div>
        <div className="mt-2 text-sm text-muted-foreground animate-pulse">
          Thinking...
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;