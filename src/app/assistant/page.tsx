'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'I need something for a wedding',
  "I'm going to Cape Town",
  'I want business casual',
  'I need winter clothes',
  'I want to impress my girlfriend',
  'I need clothes for Johannesburg winter',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Hi! I'm your Pangolin fashion assistant. Tell me the occasion or vibe you're going for, and I'll recommend the perfect outfit." },
  ]);
  const [input, setInput] = useState('');

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: 'user', text },
      { role: 'assistant', text: "Great choice! I'm connecting to OpenRouter for personalized recommendations. This feature launches in Phase 2 — for now, browse our shop or book a tailoring appointment." },
    ]);
    setInput('');
  }

  return (
    <div className="pt-24 pb-16">
      <div className="section-padding max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Sparkles className="text-vbrown-gold mx-auto mb-3" size={32} />
          <h1 className="font-display text-3xl">AI Fashion Assistant</h1>
        </div>

        <div className="glass rounded-2xl overflow-hidden flex flex-col h-[60vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'bg-vbrown-gold text-vbrown-black' : 'bg-white/10'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full glass hover:border-vbrown-gold/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about fashion..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 focus:border-vbrown-gold outline-none text-sm"
              />
              <button type="submit" className="btn-primary !px-4 !py-3">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
