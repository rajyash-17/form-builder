'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Clue } from '@/lib/schemas';
import { AISuggestion } from '@/server/ai';

export interface DetectiveNotesPanelProps {
  caseId: string;
  onApplyClue?: (cluePartial: Partial<Clue>) => void;
}

export function DetectiveNotesPanel({ caseId, onApplyClue }: DetectiveNotesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[] | null>(null);

  const suggestMutation = trpc.ai.suggestImprovements.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
    },
    onError: (err) => {
      alert(err.message || 'Failed to analyze case file quality.');
    },
  });

  const handleAnalyze = () => {
    setIsOpen(true);
    suggestMutation.mutate({ caseId });
  };

  return (
    <div className="rounded border border-border-color bg-surface paper-grain p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-serif text-sm font-bold text-lamp-amber flex items-center gap-1.5">
            <span>🕵️‍♂️ Detective's Notes</span>
          </h4>
          <p className="font-typewriter text-[11px] text-fog-grey">
            AI structural analysis & optimization advice for this case file.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleAnalyze}
          disabled={suggestMutation.isPending}
        >
          {suggestMutation.isPending ? 'Analyzing File...' : suggestions ? '🔄 Re-Analyze' : '⚡ Inspect Case File'}
        </Button>
      </div>

      {suggestMutation.isPending && (
        <div className="flex items-center gap-2 py-3 font-typewriter text-xs text-lamp-amber animate-pulse">
          <Spinner className="w-4 h-4" />
          <span>Analyzing clue clarity, completion friction, and missing fields...</span>
        </div>
      )}

      {isOpen && suggestions && !suggestMutation.isPending && (
        <div className="space-y-3 pt-2 border-t border-border-color">
          {suggestions.map((sug) => (
            <div
              key={sug.id}
              className="p-3 rounded border border-border-color/70 bg-desk-dark/60 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-serif font-bold text-lamp-amber">{sug.title}</span>
                <span className="font-typewriter text-[10px] text-fog-grey bg-surface px-2 py-0.5 rounded border border-border-color uppercase">
                  {sug.type.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="font-sans text-xs text-primary leading-relaxed">{sug.description}</p>

              {sug.actionableClue && onApplyClue && (
                <div className="pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => sug.actionableClue && onApplyClue(sug.actionableClue)}
                  >
                    ➕ 1-Click Add Suggested Clue
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
