import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Dashboard from '@/components/Dashboard';
import { Message, PlotlyJson } from '@/types/api';
import { sendChatQuery } from '@/api/chatApi';
import { useToast } from '@/hooks/use-toast';


// Define LocationData interface
interface LocationData {
  lat: number;
  lon: number;
  label?: string;
}

const Index: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlotlyJson, setCurrentPlotlyJson] = useState<PlotlyJson | null>(null);
  const [currentSqlQuery, setCurrentSqlQuery] = useState<string | null>(null);
  const [currentLocations, setCurrentLocations] = useState<LocationData[] | null>(null);
  const { toast } = useToast();

  const extractLocationsFromResponse = (response: any): LocationData[] | null => {
    // First, check if locations were explicitly provided in the response
    if (response.locations && response.locations.length > 0) {
      return response.locations;
    }

    // Then, check if it's a mapbox plot with lat/lon data
    if (response.plotly_json?.data?.[0]?.type === 'scattermapbox') {
      const plotData = response.plotly_json.data[0];
      if (plotData.lat && plotData.lon) {
        return plotData.lat.map((lat: number, idx: number) => ({
          lat,
          lon: plotData.lon[idx],
          label: `Point ${idx + 1}`
        }));
      }
    }

    return null;
  };

  const handleSendMessage = async (query: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send query to backend
      const response = await sendChatQuery(query);

      // Extract location data
      const locations = extractLocationsFromResponse(response);

      // Add AI response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.insights,
        timestamp: new Date(),
        plotlyJson: response.plotly_json,
        sqlQuery: response.sql_query,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update dashboard
      if (response.plotly_json) {
        setCurrentPlotlyJson(response.plotly_json);
      }
      setCurrentSqlQuery(response.sql_query);
      setCurrentLocations(locations);

    } catch (error) {
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Add error message to chat
      const errorAiMessage: Message = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: `I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-wave">
      {/* Left Column - Chat Interface (40%) */}
      <div className="w-2/5 p-4">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Right Column - Dashboard (60%) */}
      <div className="w-3/5 p-4">
        <Dashboard 
          plotlyJson={currentPlotlyJson} 
          sqlQuery={currentSqlQuery ?? ''} 
          locations={currentLocations ?? []}
        />
      </div>
    </div>
  );
};

export default Index;