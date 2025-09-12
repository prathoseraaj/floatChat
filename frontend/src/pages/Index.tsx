import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Dashboard from '@/components/Dashboard';
import ThemeToggle from '@/components/ThemeToggle';
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

      // Update dashboard with chart data only
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-950 dark:to-cyan-950">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/25 bg-[size:64px_64px] opacity-30" />
      
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Main container with glassmorphism */}
      <div className="relative flex h-screen backdrop-blur-sm">
        {/* Left Column - Chat Interface (40%) */}
        <div className="w-2/5 p-6 flex flex-col">
          <div className="h-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-blue-500/10">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>

        {/* Right Column - Dashboard (60%) */}
        <div className="w-3/5 p-6 flex flex-col">
          <div className="h-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-blue-500/10">
            <Dashboard 
              plotlyJson={currentPlotlyJson} 
              sqlQuery={currentSqlQuery ?? ''} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;