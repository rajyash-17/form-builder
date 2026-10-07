'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { trpc } from '@/lib/trpc/client';
import { Clue, ClueType } from '@/lib/schemas';
import { EvidenceLocker } from '@/components/EvidenceLocker';
import { ClueInspector } from '@/components/ClueInspector';
import { SortableClueItem } from '@/components/SortableClueItem';
import { ClueRenderer } from '@/components/ClueRenderer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toast } from '@/components/ui/Toast';
import { AIGeneratorModal } from '@/components/AIGeneratorModal';
import { DetectiveNotesPanel } from '@/components/DetectiveNotesPanel';

function generateId(): string {
  return 'clue-' + Math.random().toString(36).substring(2, 9);
}

export default function CaseBuilderPage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // tRPC query to fetch initial case data
  const { data: caseData, isLoading, refetch } = trpc.case.getById.useQuery(
    { id: caseId },
    { retry: false }
  );

  // Local state for builder
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clues, setClues] = useState<Clue[]>([]);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Autosave status tracking
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // History for Undo / Redo
  const [history, setHistory] = useState<Clue[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const initialLoadedRef = useRef(false);

  // Initialize local state from caseData once loaded
  useEffect(() => {
    if (caseData && !initialLoadedRef.current) {
      setTitle(caseData.title);
      setDescription(caseData.description || '');
      setClues(caseData.clues || []);
      setHistory([caseData.clues || []]);
      setHistoryIndex(0);
      initialLoadedRef.current = true;
    }
  }, [caseData]);

  // tRPC update mutation
  const updateMutation = trpc.case.update.useMutation({
    onSuccess: () => {
      setSaveStatus('saved');
    },
    onError: (err) => {
      setSaveStatus('unsaved');
      setToast({ message: err.message || 'Failed to save case file.', type: 'error' });
    },
  });

  // tRPC setStatus mutation for Publish button
  const statusMutation = trpc.case.setStatus.useMutation({
    onSuccess: () => {
      refetch();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const shareUrl = `${origin}/c/${caseData?.shareId}`;
      navigator.clipboard.writeText(shareUrl);
      setToast({
        message: 'Case status set to ACTIVE! Public Case Link copied to clipboard.',
        type: 'success',
      });
    },
  });

  // Helper to record history state
  const pushHistory = (newClues: Clue[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newClues);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setClues(history[prevIdx]);
      setSaveStatus('unsaved');
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setClues(history[nextIdx]);
      setSaveStatus('unsaved');
    }
  }, [historyIndex, history]);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Debounced Autosave (1.5 seconds)
  useEffect(() => {
    if (!initialLoadedRef.current || !caseData) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      updateMutation.mutate({
        id: caseId,
        title,
        description,
        status: caseData.status,
        clues,
        settings: caseData.settings,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, description, clues]);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Drag End handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setClues((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArr = arrayMove(items, oldIndex, newIndex);
        pushHistory(newArr);
        return newArr;
      });
    }
  };

  // Add Clue from Evidence Locker
  const handleAddClue = (type: ClueType) => {
    const defaultLabels: Record<string, string> = {
      shortText: 'Witness Short Answer',
      longText: 'Detailed Witness Statement',
      email: 'Informant Badge Email',
      phone: 'Contact Phone Line',
      url: 'Reference Web Link',
      statement: 'OFFIDENTIAL INVESTIGATIVE NOTE',
      dropdown: 'Select Investigation Option',
      multipleChoice: 'Multiple Choice Question',
      checkboxes: 'Select All Applicable Evidence',
      yesNo: 'Did you witness the incident?',
      number: 'Quantified Value',
      date: 'Incident Date',
      time: 'Incident Time',
      rating: 'Clue Credibility Rating',
      linearScale: 'Impact Severity Scale',
      fileUpload: 'Upload Physical Evidence File',
    };

    const newClue: Clue = {
      id: generateId(),
      type,
      label: defaultLabels[type] || 'New Clue Question',
      helpText: '',
      required: false,
      placeholder: '',
      options: ['dropdown', 'multipleChoice', 'checkboxes'].includes(type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : [],
      pageIndex: 0,
    };

    const newClues = [...clues, newClue];
    setClues(newClues);
    setSelectedClueId(newClue.id);
    pushHistory(newClues);
  };

  // Update Clue properties
  const handleUpdateClue = (updated: Clue) => {
    const newClues = clues.map((c) => (c.id === updated.id ? updated : c));
    setClues(newClues);
    pushHistory(newClues);
  };

  // Duplicate Clue
  const handleDuplicateClue = (id: string) => {
    const targetIdx = clues.findIndex((c) => c.id === id);
    if (targetIdx === -1) return;

    const source = clues[targetIdx];
    const duplicated: Clue = {
      ...source,
      id: generateId(),
      label: `${source.label} (Copy)`,
    };

    const newClues = [...clues];
    newClues.splice(targetIdx + 1, 0, duplicated);
    setClues(newClues);
    setSelectedClueId(duplicated.id);
    pushHistory(newClues);
  };

  // Delete Clue
  const handleDeleteClue = (id: string) => {
    const newClues = clues.filter((c) => c.id !== id);
    setClues(newClues);
    if (selectedClueId === id) setSelectedClueId(null);
    pushHistory(newClues);
  };

  // AI Merge Handler
  const handleAiMerge = (newTitle: string, newDesc: string, newClues: Clue[]) => {
    if (newTitle) setTitle(newTitle);
    if (newDesc) setDescription(newDesc);
    setClues(newClues);
    pushHistory(newClues);
    setToast({ message: `Case file updated with ${newClues.length} AI generated clues!`, type: 'success' });
  };

  // 1-Click Apply Suggested Clue
  const handleApplySuggestedClue = (cluePartial: Partial<Clue>) => {
    const newClue: Clue = {
      id: generateId(),
      type: (cluePartial.type || 'shortText') as any,
      label: cluePartial.label || 'Suggested Clue Question',
      helpText: cluePartial.helpText || '',
      required: Boolean(cluePartial.required),
      placeholder: cluePartial.placeholder || '',
      options: cluePartial.options || [],
      pageIndex: 0,
    };
    const newArr = [...clues, newClue];
    setClues(newArr);
    pushHistory(newArr);
    setSelectedClueId(newClue.id);
    setToast({ message: `Added suggested clue "${newClue.label}" to canvas.`, type: 'success' });
  };

  // Publish Case File Action
  const handlePublish = () => {
    statusMutation.mutate({ id: caseId, status: 'published' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!caseData) return null;

  const selectedClue = clues.find((c) => c.id === selectedClueId) || null;

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Mode Switcher, Undo/Redo, AI Brief, Autosave Indicator, Publish */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded border border-border-color bg-surface paper-grain">
        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1.5 rounded font-typewriter text-xs flex items-center gap-1.5 transition-colors border ${
              isPreviewMode
                ? 'bg-lamp-amber text-ink-black border-lamp-amber font-bold shadow-amber-glow'
                : 'bg-desk-dark text-aged-paper border-border-color hover:border-lamp-amber'
            }`}
          >
            <span>{isPreviewMode ? '✏️ Edit Case File' : '🔍 Stakeout Inspection (Preview)'}</span>
          </button>

          {/* AI Generator Button */}
          {!isPreviewMode && (
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 rounded font-typewriter text-xs flex items-center gap-1.5 bg-desk-dark text-lamp-amber border border-border-color hover:border-lamp-amber transition-colors"
            >
              <span>⚡ Brief the Detective</span>
            </button>
          )}

          {/* Undo / Redo */}
          {!isPreviewMode && (
            <div className="flex items-center gap-1 border-l border-border-color pl-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded border border-border-color/60 hover:border-lamp-amber text-fog-grey hover:text-lamp-amber disabled:opacity-40 text-xs"
                title="Undo (Ctrl+Z)"
              >
                ↩️ Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded border border-border-color/60 hover:border-lamp-amber text-fog-grey hover:text-lamp-amber disabled:opacity-40 text-xs"
                title="Redo (Ctrl+Shift+Z)"
              >
                ↪️ Redo
              </button>
            </div>
          )}
        </div>

        {/* Right Side Status & Publish Button */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Autosave Status */}
          <div className="font-typewriter text-xs flex items-center gap-1.5">
            {saveStatus === 'saving' ? (
              <span className="text-lamp-amber animate-pulse">⏳ Saving notes...</span>
            ) : saveStatus === 'saved' ? (
              <span className="text-emerald-500">✓ Notes saved to file</span>
            ) : (
              <span className="text-fog-grey">Unsaved notes</span>
            )}
          </div>

          {/* Publish Button */}
          {caseData.status !== 'published' && (
            <Button variant="primary" size="sm" onClick={handlePublish} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? 'Publishing...' : '🚀 Publish Case File'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Builder Content Area */}
      {isPreviewMode ? (
        /* Preview Mode View ("Stakeout Inspection") */
        <div className="max-w-3xl mx-auto p-6 rounded border border-border-color bg-aged-paper text-ink-black dark:bg-[#181820] dark:text-aged-paper paper-grain shadow-paper-shadow space-y-6">
          <div className="border-b border-border-color pb-4">
            <h2 className="font-serif text-2xl font-bold text-lamp-amber">{title || 'Untitled Case File'}</h2>
            {description && <p className="font-sans text-xs text-muted dark:text-fog-grey mt-1">{description}</p>}
          </div>

          {clues.length > 0 ? (
            <div className="space-y-6">
              {clues.map((clue) => (
                <div key={clue.id} className="p-4 rounded border border-border-color/40 bg-surface/30">
                  <ClueRenderer clue={clue} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No Clues Rendered" description="Add clues in edit mode to inspect how informants will see this case file." />
          )}

          <div className="pt-4 border-t border-border-color flex justify-end">
            <Button variant="primary" disabled>
              Sworn Testimony Submission (Preview)
            </Button>
          </div>
        </div>
      ) : (
        /* Three-Pane Builder View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Evidence Locker Palette */}
          <div className="lg:col-span-3 h-[75vh]">
            <EvidenceLocker onAddClue={handleAddClue} />
          </div>

          {/* Center Pane: Case File Canvas */}
          <div className="lg:col-span-6 space-y-4">
            {/* Inline Title & Description Editor */}
            <div className="p-4 rounded border border-border-color bg-surface paper-grain space-y-3">
              <Input
                label="Case Title (Editable Inline)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Case Title..."
                className="font-serif text-lg font-bold"
              />
              <Textarea
                label="Case Brief / Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Investigation brief overview..."
                rows={2}
              />
            </div>

            {/* Detective's Notes AI Optimization Panel */}
            <DetectiveNotesPanel caseId={caseId} onApplyClue={handleApplySuggestedClue} />

            {/* Sortable Clues List */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={clues.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {clues.length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {clues.map((clue, index) => (
                        <motion.div
                          key={clue.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                        >
                          <SortableClueItem
                            clue={clue}
                            index={index}
                            isSelected={selectedClueId === clue.id}
                            onSelect={() => setSelectedClueId(clue.id)}
                            onDuplicate={() => handleDuplicateClue(clue.id)}
                            onDelete={() => handleDeleteClue(clue.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyState
                    title="No Clues Added to Case File"
                    description="Click any clue type from the Evidence Locker on the left to add your first question."
                  />
                )}
              </SortableContext>
            </DndContext>
          </div>

          {/* Right Pane: Clue Inspector Editor */}
          <div className="lg:col-span-3 h-[75vh]">
            <ClueInspector
              clue={selectedClue}
              allClues={clues}
              onUpdateClue={handleUpdateClue}
              onClose={() => setSelectedClueId(null)}
            />
          </div>
        </div>
      )}

      {/* Brief the Detective AI Modal */}
      <AIGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAccept={handleAiMerge}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
