import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatPanelProps {
  onImageEdit?: (prompt: string) => void;
  isProcessing?: boolean;
}

export default function ChatPanel({ onImageEdit, isProcessing = false }: ChatPanelProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('history.helloMessage'),
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Webhook bağlanacak - şimdilik placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: t('history.aiProcessing'),
      timestamp: Date.now() + 100
    };
    
    setTimeout(() => {
      setMessages(prev => [...prev, assistantMessage]);
    }, 500);

    if (onImageEdit) {
      onImageEdit(input.trim());
    }

    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0C0C0F]">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-[#A97FFF]/10 dark:to-[#7C5DFF]/10 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] rounded-lg shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('chat.title')}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{t('chat.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`
                  max-w-[75%] px-4 py-3 rounded-2xl shadow-sm
                  ${message.role === 'user'
                    ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-[#1A1A22] text-gray-800 dark:text-gray-200 rounded-tl-sm'
                  }
                `}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span className={`text-xs mt-1 block ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-700 dark:text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 bg-[#A97FFF] hover:bg-[#B88FFF] text-white rounded-full shadow-lg transition-all animate-bounce"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-50 dark:bg-[#1A1A22]/50 border-t border-gray-200 dark:border-gray-800">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[t('history.removeBackground'), t('history.improveColors'), t('history.increaseSize'), t('history.professionalEdit')].map((action) => (
            <button
              key={action}
              onClick={() => setInput(action)}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#0C0C0F] hover:bg-purple-50 dark:hover:bg-[#A97FFF]/20 text-gray-700 dark:text-gray-300 hover:text-[#A97FFF] rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-700 disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('history.howToEdit')}
              disabled={isProcessing}
              rows={1}
              className="w-full bg-white dark:bg-[#0C0C0F] text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm placeholder-gray-400 dark:placeholder-gray-500"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-3 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg disabled:shadow-none"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {t('history.enter')}
        </p>
      </div>
    </div>
  );
}






