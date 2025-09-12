import React from 'react';
import Plot from 'react-plotly.js';
import { PlotlyJson } from '@/types/api';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';

interface ChartDisplayProps {
  plotlyJson: PlotlyJson | null;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ plotlyJson }) => {
  if (!plotlyJson) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 animate-fade-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="text-slate-500 dark:text-slate-400" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Zap className="text-white" size={12} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Ready for Visualization
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md">
            Your interactive charts and graphs will appear here when you submit a query.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-blue-600 dark:text-blue-400">
            <TrendingUp size={16} />
            <span>Interactive • Responsive • Real-time</span>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced layout with modern styling
  const enhancedLayout = {
    ...plotlyJson.layout,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'rgba(255,255,255,0.1)',
    font: {
      family: '"Inter", "system-ui", sans-serif',
      size: 12,
      color: 'rgb(71, 85, 105)',
      ...plotlyJson.layout?.font,
    },
    margin: {
      t: 40,
      r: 20,
      b: 40,
      l: 50,
      ...plotlyJson.layout?.margin,
    },
    hoverlabel: {
      bgcolor: 'rgba(59, 130, 246, 0.9)',
      bordercolor: 'rgba(59, 130, 246, 1)',
      font: { color: 'white', size: 12 },
      ...plotlyJson.layout?.hoverlabel,
    },
    colorway: [
      '#3B82F6', // Blue
      '#06B6D4', // Cyan
      '#10B981', // Emerald
      '#8B5CF6', // Purple
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#6366F1', // Indigo
    ],
    xaxis: {
      gridcolor: 'rgba(203, 213, 225, 0.3)',
      zerolinecolor: 'rgba(203, 213, 225, 0.5)',
      ...plotlyJson.layout?.xaxis,
    },
    yaxis: {
      gridcolor: 'rgba(203, 213, 225, 0.3)',
      zerolinecolor: 'rgba(203, 213, 225, 0.5)',
      ...plotlyJson.layout?.yaxis,
    },
  };

  return (
    <div className="h-full p-4 animate-fade-in">
      <div className="h-full bg-white/50 dark:bg-slate-900/50 rounded-lg backdrop-blur-sm border border-white/20 dark:border-slate-700/30 shadow-lg overflow-hidden">
        <Plot
          data={plotlyJson.data}
          layout={enhancedLayout}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
            modeBarButtonsToAdd: [],
            toImageButtonOptions: {
              format: 'png',
              filename: 'floatchat_visualization',
              height: 600,
              width: 800,
              scale: 1
            }
          }}
          useResizeHandler
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default ChartDisplay;