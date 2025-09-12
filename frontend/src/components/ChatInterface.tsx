import React, { useState, useRef, useEffect } from 'react';
import { Send, Waves, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Message from './Message';
import LoadingSpinner from './LoadingSpinner';
import StatusIndicator from './StatusIndicator';
import { Message as MessageType } from '@/types/api';

interface ChatInterfaceProps {
  messages: MessageType[];
  isLoading: boolean;
  onSendMessage: (query: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage }) => {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const quickPrompts = [
    "Show me temperature vs depth for platform 1902670",
    "Salinity data from January 2024 to March 2024", 
    "Latest 50 pressure measurements with temperature",
    "Compare salinity between two specific platforms"
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Modern Header with Glassmorphism */}
      <div className="relative p-6 border-b border-white/10 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Waves className="text-blue-500 animate-float" size={28} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                FloatChat
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Sparkles size={12} />
                AI-powered Indian Ocean data insights
              </p>
            </div>
          </div>
          <StatusIndicator isConnected={true} isProcessing={isLoading} />
        </div>
      </div>

      {/* Messages Area with Enhanced Styling */}
      <ScrollArea className="flex-1 px-4 py-2" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <MessageSquare className="text-white" size={32} />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-bounce" />
              </div>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Welcome to FloatChat!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                Explore Indian Ocean data with specific time periods, depth levels, platform IDs, and compare temperature/salinity measurements.
              </p>
              
              {/* Quick Prompt Buttons */}
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm mb-4">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(prompt)}
                    className="text-sm text-left p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-white/20 dark:border-slate-600/30 transition-all duration-200 hover:scale-105"
                  >
                    <span className="text-blue-600 dark:text-blue-400">💡</span> {prompt}
                  </button>
                ))}
              </div>
              
              {/* Helpful guidance */}
              <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-3">
                <p className="text-center">💡 <strong>Tip:</strong> Be specific with dates, platforms, or limit records for better graphs</p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && <LoadingSpinner />}
        </div>
      </ScrollArea>

      {/* Enhanced Input Form */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-white/10 backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5 rounded-2xl" />
          <div className="relative flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about specific time periods, platforms, or depth levels..."
                disabled={isLoading}
                className="w-full h-12 px-4 pr-12 bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-600/30 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:text-slate-500"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              size="icon"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;