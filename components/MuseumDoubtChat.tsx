'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Museum, MuseumWithDistance } from '@/lib/museums';
import {
  Sparkles,
  Clock,
  Ticket,
  Landmark,
  CheckCircle2,
  MapPin,
  Send,
  RefreshCw,
  AlertCircle,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isFallback?: boolean;
}

export interface MuseumDoubtChatProps {
  museum: Museum | MuseumWithDistance;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const PRESET_DOUBT_CHIPS = [
  {
    id: 'timings',
    label: '🕒 Timings & Holidays',
    icon: Clock,
    prompt: 'What are the visiting hours, schedule, and weekly closed days for this museum?',
  },
  {
    id: 'fees',
    label: '🎟️ Ticket Prices',
    icon: Ticket,
    prompt: 'How much are entry tickets for domestic and international visitors, and is entry free?',
  },
  {
    id: 'highlights',
    label: '✨ Collection Highlights',
    icon: Sparkles,
    prompt: 'What are the key collection highlights and most famous artifacts preserved here?',
  },
  {
    id: 'accessibility',
    label: '♿ Accessibility Facilities',
    icon: CheckCircle2,
    prompt: 'What accessibility features, wheelchairs, ramps, or tactile guides are provided?',
  },
  {
    id: 'contact',
    label: '📍 Address & Contact',
    icon: MapPin,
    prompt: 'What is the exact postal address, PIN code, and contact information for visiting?',
  },
];

export function MuseumDoubtChat({
  museum,
  isOpen: controlledIsOpen,
  onToggle,
  className = '',
}: MuseumDoubtChatProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const initialGreeting: ChatMessage = {
    id: 'greeting',
    role: 'assistant',
    content: `Namaste! I am your AI Docent for ${museum.name}. Ask me any question regarding visiting hours, entry fees, key artifacts, or accessibility facilities.`,
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isExpanded]);

  // Focus input when opened
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const messageIdCounterRef = useRef(1);

  const submitQuestion = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setLastPrompt(trimmed);

    messageIdCounterRef.current += 1;
    const currentMsgCount = messageIdCounterRef.current;

    const userMessage: ChatMessage = {
      id: `user-${currentMsgCount}`,
      role: 'user',
      content: trimmed,
      timestamp: 'Sent',
    };

    // Append user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history excluding greeting
      const chatHistory = updatedMessages
        .filter((m) => m.id !== 'greeting')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/museum-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          museumId: museum.id,
          question: trimmed,
          message: trimmed,
          messages: chatHistory.slice(0, -1),
          chatHistory: chatHistory.slice(0, -1),
          museumContext: museum,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned error (${res.status})`);
      }

      const data = await res.json();
      messageIdCounterRef.current += 1;
      const replyMsgCount = messageIdCounterRef.current;

      const assistantMessage: ChatMessage = {
        id: `assistant-${replyMsgCount}`,
        role: 'assistant',
        content: data.reply || 'Thank you for your question.',
        timestamp: 'Delivered',
        isFallback: data.status === 'fallback',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to get answer from museum chat:', err);
      setError(err?.message || 'Unable to connect to AI Docent service. Click retry to try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    submitQuestion(prompt);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    submitQuestion(inputText);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lastPrompt) {
      submitQuestion(lastPrompt);
    }
  };

  if (!isExpanded && controlledIsOpen !== undefined) {
    return null;
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full transition-all duration-200 ${className}`}
    >
      {/* Standalone toggle button rendered only when uncontrolled */}
      {controlledIsOpen === undefined && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-controls={`doubt-drawer-${museum.id}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[36px] ${
              isExpanded
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'bg-[var(--accent-soft)]/40 text-[var(--accent)] hover:bg-[var(--accent-soft)]/70 border border-[var(--accent)]/30'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isExpanded ? 'animate-pulse' : ''}`} />
            <span>{isExpanded ? 'Hide AI Doubt Box' : 'Ask Doubt (AI Docent)'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-80" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            )}
          </button>
        </div>
      )}

      {/* Expandable Doubt Chat Drawer */}
      {isExpanded && (
        <div
          id={`doubt-drawer-${museum.id}`}
          className="mt-3 pt-3 border-t border-[var(--rule)]/70 space-y-3 animate-in fade-in duration-200"
        >
          {/* Preset Quick-Doubt Prompt Chips */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] px-0.5">
              Suggested Heritage Questions
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {PRESET_DOUBT_CHIPS.map((chip) => {
                const IconComponent = chip.icon;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={isLoading}
                    onClick={(e) => handleChipClick(e, chip.prompt)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-[var(--paper-raised)] hover:bg-[var(--paper)] text-[var(--ink)] border border-[var(--rule)] hover:border-[var(--accent)]/60 hover:text-[var(--accent)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <IconComponent className="w-3 h-3 text-[var(--accent)]" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-turn Chat Message Stream */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-[var(--paper)]/70 border border-[var(--rule)]/70 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl shadow-2xs max-w-[88%] leading-relaxed ${
                      isUser
                        ? 'bg-[var(--accent)] text-white rounded-tr-xs'
                        : 'bg-[var(--paper-raised)] text-[var(--ink)] border border-[var(--rule)] rounded-tl-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                          Museum AI Docent
                        </span>
                        {msg.isFallback && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--paper)] text-[var(--ink-muted)] border border-[var(--rule)]">
                            Offline Archives
                          </span>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.timestamp && (
                      <div
                        className={`text-[9px] mt-1 text-right ${
                          isUser ? 'text-white/70' : 'text-[var(--ink-muted)]'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-[var(--ink)]/10 border border-[var(--rule)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-[var(--ink)]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Pulse */}
            {isLoading && (
              <div className="flex items-start gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-xs bg-[var(--paper-raised)] border border-[var(--rule)] shadow-2xs text-[var(--ink-muted)] flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
                  </span>
                  <span className="text-[11px] font-medium">Consulting museum records...</span>
                </div>
              </div>
            )}

            {/* Error Banner with Retry */}
            {error && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-[11px] leading-tight">{error}</span>
                </div>
                {lastPrompt && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* User Input Form */}
          <form onSubmit={handleFormSubmit} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitQuestion(inputText);
                }
              }}
              disabled={isLoading}
              placeholder={`Ask a doubt about ${museum.name}...`}
              className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-[var(--paper-raised)] text-[var(--ink)] border border-[var(--rule)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="absolute right-1.5 p-1.5 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 disabled:opacity-40 disabled:hover:bg-[var(--accent)] transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Send question"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default MuseumDoubtChat;
