'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Stamp } from '@/components/ui/Stamp';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ActivityTimelineChart,
  ChoiceDistributionChart,
  RatingHistogramChart,
  TextEvidenceCard,
} from '@/components/EvidenceBoardCharts';
import { DetectiveVerdictCard } from '@/components/DetectiveVerdictCard';

export default function CaseEvidencePage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  const { data: statsData, isLoading, refetch, isRefetching } = trpc.testimony.getStats.useQuery(
    { caseId, range },
    { retry: false }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Spinner className="w-10 h-10" />
        <p className="font-typewriter text-xs text-lamp-amber animate-pulse">
          Dusting crime scene for prints and pinning evidence...
        </p>
      </div>
    );
  }

  const totals = statsData?.totals || { views: 0, testimonies: 0, completionRate: 0, avgDurationSeconds: 0 };
  const timeline = statsData?.timeline || [];
  const clueStats = statsData?.clueStats || [];

  return (
    <div className="space-y-8 relative">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-serif text-2xl font-bold text-aged-paper">📌 Crime Scene Evidence Board</h2>
            <Stamp text="EVIDENCE PINNED" variant="amber" rotation="left" size="sm" />
          </div>
          <p className="font-typewriter text-xs text-fog-grey">
            Analyze witness deposition activity and clue breakdown patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Selector */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded border border-border-color">
            {(
              [
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id)}
                className={`px-3 py-1 rounded font-typewriter text-xs transition-colors ${
                  range === item.id
                    ? 'bg-lamp-amber text-ink-black font-bold'
                    : 'text-fog-grey hover:text-aged-paper'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {totals.testimonies === 0 && totals.views === 0 ? (
        <EmptyState
          title="No Evidence Pinned Yet"
          description="Distribute your Case Link to gather testimony and uncover patterns on your Evidence Board."
        />
      ) : (
        <div className="space-y-8 relative">
          {/* Decorative Red String SVG Overlay for Desktop */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block z-0 opacity-40">
            <line x1="15%" y1="60" x2="35%" y2="220" stroke="#b3261e" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="40%" y1="220" x2="70%" y2="220" stroke="#b3261e" strokeWidth="2" strokeDasharray="4 2" />
          </svg>

          {/* Stamped Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <Card tabTitle="TOTAL VIEWS">
              <p className="font-typewriter text-xs text-fog-grey">Informant Case Views</p>
              <p className="font-serif text-3xl font-bold text-lamp-amber mt-1">{totals.views}</p>
            </Card>

            <Card tabTitle="SWORN TESTIMONIES">
              <p className="font-typewriter text-xs text-fog-grey">Depositions Filed</p>
              <p className="font-serif text-3xl font-bold text-lamp-amber mt-1">{totals.testimonies}</p>
            </Card>

            <Card tabTitle="COMPLETION RATE">
              <p className="font-typewriter text-xs text-fog-grey">Deposition Conversion</p>
              <p className="font-serif text-3xl font-bold text-emerald-500 mt-1">{totals.completionRate}%</p>
            </Card>

            <Card tabTitle="AVG DEPOSITION TIME">
              <p className="font-typewriter text-xs text-fog-grey">Avg Deposition Duration</p>
              <p className="font-serif text-3xl font-bold text-lamp-amber mt-1">
                {totals.avgDurationSeconds}s
              </p>
            </Card>
          </div>

          {/* Detective's Verdict AI Summary Card */}
          <div className="relative z-10">
            <DetectiveVerdictCard caseId={caseId} />
          </div>

          {/* Activity Log Recharts Timeline */}
          <div className="relative z-10">
            <Card tabTitle="TIMELINE • SWORN TESTIMONY ACTIVITY LOG">
              <h3 className="font-serif text-lg font-bold text-lamp-amber mb-4">
                Deposition Frequency ({range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'})
              </h3>
              <ActivityTimelineChart data={timeline} />
            </Card>
          </div>

          {/* Per-Clue Breakdown Analytics */}
          <div className="space-y-4 relative z-10">
            <h3 className="font-serif text-xl font-bold text-aged-paper border-b border-border-color pb-2">
              Clue Pattern Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clueStats.map((clue) => {
                if (clue.category === 'choice') {
                  return (
                    <ChoiceDistributionChart
                      key={clue.id}
                      label={clue.label}
                      data={clue.distribution}
                    />
                  );
                }

                if (clue.category === 'numeric') {
                  return (
                    <RatingHistogramChart
                      key={clue.id}
                      label={clue.label}
                      avg={clue.avg}
                      min={clue.min}
                      max={clue.max}
                      data={clue.distribution}
                    />
                  );
                }

                if (clue.category === 'text') {
                  return (
                    <TextEvidenceCard
                      key={clue.id}
                      label={clue.label}
                      totalAnswers={clue.totalAnswers}
                      recentAnswers={clue.recentAnswers || []}
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
