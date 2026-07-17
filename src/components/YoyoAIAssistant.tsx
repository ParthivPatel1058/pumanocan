import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Mic, MicOff, RefreshCw, X, MessageSquare, 
  HelpCircle, Bot, ArrowRight, FileText, Check, AlertCircle 
} from 'lucide-react';
import { FileItem, Folder } from '../types';

interface YoyoAIAssistantProps {
  files: FileItem[];
  folders: Folder[];
  onExecuteCommand: (commandText: string) => void;
  triggerNotification: (msg: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'yoyo';
  text: string;
  timestamp: Date;
  suggestedAction?: {
    label: string;
    command: string;
  };
}

export default function YoyoAIAssistant({
  files,
  folders,
  onExecuteCommand,
  triggerNotification
}: YoyoAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'yoyo',
      text: "Hi! I'm Yoyo, your presentation vault AI. I can search files, summarize contents, read slides with OCR, and organize documents automatically. Try asking me something or click a fast command below!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: 'msg-' + Math.random(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // AI thinking timeout simulation
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "";
      let suggestedAction: Message['suggestedAction'] = undefined;
      const q = text.toLowerCase().trim();

      // Simple natural language routing rules matching user's requested examples
      if (q.includes('find') || q.includes('chemistry') || q.includes('search')) {
        replyText = "I ran an OCR indexed search across all vault documents and matched 'Chemistry Presentation.pptx'. Would you like me to filter the file list for you?";
        suggestedAction = {
          label: "Show Chemistry File",
          command: "find chemistry"
        };
      } else if (q.includes('open') || q.includes('latest')) {
        replyText = "Matched 'Science Project Presentation.pptx' as your latest updated presentation. Would you like me to launch its quick preview deck?";
        suggestedAction = {
          label: "Open Latest Deck",
          command: "open latest"
        };
      } else if (q.includes('download') || q.includes('math')) {
        replyText = "Matched 'Mathematics Final Notes.docx'. Would you like me to compile and trigger an instant download scan for this file?";
        suggestedAction = {
          label: "Download Math Notes",
          command: "download math"
        };
      } else if (q.includes('yesterday') || q.includes('date') || q.includes('time')) {
        replyText = "Scanning file timestamps... Found 2 presentations updated yesterday. Filtering your list now!";
        suggestedAction = {
          label: "Filter Yesterday",
          command: "yesterday"
        };
      } else if (q.includes('organize') || q.includes('auto')) {
        replyText = "Analyzing folders and file properties. I suggest grouping your 3 unassigned PDF files into the 'Annual Reports' folder to save space. Would you like to run the AI Auto-Organizer?";
        suggestedAction = {
          label: "Organize Folders",
          command: "auto organize"
        };
      } else if (q.includes('summary') || q.includes('summarize')) {
        replyText = "To summarize a file, please open 'My Presentations' and click on any presentation file details, then access the 'AI Summary & OCR' section!";
      } else {
        replyText = "I've processed your natural language command. Let me know if you want me to find, open, or organize any files in your vault!";
      }

      const botMsg: Message = {
        id: 'msg-' + Math.random(),
        sender: 'yoyo',
        text: replyText,
        timestamp: new Date(),
        suggestedAction
      };

      setMessages(prev => [...prev, botMsg]);
    }, 1200);
  };

  // Voice recognition simulation
  const startVoiceSearch = () => {
    setIsListening(true);
    triggerNotification("Listening to voice command...");
    
    // Auto complete speech in 3 seconds
    setTimeout(() => {
      setIsListening(false);
      const spokenCommands = [
        "Find Chemistry PPT",
        "Open latest presentation",
        "Download Math Notes",
        "Show files uploaded yesterday"
      ];
      const randomSpoken = spokenCommands[Math.floor(Math.random() * spokenCommands.length)];
      setInput(randomSpoken);
      triggerNotification(`Voice recognized: "${randomSpoken}"`);
    }, 2500);
  };

  const executeAction = (action: { label: string; command: string }) => {
    onExecuteCommand(action.command);
    triggerNotification(`AI executed command: "${action.label}"`);
  };

  const quickChips = [
    { label: "🔍 Find Chemistry PPT", cmd: "find chemistry" },
    { label: "🚀 Open latest presentation", cmd: "open latest" },
    { label: "📥 Download Math Notes", cmd: "download math" },
    { label: "📅 Show files uploaded yesterday", cmd: "yesterday" }
  ];

  return (
    <div className="glass-panel rounded-[28px] border border-white/45 p-5 shadow-xl flex flex-col h-[400px] relative overflow-hidden text-slate-800 dark:text-white">
      {/* Refraction orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-[26px]">
        <div className="absolute w-40 h-40 rounded-full bg-indigo-500/10 blur-[30px] -top-10 -right-10" />
        <div className="absolute w-48 h-48 rounded-full bg-pink-500/5 blur-[40px] -bottom-12 -left-8" />
      </div>

      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="block text-xs font-bold leading-none">Ask Yoyo AI</span>
            <span className="text-[9px] text-slate-400 font-mono">Omni Flash Connected</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1" />
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest font-mono">ONLINE</span>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 scrollbar-thin">
        {messages.map((m) => {
          const isYoyo = m.sender === 'yoyo';
          return (
            <div key={m.id} className={`flex gap-2.5 max-w-[85%] ${isYoyo ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse text-right'}`}>
              {isYoyo && (
                <div className="w-6 h-6 rounded-md bg-white/10 dark:bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                  isYoyo 
                    ? 'bg-white/15 dark:bg-slate-950/20 border-white/20 text-slate-800 dark:text-slate-100' 
                    : 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                }`}>
                  {m.text}
                </div>

                {/* Suggested Action Button (Smart command implementation!) */}
                {isYoyo && m.suggestedAction && (
                  <button
                    onClick={() => executeAction(m.suggestedAction!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold transition-all shadow-sm active:scale-95"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    {m.suggestedAction.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto">
            <div className="w-6 h-6 rounded-md bg-white/10 dark:bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
            </div>
            <div className="p-3 rounded-2xl bg-white/15 dark:bg-slate-950/20 border border-white/20 text-slate-400 text-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
              Yoyo is thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick commands chips list */}
      <div className="py-2 overflow-x-auto shrink-0 flex gap-1.5 scrollbar-none border-t border-white/10 select-none">
        {quickChips.map((c) => (
          <button
            key={c.cmd}
            onClick={() => {
              setInput(c.label.substring(3)); // strip the emoji
              handleSend(c.label.substring(3));
            }}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-200/50 dark:bg-slate-950/30 border border-white/10 hover:bg-white/25 dark:hover:bg-slate-950/50 text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Chat Input form with voice support */}
      <div className="flex gap-2 border-t border-white/10 pt-3 shrink-0">
        <button
          type="button"
          onClick={startVoiceSearch}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isListening 
              ? 'bg-rose-500/30 border-rose-500 animate-pulse text-rose-500' 
              : 'bg-white/10 dark:bg-slate-950/20 border-white/20 text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
          title="Voice Command Search"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type natural command... (e.g. Find chemistry)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            className="w-full bg-white/15 dark:bg-slate-950/20 border border-white/20 rounded-xl pl-3 pr-10 py-2.5 text-xs outline-none focus:border-indigo-400 text-slate-800 dark:text-white"
          />
          <button
            onClick={() => handleSend(input)}
            className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-indigo-400"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
