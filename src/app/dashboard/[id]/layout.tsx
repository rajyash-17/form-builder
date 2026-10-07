'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { CaseStatus } from '@/lib/schemas';

import { ShareModal } from '@/components/ShareModal';

export default function CaseFileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();
  const caseId = params.id;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: caseData, isLoading, refetch } = trpc.case.getById.useQuery(
    { id: caseId },
    { retry: false }
  );

  const statusMutation = trpc.case.setStatus.useMutation({
    onSuccess: (data) => {
      setToast({ message: `Case status updated to "${data.status}".`, type: 'success' });
      refetch();
    },
    onError: (err) => {
      setToast({ message: err.message || 'Failed to update case status.', type: 'error' });
    },
  });

  const handleStatusChange = (newStatus: CaseStatus) => {
    statusMutation.mutate({ id: caseId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <h2 className="font-serif text-2xl font-bold text-string-red mb-2">
          Case File Not Found
        </h2>
        <p className="font-typewriter text-xs text-fog-grey mb-6">
          This case file does not exist or you do not hold detective authorization.
        </p>
        <Link href="/dashboard">
          <Button variant="primary">Return to Desk Archives</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { name: 'Build Clues', href: `/dashboard/${caseId}`, exact: true },
    { name: 'Testimonies', href: `/dashboard/${caseId}/testimonies` },
    { name: 'Evidence Board', href: `/dashboard/${caseId}/evidence` },
    { name: 'Case Settings', href: `/dashboard/${caseId}/settings` },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard"
          className="font-typewriter text-xs text-fog-grey hover:text-lamp-amber transition-colors flex items-center gap-1.5"
        >
          <span>←</span> Back to Desk Archives
        </Link>
      </div>

      {/* Case Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface p-6 rounded border border-border-color paper-grain">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-aged-paper">
              {caseData.title}
            </h1>
            <Badge status={caseData.status as CaseStatus} />
          </div>
          <p className="font-sans text-xs text-fog-grey max-w-2xl">
            {caseData.description || 'No case brief recorded.'}
          </p>
          <div className="flex items-center gap-4 mt-2 font-typewriter text-[11px] text-fog-grey/80">
            <span>Case ID: {caseData.shareId}</span>
            <span>•</span>
            <span>Depositions: {caseData.testimonyCount}</span>
            <span>•</span>
            <span>Views: {caseData.viewCount}</span>
          </div>
        </div>

        {/* Status Dropdown & Share Modal Button */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex-1 md:flex-initial px-3 py-2 rounded border border-border-color bg-desk-dark hover:border-lamp-amber font-typewriter text-xs text-lamp-amber flex items-center justify-center gap-1.5 transition-colors"
            title="Share & Embed Case File"
          >
            <span>📢 Dispatch & Embed</span>
          </button>

          <select
            value={caseData.status}
            onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
            disabled={statusMutation.isPending}
            className="px-3 py-2 rounded border border-border-color bg-desk-dark font-typewriter text-xs text-aged-paper focus:border-lamp-amber cursor-pointer"
          >
            <option value="draft">Open case (Draft)</option>
            <option value="published">Active (Published)</option>
            <option value="closed">Cold case (Closed)</option>
          </select>
        </div>
      </div>

      {/* Case Navigation Tabs */}
      <div className="border-b border-border-color flex items-center gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 font-typewriter text-xs tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-lamp-amber text-lamp-amber font-bold'
                  : 'border-transparent text-fog-grey hover:text-aged-paper hover:border-fog-grey/50'
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[50vh]">{children}</div>

      {/* Share & Embed Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareId={caseData.shareId}
        caseTitle={caseData.title}
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
