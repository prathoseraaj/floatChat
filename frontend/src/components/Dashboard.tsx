import React, { useState } from 'react';
import { BarChart3, MapPin, Code, Eye, EyeOff } from 'lucide-react';

// Import your REAL components
import ChartDisplay from './ChartDisplay';
import LocationDisplay from './LocationDisplay';

// Import your types
import { PlotlyJson, LocationData } from '@/types/api';

interface DashboardProps {
  plotlyJson: PlotlyJson | null;
  sqlQuery: string | null;
  locations: LocationData[] | null;
}

// You can keep this as a sub-component or move it to its own file
const SqlQueryDisplay = ({ sqlQuery, isVisible, onToggle }) => {
  if (!sqlQuery) return null;

  return (
    <div className="bg-card rounded-lg border border-border shadow-lg">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Code className="text-primary" size={20} />
          <span className="font-semibold text-foreground">Generated SQL Query</span>
        </div>
        {isVisible ? <EyeOff size={20} className="text-muted-foreground" /> : <Eye size={20} className="text-muted-foreground" />}
      </div>
      {isVisible && (
        <div className="px-4 pb-4">
          <pre className="bg-muted/50 p-3 rounded-md text-sm overflow-x-auto border">
            <code className="text-foreground">{sqlQuery}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

// This is your final Dashboard component
const Dashboard: React.FC<DashboardProps> = ({ plotlyJson, sqlQuery, locations }) => {
  const [activeView, setActiveView] = useState<'chart' | 'map'>('chart');
  const [showSqlQuery, setShowSqlQuery] = useState(false);

  // Logic to decide if the map toggle should be shown.
  // This is true if the `locations` array has data.
  const shouldShowMapToggle = locations && locations.length > 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header with Title and Toggle Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Data Dashboard</h2>
        
        {/* Conditionally render the toggle switch */}
        {shouldShowMapToggle && (
          <div className="flex bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <button
              onClick={() => setActiveView('chart')}
              className={`px-4 py-2 flex items-center gap-2 transition-colors text-sm font-medium ${
                activeView === 'chart'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <BarChart3 size={16} />
              Chart View
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`px-4 py-2 flex items-center gap-2 transition-colors text-sm font-medium ${
                activeView === 'map'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <MapPin size={16} />
              Map View
            </button>
          </div>
        )}
      </div>

      {/* Main Visualization Area (toggles between chart and map) */}
      <div className="flex-1 min-h-0">
        {activeView === 'chart' ? (
          <ChartDisplay plotlyJson={plotlyJson} />
        ) : (
          <LocationDisplay locations={locations} />
        )}
      </div>

      {/* SQL Query Section */}
      <SqlQueryDisplay
        sqlQuery={sqlQuery}
        isVisible={showSqlQuery}
        onToggle={() => setShowSqlQuery(!showSqlQuery)}
      />
    </div>
  );
};

export default Dashboard;