import React from 'react';
import Plot from 'react-plotly.js';
import { PlotlyJson } from '@/types/api';
import { BarChart3 } from 'lucide-react';

interface ChartDisplayProps {
  plotlyJson: PlotlyJson | null;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ plotlyJson }) => {
  if (!plotlyJson) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-wave rounded-lg border border-border shadow-inner">
        <div className="text-center p-8 animate-fade-in">
          <BarChart3 className="mx-auto mb-4 text-primary/20" size={64} />
          <p className="text-lg font-medium text-muted-foreground">
            Your visualization will appear here
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Submit a query to generate interactive charts
          </p>
        </div>
      </div>
    );
  }

  // Enhance the layout with ocean theme if not already styled
  const enhancedLayout = {
    ...plotlyJson.layout,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      color: 'hsl(200 95% 8%)',
      ...plotlyJson.layout?.font,
    },
    margin: {
      t: 40,
      r: 20,
      b: 40,
      l: 40,
      ...plotlyJson.layout?.margin,
    },
    hoverlabel: {
      bgcolor: 'hsl(195 82% 46%)',
      font: { color: 'white' },
      ...plotlyJson.layout?.hoverlabel,
    },
  };

  return (
    <div className="h-full bg-card rounded-lg border border-border shadow-lg p-4 animate-fade-in">
      <Plot
        data={plotlyJson.data}
        layout={enhancedLayout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default ChartDisplay;