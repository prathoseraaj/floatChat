import React from 'react';
import { Message as MessageType } from '@/types/api';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.type === 'user';

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg animate-slide-up ${
        isUser 
          ? 'bg-chat-user/10 border border-chat-user/20' 
          : 'bg-chat-ai/10 border border-chat-ai/20'
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-ocean text-primary-foreground' 
            : 'bg-gradient-sunset text-primary-foreground'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground/80">
          {isUser ? 'You' : 'FloatChat AI'}
        </p>
        <p className="text-foreground whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.plotlyJson && (
          <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/10">
            <p className="text-xs text-primary font-medium">📊 Visualization generated</p>
          </div>
        )}
        {!isUser && message.sqlQuery && (
          <div className="mt-2 p-2 bg-muted/50 rounded border border-border">
            <p className="text-xs text-muted-foreground font-medium">🔍 SQL query executed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;