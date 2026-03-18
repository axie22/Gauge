'use client';

import { useState } from 'react';
import { BalanceResult, PlateauResult, MuscleReadiness } from '@/lib/hevy';
import { ChatInterface } from '@/components/ChatInterface';

interface Props {
  summary: string;
  readiness: MuscleReadiness[];
  plateaus: PlateauResult[];
  balance: BalanceResult;
  nutritionSummary?: string;
  profileSummary?: string | null;
  whoopSummary?: string | null;
}

export function ChatPanel({ summary, readiness, plateaus, balance, nutritionSummary, profileSummary, whoopSummary }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-colors"
        aria-label="Open coach chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed right-0 top-0 z-30 flex h-full w-full flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 md:w-[420px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 shrink-0">
          <div>
            <h3 className="font-semibold text-zinc-100">Ask Your Coach</h3>
            <p className="text-xs text-zinc-500">Powered by Ollama</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ChatInterface
          summary={summary}
          readiness={readiness}
          plateaus={plateaus}
          balance={balance}
          nutritionSummary={nutritionSummary}
          profileSummary={profileSummary}
          whoopSummary={whoopSummary}
        />
      </div>
    </>
  );
}
