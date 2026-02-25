import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Image as ImageIcon, Brain, Loader2 } from 'lucide-react';
import { generateCoachResponse, analyzeImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AICoach: React.FC<{ context: string }> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Welcome to the Forge. I'm NGrow. I'm here to build you into something better. Don't expect me to be nice. Ready to stop being average?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          data: (reader.result as string).split(',')[1],
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg || "Analyzing image..." }]);
    setIsLoading(true);

    let response;
    if (selectedImage) {
      response = await analyzeImage(userMsg || "What do you think of this?", selectedImage.data, selectedImage.type, context);
      setSelectedImage(null);
    } else {
      response = await generateCoachResponse(userMsg, context, useThinking);
    }
    
    setMessages(prev => [...prev, { role: 'assistant', content: response || "Something went wrong. Keep grinding." }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] glass-card overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-brand-primary/10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-primary" />
          <h3 className="font-bold text-brand-primary uppercase tracking-wider">NGrow AI Coach</h3>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setUseThinking(!useThinking)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
              useThinking ? "bg-brand-primary text-brand-dark" : "bg-white/5 text-gray-400"
            )}
          >
            <Brain className="w-3 h-3" />
            THINKING MODE
          </button>
          <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-white/10" : "bg-brand-primary/20 border border-brand-primary/30"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-brand-primary" />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm",
              msg.role === 'user' 
                ? "bg-white/10 text-white rounded-tr-none" 
                : "bg-brand-surface border border-white/5 text-gray-200 rounded-tl-none"
            )}>
              <div className="markdown-body">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="p-3 bg-brand-surface border border-white/5 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-brand-dark/50 space-y-3">
        {selectedImage && (
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10">
              <img src={`data:${selectedImage.type};base64,${selectedImage.data}`} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-gray-400">Image attached</span>
            <button onClick={() => setSelectedImage(null)} className="ml-auto p-1 hover:text-red-500">
              <Sparkles className="w-4 h-4 rotate-45" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask NGrow anything..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-brand-primary text-brand-dark p-2 rounded-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
