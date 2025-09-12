import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Dashboard from '@/components/Dashboard';
import { Message, PlotlyJson } from '@/types/api';
import { sendChatQuery } from '@/api/chatApi';
import { useToast } from '@/hooks/use-toast';

const Index: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlotlyJson, setCurrentPlotlyJson] = useState<PlotlyJson | null>(null);
  const [currentSqlQuery, setCurrentSqlQuery] = useState<string | null>(null);
  const { toast } = useToast();

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
        <Dashboard plotlyJson={currentPlotlyJson} sqlQuery={currentSqlQuery} />
      </div>
    </div>
  );
};

export default Index;