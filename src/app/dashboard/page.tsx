'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Stamp } from '@/components/ui/Stamp';
import { Button } from '@/components/ui/Button';
import { Badge, CaseStatusType } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

import { AIGeneratorModal } from '@/components/AIGeneratorModal';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published' | 'closed'>('all');

  // New Case Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const { data: caseList, isLoading: caseListLoading, refetch } = trpc.case.list.useQuery({
    search,
    status: selectedStatus,
  });

  const updateMutation = trpc.case.update.useMutation();

  const createMutation = trpc.case.create.useMutation({
    onSuccess: (data) => {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setToast({ message: `New case file "${data.title}" opened in archives.`, type: 'success' });
      refetch();
    },
    onError: (err) => {
      setToast({ message: err.message || 'Failed to open case file.', type: 'error' });
    },
  });

  const handleAiAccept = async (title: string, description: string, clues: any[]) => {
    try {
      const created = await createMutation.mutateAsync({ title, description });
      await updateMutation.mutateAsync({
        id: created.id,
        title,
        description,
        status: 'draft',
        clues,
        settings: {
          accentColor: '#f0b44c',
          thankYouMessage: 'Your testimony has been sworn and recorded in official archives.',
          allowMultipleSubmissions: true,
        },
      });
      setToast({ message: `AI Case File "${title}" drafted with ${clues.length} clues! Opening...`, type: 'success' });
      router.push(`/dashboard/${created.id}`);
    } catch {
      setToast({ message: 'Failed to save AI generated case file.', type: 'error' });
    }
  };

  const duplicateMutation = trpc.case.duplicate.useMutation({
    onSuccess: (data) => {
      setToast({ message: `Cloned independent case file: "${data.title}".`, type: 'success' });
      refetch();
    },
    onError: (err) => {
      setToast({ message: err.message || 'Failed to clone case file.', type: 'error' });
    },
  });

  const deleteMutation = trpc.case.delete.useMutation({
    onSuccess: () => {
      setDeleteTarget(null);
      setToast({ message: 'Case file permanently removed from archives.', type: 'info' });
      refetch();
    },
    onError: (err) => {
      setToast({ message: err.message || 'Failed to remove case file.', type: 'error' });
    },
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate({ title: newTitle, description: newDescription });
  };

  const handleCopyShareLink = (shareId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/c/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    setToast({ message: 'Case link copied to clipboard! Ready to distribute.', type: 'info' });
  };

  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  const activeCasesCount = caseList?.filter((c) => c.status === 'published').length || 0;
  const totalTestimoniesCount = caseList?.reduce((acc, c) => acc + c.testimonyCount, 0) || 0;
  const coldCasesCount = caseList?.filter((c) => c.status === 'closed').length || 0;

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl font-bold text-aged-paper">Desk Archives</h1>
            <Stamp text="AGENT VERIFIED" variant="amber" rotation="left" size="sm" />
          </div>
          <p className="font-typewriter text-xs text-fog-grey">
            Welcome back, <span className="text-lamp-amber font-semibold">{user?.name}</span> ({user?.badgeNumber}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="md" onClick={() => setIsAiModalOpen(true)}>
            ⚡ Brief the Detective (AI)
          </Button>
          <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
            📁 Open New Case
          </Button>
        </div>
      </div>

      {/* Desk Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card tabTitle="ACTIVE CASES">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-typewriter text-xs text-fog-grey">Active Investigations</p>
              <p className="font-serif text-3xl font-bold text-lamp-amber mt-1">{activeCasesCount}</p>
            </div>
            <div className="text-3xl">🔍</div>
          </div>
        </Card>

        <Card tabTitle="TESTIMONIES RECORDED">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-typewriter text-xs text-fog-grey">Depositions Gathered</p>
              <p className="font-serif text-3xl font-bold text-lamp-amber mt-1">{totalTestimoniesCount}</p>
            </div>
            <div className="text-3xl">📜</div>
          </div>
        </Card>

        <Card tabTitle="COLD CASES">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-typewriter text-xs text-fog-grey">Archived Cases</p>
              <p className="font-serif text-3xl font-bold text-fog-grey mt-1">{coldCasesCount}</p>
            </div>
            <div className="text-3xl">❄️</div>
          </div>
        </Card>
      </div>

      {/* Case Directory Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface p-4 rounded border border-border-color">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            placeholder="🔍 Search the archives by case title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'All Files' },
              { id: 'draft', label: 'Open cases' },
              { id: 'published', label: 'Active' },
              { id: 'closed', label: 'Cold cases' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded font-typewriter text-xs whitespace-nowrap transition-colors border ${
                selectedStatus === tab.id
                  ? 'bg-lamp-amber text-ink-black border-lamp-amber font-bold'
                  : 'bg-transparent text-fog-grey border-border-color hover:text-aged-paper hover:border-lamp-amber/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Case Files Grid */}
      {caseListLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : caseList && caseList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseList.map((caseItem) => (
            <Card key={caseItem.id} tabTitle={`CASE NO. ${caseItem.shareId.toUpperCase()}`}>
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/dashboard/${caseItem.id}`}
                      className="font-serif text-lg font-bold text-ink-black dark:text-aged-paper hover:text-lamp-amber transition-colors line-clamp-1"
                    >
                      {caseItem.title}
                    </Link>
                    <Badge status={caseItem.status as CaseStatusType} />
                  </div>

                  <p className="font-sans text-xs text-muted dark:text-fog-grey line-clamp-2 min-h-[2.25rem]">
                    {caseItem.description || 'No case brief recorded.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-color/60 flex items-center justify-between text-xs font-typewriter text-fog-grey">
                  <span>📜 {caseItem.testimonyCount} testimonies</span>
                  <span>{caseItem.cluesCount} clues</span>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/dashboard/${caseItem.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      📁 Inspect File
                    </Button>
                  </Link>

                  <button
                    onClick={() => handleCopyShareLink(caseItem.shareId)}
                    className="p-1.5 rounded border border-border-color hover:border-lamp-amber text-fog-grey hover:text-lamp-amber transition-colors"
                    title="Copy Case Link"
                  >
                    🔗
                  </button>

                  <button
                    onClick={() => duplicateMutation.mutate({ id: caseItem.id })}
                    disabled={duplicateMutation.isPending}
                    className="p-1.5 rounded border border-border-color hover:border-lamp-amber text-fog-grey hover:text-lamp-amber transition-colors"
                    title="Duplicate Case File"
                  >
                    📋
                  </button>

                  <button
                    onClick={() => setDeleteTarget({ id: caseItem.id, title: caseItem.title })}
                    className="p-1.5 rounded border border-string-red/40 hover:bg-string-red/20 text-string-red transition-colors"
                    title="Delete Case File"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? 'No Case Files Match Your Search' : 'No Open Cases in Archives'}
          description={
            search
              ? `No detective records matching "${search}" were found in archives.`
              : 'Your desk is clean and your typewriter is waiting, detective. Click below to open your first case file.'
          }
          actionText="Open New Case"
          onAction={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* Create New Case Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Case File"
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          <Input
            label="Case Title"
            placeholder="e.g. Missing Person Investigation on 5th Street"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Case Brief / Description"
            placeholder="Brief overview of the investigation, key witness requirements..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending || !newTitle.trim()}
            >
              {createMutation.isPending ? 'Opening File...' : '📁 File Case'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Burn Case File Permanently?"
      >
        <p className="font-sans text-sm text-primary mb-4">
          Are you certain you want to delete <span className="font-bold text-lamp-amber">{deleteTarget?.title}</span>? All sworn witness testimonies associated with this case file will be burned permanently from agency archives.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Burning File...' : '🔥 Burn Case File'}
          </Button>
        </div>
      </Modal>

      {/* Brief the Detective AI Generator Modal */}
      <AIGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAccept={handleAiAccept}
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
