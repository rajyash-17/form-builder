'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Stamp } from '@/components/ui/Stamp';
import { Spinner } from '@/components/ui/Spinner';
import { trpc } from '@/lib/trpc/client';
import { Clue } from '@/lib/schemas';

export interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (title: string, description: string, clues: Clue[]) => void;
}

export function AIGeneratorModal({ isOpen, onClose, onAccept }: AIGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedData, setGeneratedData] = useState<{
    title: string;
    description: string;
    clues: Clue[];
    isOfflineFallback?: boolean;
  } | null>(null);

  const generateMutation = trpc.ai.generateForm.useMutation({
    onSuccess: (data) => {
      setGeneratedData(data);
    },
    onError: (err) => {
      alert(err.message || 'Failed to generate case file.');
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGeneratedData(null);
    generateMutation.mutate({ prompt });
  };

  const handleAccept = () => {
    if (!generatedData) return;
    onAccept(generatedData.title, generatedData.description, generatedData.clues);
    onClose();
    setPrompt('');
    setGeneratedData(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🕵️‍♂️ Brief the Detective (AI Case File Generator)">
      <div className="space-y-6">
        {!generatedData ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <p className="font-typewriter text-xs text-fog-grey">
              Provide a plain-language prompt outlining your investigation form requirements. The detective will draft a complete clue structure.
            </p>

            <Textarea
              label="Case Brief Prompt"
              placeholder="e.g. RSVP form for my cousin's wedding with meal choices, plus-one count, and dietary restrictions..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
              autoFocus
            />

            {/* Quick Prompt Presets */}
            <div>
              <label className="block text-[11px] font-typewriter text-fog-grey uppercase mb-1">
                Preset Brief Prompts
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Wedding RSVP with meal choice & plus-one",
                  "Bureau Incident Report with time & evidence attachment",
                  "Customer Service Feedback & satisfaction rating",
                  "Informant Registration & contact details",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPrompt(preset)}
                    className="px-2.5 py-1 rounded bg-desk-dark/60 hover:bg-desk-dark border border-border-color text-fog-grey hover:text-lamp-amber font-typewriter text-[11px] transition-colors text-left"
                  >
                    💡 {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading / Thinking State */}
            {generateMutation.isPending && (
              <div className="p-4 rounded border border-lamp-amber/40 bg-lamp-amber/5 text-center space-y-2">
                <Spinner className="w-6 h-6 mx-auto" />
                <p className="font-typewriter text-xs text-lamp-amber animate-pulse">
                  Detective reviewing bureau archives & drafting clue schema...
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border-color">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={generateMutation.isPending || !prompt.trim()}
              >
                {generateMutation.isPending ? 'Drafting Schema...' : '⚡ Generate Case Schema'}
              </Button>
            </div>
          </form>
        ) : (
          /* Generated Preview View */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-lamp-amber">{generatedData.title}</h3>
                <p className="font-sans text-xs text-fog-grey">{generatedData.description}</p>
              </div>
              <Stamp
                text={generatedData.isOfflineFallback ? 'OFFLINE SCHEMA' : 'AI DRAFT'}
                variant={generatedData.isOfflineFallback ? 'amber' : 'green'}
                rotation="right"
                size="sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-typewriter text-fog-grey uppercase">
                Generated Clues ({generatedData.clues.length} Questions)
              </label>

              <div className="max-h-60 overflow-y-auto space-y-2 p-3 rounded border border-border-color bg-desk-dark/60">
                {generatedData.clues.map((clue, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded border border-border-color/60 bg-surface/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-serif font-bold text-aged-paper">{clue.label}</span>
                      {clue.helpText && <p className="font-typewriter text-[10px] text-fog-grey">{clue.helpText}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-typewriter text-[10px] text-lamp-amber bg-lamp-amber/10 px-2 py-0.5 rounded border border-lamp-amber/30">
                        {clue.type}
                      </span>
                      {clue.required && <span className="text-string-red font-bold text-xs">*</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border-color">
              <Button type="button" variant="ghost" size="sm" onClick={() => setGeneratedData(null)}>
                ← Try Another Prompt
              </Button>
              <Button type="button" variant="primary" size="md" onClick={handleAccept}>
                ✓ Accept & Populate Case File
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
