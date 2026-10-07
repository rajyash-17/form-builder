'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { ClueRenderer } from '@/components/ClueRenderer';
import { Button } from '@/components/ui/Button';
import { Stamp } from '@/components/ui/Stamp';
import { Spinner } from '@/components/ui/Spinner';
import { buildResponseSchema, evaluateCondition } from '@/lib/validation';
import { Clue } from '@/lib/schemas';
import { z } from 'zod';

export default function PublicCasePage({ params }: { params: { shareId: string } }) {
  const shareId = params.shareId;

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    thankYouMessage: string;
    redirectUrl?: string;
  } | null>(null);

  const { data: caseData, isLoading, error: fetchError } = trpc.case.getByShareId.useQuery(
    { shareId },
    { retry: false }
  );

  const submitMutation = trpc.testimony.submit.useMutation({
    onSuccess: (data) => {
      setIsSubmitting(false);
      setSubmittedResult({
        thankYouMessage: data.thankYouMessage,
        redirectUrl: data.redirectUrl,
      });
      if (data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 3000);
      }
    },
    onError: (err) => {
      setIsSubmitting(false);
      setErrors({ _form: err.message || 'Failed to record sworn testimony.' });
    },
  });

  const handleAnswerChange = (clueId: string, val: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [clueId]: val,
    }));
    if (errors[clueId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[clueId];
        return copy;
      });
    }
  };

  const handleFileUpload = async (clueId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [clueId]: json.error || 'File upload failed.' }));
        return;
      }

      handleAnswerChange(clueId, json.fileId);
    } catch {
      setErrors((prev) => ({ ...prev, [clueId]: 'Network error during file upload.' }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  // Handle Cold Case or Closed/Not Found
  if (fetchError || !caseData) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg p-8 rounded border border-border-color bg-aged-paper text-ink-black dark:bg-desk-dark dark:text-aged-paper paper-grain shadow-2xl text-center space-y-4">
          <Stamp text="COLD CASE" variant="grey" rotation="left" size="lg" className="mb-2" />
          <h2 className="font-serif text-2xl font-bold text-lamp-amber">
            Case Deposition Closed
          </h2>
          <p className="font-typewriter text-xs text-muted dark:text-fog-grey">
            {fetchError?.message || 'This case file is cold or no longer accepting testimonies.'}
          </p>
        </div>
      </div>
    );
  }

  // Handle Successful Submission Receipt Screen
  if (submittedResult) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg p-8 rounded border border-border-color bg-aged-paper text-ink-black dark:bg-desk-dark dark:text-aged-paper paper-grain shadow-2xl text-center space-y-6">
          <div className="inline-block animate-bounce">
            <Stamp text="TESTIMONY FILED & SWORN" variant="green" rotation="left" size="lg" />
          </div>

          <h2 className="font-serif text-3xl font-bold text-lamp-amber">
            Deposition Recorded
          </h2>

          <p className="font-sans text-sm text-primary leading-relaxed bg-surface/40 p-4 rounded border border-border-color">
            "{submittedResult.thankYouMessage}"
          </p>

          <p className="font-typewriter text-xs text-fog-grey">
            Case File Reference: <span className="font-mono text-lamp-amber">{shareId}</span>
          </p>

          {submittedResult.redirectUrl && (
            <p className="font-typewriter text-xs text-lamp-amber animate-pulse">
              Redirecting witness to bureau portal...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Group Clues by Page Break
  const allClues = caseData.clues || [];
  const pages: Clue[][] = [];
  let currentP: Clue[] = [];

  for (const clue of allClues) {
    if (clue.type === 'pageBreak') {
      if (currentP.length > 0) {
        pages.push(currentP);
        currentP = [];
      }
    } else {
      currentP.push(clue);
    }
  }
  if (currentP.length > 0 || pages.length === 0) {
    pages.push(currentP);
  }

  const activePageClues = pages[currentPageIndex] || [];
  const totalPages = pages.length;
  const accentColor = caseData.settings?.accentColor || '#f0b44c';

  // Filter visible clues based on conditional logic rules
  const visibleActiveClues = activePageClues.filter(
    (c) => !c.showIf || evaluateCondition(c.showIf, answers)
  );

  const validateCurrentPage = (): boolean => {
    setErrors({});
    const schema = buildResponseSchema(visibleActiveClues, answers);
    try {
      schema.parse(answers);
      return true;
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          const path = e.path[0] as string;
          if (path) formattedErrors[path] = e.message;
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const handleNextPage = () => {
    if (validateCurrentPage()) {
      setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    setErrors({});
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentPage()) return;

    setIsSubmitting(true);
    submitMutation.mutate({
      shareId,
      answers,
      honeypot,
    });
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 flex justify-center">
      <div className="w-full max-w-2xl p-6 sm:p-10 rounded border border-border-color bg-aged-paper text-ink-black dark:bg-[#181820] dark:text-aged-paper paper-grain shadow-paper-shadow space-y-8 relative overflow-hidden">
        {/* Cover Banner Image */}
        {caseData.settings?.coverBannerUrl && (
          <div className="w-full h-44 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 overflow-hidden border-b border-border-color">
            <img
              src={caseData.settings.coverBannerUrl}
              alt="Case Cover Banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Case File Header */}
        <div className="border-b border-border-color pb-6 space-y-2">
          <div className="flex items-center justify-between">
            <Stamp text="OFFICIAL DEPOSITION" variant="amber" rotation="left" size="sm" />
            <span className="font-typewriter text-[10px] text-fog-grey">
              CASE #{shareId.toUpperCase()}
            </span>
          </div>

          <h1
            className="font-serif text-3xl font-bold tracking-tight"
            style={{ color: accentColor }}
          >
            {caseData.title}
          </h1>

          {caseData.description && (
            <p className="font-sans text-xs text-muted dark:text-fog-grey leading-relaxed">
              {caseData.description}
            </p>
          )}

          {/* Multi-Page Progress Indicator */}
          {totalPages > 1 && (
            <div className="pt-4 space-y-1.5">
              <div className="flex items-center justify-between font-typewriter text-xs text-fog-grey">
                <span>Interrogation Page {currentPageIndex + 1} of {totalPages}</span>
                <span>{Math.round(((currentPageIndex + 1) / totalPages) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-surface/60 rounded overflow-hidden border border-border-color/60">
                <div
                  className="h-full transition-all duration-300 rounded"
                  style={{
                    width: `${((currentPageIndex + 1) / totalPages) * 100}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Deposition Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Hidden Honeypot Field */}
          <input
            type="text"
            name="bureau_code"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {errors._form && (
            <div className="p-4 bg-string-red/10 border border-string-red rounded text-string-red font-typewriter text-xs flex items-center gap-2">
              <span>🚨</span>
              <span>{errors._form}</span>
            </div>
          )}

          {/* Render Active Page Clues */}
          {visibleActiveClues.length > 0 ? (
            <div className="space-y-6">
              {visibleActiveClues.map((clue) => (
                <div
                  key={clue.id}
                  className="space-y-1.5 p-4 rounded border border-border-color/40 bg-surface/30"
                >
                  {clue.type === 'fileUpload' ? (
                    <div className="space-y-2">
                      <label className="block font-serif text-sm font-bold text-ink-black dark:text-aged-paper">
                        {clue.label} {clue.required && <span className="text-string-red">*</span>}
                      </label>
                      <input
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(clue.id, e.target.files[0])}
                        className="text-xs font-typewriter text-fog-grey"
                      />
                      {Boolean(answers[clue.id]) && (
                        <p className="font-typewriter text-xs text-emerald-500">
                          ✓ Evidence file uploaded (ID: {String(answers[clue.id])})
                        </p>
                      )}
                    </div>
                  ) : (
                    <ClueRenderer
                      clue={clue}
                      value={answers[clue.id]}
                      onChange={(val) => handleAnswerChange(clue.id, val)}
                    />
                  )}

                  {errors[clue.id] && (
                    <p className="font-typewriter text-xs text-string-red flex items-center gap-1 mt-1">
                      <span>⚠️</span> {String(errors[clue.id])}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-typewriter text-xs text-fog-grey text-center py-4 italic">
              {activePageClues.length > 0
                ? 'No clues active for this page based on your previous answers.'
                : 'This page contains no clue questions.'}
            </p>
          )}

          {/* Multi-Page Navigation & Submission Footer */}
          <div className="pt-6 border-t border-border-color flex items-center justify-between gap-3">
            {currentPageIndex > 0 ? (
              <Button type="button" variant="ghost" onClick={handlePrevPage}>
                ← Previous Page
              </Button>
            ) : (
              <div />
            )}

            {currentPageIndex < totalPages - 1 ? (
              <Button
                type="button"
                onClick={handleNextPage}
                style={{ backgroundColor: accentColor, color: '#0b0b0d', fontWeight: 'bold' }}
              >
                Next Page →
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                style={{ backgroundColor: accentColor, color: '#0b0b0d', fontWeight: 'bold' }}
              >
                {isSubmitting ? 'Swearing Testimony...' : '📜 Submit Sworn Testimony'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
