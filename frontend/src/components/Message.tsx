import React from 'react';
import { Message as MessageType } from '@/types/api';
import { User, Bot, Database, BarChart3, Check } from 'lucide-react';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex gap-4 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' 
              : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
          }`}
        >
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Message Header */}
        <div className={`text-xs text-slate-600 dark:text-slate-400 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {isUser ? 'You' : 'FloatChat AI'}
          <span className="ml-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-md backdrop-blur-sm border transition-all duration-200 hover:shadow-lg ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-blue-300/30 rounded-br-md'
              : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-white/30 dark:border-slate-600/30 rounded-bl-md'
          }`}
        >
          {/* Message Text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

          {/* Message Tail */}
          <div
            className={`absolute bottom-0 w-0 h-0 ${
              isUser
                ? 'right-0 translate-x-1 border-l-[8px] border-l-blue-500 border-t-[8px] border-t-transparent'
                : 'left-0 -translate-x-1 border-r-[8px] border-r-white/80 dark:border-r-slate-800/80 border-t-[8px] border-t-transparent'
            }`}
          />
        </div>

        {/* AI Response Indicators */}
        {!isUser && (
          <div className="mt-3 space-y-2">
            {message.plotlyJson && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/30">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <BarChart3 size={12} className="text-white" />
                </div>
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  Visualization generated
                </span>
                <Check size={12} className="text-emerald-600 dark:text-emerald-400 ml-auto" />
              </div>
            )}
            
            {message.sqlQuery && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/30">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Database size={12} className="text-white" />
                </div>
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Database query executed
                </span>
                <Check size={12} className="text-blue-600 dark:text-blue-400 ml-auto" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;