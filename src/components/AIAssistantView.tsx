import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  BookOpen,
  Calendar,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  Copy,
  AlertCircle,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { DbSubject, TopicWithSubject, ExamWithSubject } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIAssistantViewProps {
  userEmail: string;
  userName?: string | null;
  subjects: DbSubject[];
  topics: TopicWithSubject[];
  exams: ExamWithSubject[];
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  userEmail,
  userName,
  subjects,
  topics,
  exams,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: `Hello ${userName || userEmail.split('@')[0]}! 👋 I'm your AI Academic Study Assistant.\n\nI have real-time context on your enrolled courses (${subjects.length} subjects), active topics (${topics.length} topics), and upcoming exams. I can explain complex ideas, design practice quizzes, or build customized revision schedules. How can I help you study today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend ?? inputPrompt).trim();
    if (!message || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) {
      setInputPrompt('');
    }
    setLoading(true);
    setErrorMsg(null);

    // Build context summary from student's current workspace
    const context = {
      user: { name: userName, email: userEmail },
      enrolledSubjects: subjects.map((s) => ({
        name: s.name,
        description: s.description,
      })),
      keyTopics: topics.slice(0, 15).map((t) => ({
        name: t.name,
        subject: t.subjects?.name,
        difficulty: t.difficulty,
        progress: `${t.progress}%`,
      })),
      upcomingExams: exams.map((e) => ({
        title: e.cleanTitle || e.title,
        subject: e.subjects?.name,
        examDate: e.exam_date,
        priority: e.priority,
      })),
    };

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          chatHistory: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get a response from the AI assistant.');
      }

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setErrorMsg(err.message || 'Something went wrong while connecting to the assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      title: 'Plan Tomorrow',
      desc: 'Generate a focused study timetable',
      icon: Calendar,
      color: 'from-blue-500 to-indigo-600',
      prompt: 'Can you generate a balanced 3-hour study plan for tomorrow based on my upcoming exams and topics that need improvement?',
    },
    {
      title: 'Explain Concept',
      desc: 'Step-by-step simple analogies',
      icon: BookOpen,
      color: 'from-violet-500 to-purple-600',
      prompt: 'Pick one of my enrolled subjects and explain the most challenging foundational concept using simple analogies and a mini-quiz.',
    },
    {
      title: 'Active Recall Test',
      desc: '3-question conceptual quiz',
      icon: Lightbulb,
      color: 'from-amber-500 to-orange-600',
      prompt: 'Create a 3-question conceptual practice quiz with multiple-choice questions and detailed explanations based on my course topics.',
    },
    {
      title: 'Exam Strategy',
      desc: 'Spaced repetition revision tip',
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-600',
      prompt: 'What is the most effective active recall and spaced repetition strategy to prepare for my upcoming exams in the next 2 weeks?',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Study Assistant
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-700 border border-indigo-200/80">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Personalized academic tutor and study planner connected directly to your enrolled courses & exams.
          </p>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'welcome-reset',
                role: 'assistant',
                text: `Conversation restarted. How can I help you with your coursework today?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            setErrorMsg(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all self-start cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Cards */}
      {messages.length <= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.prompt)}
                disabled={loading}
                className="text-left p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group disabled:opacity-50 cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center mb-3 shadow-xs transition-transform group-hover:scale-105`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Chat Conversation Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[600px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs ${
                    isAI
                      ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="group relative max-w-[85%]">
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isAI
                        ? 'bg-slate-50/80 text-slate-900 border border-slate-200/70 shadow-2xs'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/15'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Actions & Timestamp */}
                  <div
                    className={`flex items-center gap-2 mt-1.5 px-1 text-[10px] text-slate-400 ${
                      isAI ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isAI && (
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer font-medium"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-2xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>AI assistant is analyzing your coursework and generating insights...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUserMsg) {
                    handleSendMessage(lastUserMsg.text);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 rounded-b-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your courses, request a study schedule, or summarize a topic... (Enter to send)"
              rows={2}
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none shadow-2xs"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2">
            <span>Press Enter to send, Shift + Enter for newline</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Grounds answers in your courses & exams
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
