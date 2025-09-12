import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SQLQueryDisplayProps {
  sqlQuery: string | null;
}

const SQLQueryDisplay: React.FC<SQLQueryDisplayProps> = ({ sqlQuery }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (sqlQuery) {
      navigator.clipboard.writeText(sqlQuery);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!sqlQuery) {
    return null;
  }

  return (
    <div className="bg-code-bg rounded-lg border border-border shadow-lg overflow-hidden animate-slide-up">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-code-bg hover:bg-code-bg/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Code2 className="text-code-text" size={18} />
          <span className="text-sm font-medium text-code-text">Generated SQL Query</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="text-code-text hover:text-primary-foreground hover:bg-primary/20"
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
          {isExpanded ? (
            <ChevronUp className="text-code-text" size={18} />
          ) : (
            <ChevronDown className="text-code-text" size={18} />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t border-border/30">
          <pre className="text-xs text-code-text font-mono whitespace-pre-wrap break-all">
            {sqlQuery}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SQLQueryDisplay;