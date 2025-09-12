import React from 'react';
import ChartDisplay from './ChartDisplay';
import SQLQueryDisplay from './SQLQueryDisplay';
import { PlotlyJson } from '@/types/api';

interface DashboardProps {
  plotlyJson: PlotlyJson | null;
  sqlQuery: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ plotlyJson, sqlQuery }) => {
  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-dashboard-bg rounded-lg">
      {/* Chart Display Section */}
      <div className="flex-1 min-h-0">
        <ChartDisplay plotlyJson={plotlyJson} />
      </div>
      
      {/* SQL Query Section */}
      {sqlQuery && (
        <div className="flex-shrink-0">
          <SQLQueryDisplay sqlQuery={sqlQuery} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;