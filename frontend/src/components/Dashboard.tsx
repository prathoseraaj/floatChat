import React, { useState } from 'react';
import { Code, Eye, EyeOff, Activity, TrendingUp } from 'lucide-react';

// Import your REAL components
import ChartDisplay from './ChartDisplay';

// Import your types
import { PlotlyJson } from '@/types/api';

interface DashboardProps {
  plotlyJson: PlotlyJson | null;
  sqlQuery: string | null;
}

// Enhanced SQL Query Display Component
const SqlQueryDisplay = ({ sqlQuery, isVisible, onToggle }) => {
  if (!sqlQuery) return null;

  return (
    <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/30 dark:border-slate-600/30 shadow-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Code className="text-white" size={16} />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Generated SQL Query</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">
            SQL
          </div>
          {isVisible ? <EyeOff size={16} className="text-slate-500" /> : <Eye size={16} className="text-slate-500" />}
        </div>
      </div>
      {isVisible && (
        <div className="px-4 pb-4 max-h-48 overflow-y-auto">
          <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono">
              <code>{sqlQuery}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ plotlyJson, sqlQuery }) => {
  const [showSqlQuery, setShowSqlQuery] = useState(false);

  const hasData = plotlyJson;

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Modern Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Indian Ocean Data Dashboard
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real-time Indian Ocean analytics and insights
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area - Chart and SQL */}
      <div className="flex-1 flex flex-col min-h-0 gap-4">
        {/* Chart Visualization Area - Fixed Height */}
        <div className="flex-1 min-h-0">
          {hasData ? (
            <div className="h-full backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/30 dark:border-slate-600/30 shadow-lg overflow-hidden">
              <ChartDisplay plotlyJson={plotlyJson} />
            </div>
          ) : (
            // Empty State
            <div className="h-full flex items-center justify-center backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/30 dark:border-slate-600/30 shadow-lg">
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  No Data Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                  Start a conversation to see beautiful visualizations and insights from your Indian Ocean data queries.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SQL Query Section - Only expands when needed */}
        <div className="flex-shrink-0">
          <SqlQueryDisplay
            sqlQuery={sqlQuery}
            isVisible={showSqlQuery}
            onToggle={() => setShowSqlQuery(!showSqlQuery)}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;