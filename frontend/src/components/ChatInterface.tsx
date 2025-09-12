import React, { useState, useRef, useEffect } from 'react';
import { Send, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Message from './Message';
import LoadingSpinner from './LoadingSpinner';
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

  return (
    <div className="flex flex-col h-full bg-chat-bg rounded-lg border border-border shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-wave">
        <div className="flex items-center gap-2">
          <Waves className="text-primary animate-float" size={24} />
          <h1 className="text-xl font-bold text-foreground">FloatChat 🌊</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Query oceanographic data using natural language
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground animate-fade-in">
              <Waves className="mx-auto mb-4 text-primary/30" size={48} />
              <p className="text-lg font-medium">Welcome to FloatChat!</p>
              <p className="text-sm mt-2">
                Ask me about ocean data, float trajectories, temperature profiles, and more.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="italic">Try asking:</p>
                <p className="text-primary">"Show me the trajectory of float 1901402"</p>
                <p className="text-primary">"What are the temperature profiles in the Indian Ocean?"</p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && <LoadingSpinner />}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about ocean data..."
            disabled={isLoading}
            className="flex-1 bg-input border-border focus:border-primary"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            variant="ocean"
            size="icon"
            className="shadow-md"
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;