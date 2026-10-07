'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Stamp } from '@/components/ui/Stamp';

export default function CaseTestimoniesPage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Selected row for Witness Statement Drawer / Modal
  const [selectedTestimonyId, setSelectedTestimonyId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const { data, isLoading, refetch } = trpc.testimony.list.useQuery({
    caseId,
    search,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy,
  });

  const { data: drawerTestimony } = trpc.testimony.getById.useQuery(
    { id: selectedTestimonyId || '' },
    { enabled: !!selectedTestimonyId }
  );

  const deleteSingleMutation = trpc.testimony.delete.useMutation({
    onSuccess: () => {
      setSelectedTestimonyId(null);
      setToast({ message: 'Sworn testimony removed from archives.', type: 'info' });
      refetch();
    },
  });

  const bulkDeleteMutation = trpc.testimony.bulkDelete.useMutation({
    onSuccess: (res) => {
      setSelectedIds([]);
      setToast({ message: `Burned ${res.count} sworn testimonies from archives.`, type: 'info' });
      refetch();
    },
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.testimonies) {
      setSelectedIds(data.testimonies.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = (format: 'csv' | 'json') => {
    window.open(`/api/cases/${caseId}/export?format=${format}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const clues = data?.clues || [];
  const testimonies = data?.testimonies || [];
  const inputClues = clues.filter((c) => c.type !== 'statement');

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-color pb-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-aged-paper flex items-center gap-2">
            <span>📜 Witness Log & Depositions</span>
          </h2>
          <p className="font-typewriter text-xs text-fog-grey">
            Inspect sworn witness testimonies gathered by the bureau.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => bulkDeleteMutation.mutate({ ids: selectedIds })}
              disabled={bulkDeleteMutation.isPending}
            >
              🔥 Burn ({selectedIds.length}) Selected
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => handleExport('csv')}>
            📊 Export CSV
          </Button>

          <Button variant="ghost" size="sm" onClick={() => handleExport('json')}>
            📄 Export JSON
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-surface p-4 rounded border border-border-color">
        <Input
          placeholder="🔍 Search sworn statements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Input
          type="date"
          label="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <Input
          type="date"
          label="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <div className="space-y-1">
          <label className="block text-xs font-typewriter uppercase tracking-wider text-fog-grey">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="w-full px-3 py-2 rounded font-typewriter text-xs bg-desk-dark text-primary border border-border-color"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Testimonies Evidence Table */}
      {testimonies.length > 0 ? (
        <div className="overflow-x-auto rounded border border-border-color bg-surface paper-grain shadow-paper-shadow">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-desk-dark text-fog-grey font-typewriter border-b border-border-color uppercase tracking-wider">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === testimonies.length && testimonies.length > 0}
                    onChange={handleSelectAll}
                    className="accent-lamp-amber cursor-pointer rounded"
                  />
                </th>
                <th className="p-3 whitespace-nowrap">Submitted At</th>
                {inputClues.map((c) => (
                  <th key={c.id} className="p-3 whitespace-nowrap max-w-[200px] truncate">
                    {c.label}
                  </th>
                ))}
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/60">
              {testimonies.map((t) => {
                const answersObj = (t.answers as Record<string, unknown>) || {};
                const isChecked = selectedIds.includes(t.id);

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTestimonyId(t.id)}
                    className={`hover:bg-lamp-amber/10 cursor-pointer transition-colors ${
                      isChecked ? 'bg-lamp-amber/15' : ''
                    }`}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectOne(t.id)}
                        className="accent-lamp-amber cursor-pointer rounded"
                      />
                    </td>
                    <td className="p-3 font-typewriter text-fog-grey whitespace-nowrap">
                      {new Date(t.submittedAt).toLocaleString()}
                    </td>

                    {inputClues.map((clue) => {
                      const val = answersObj[clue.id];
                      return (
                        <td key={clue.id} className="p-3 max-w-[200px] truncate">
                          {clue.type === 'fileUpload' && val ? (
                            <a
                              href={`/api/files/${val}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-lamp-amber underline flex items-center gap-1 font-typewriter"
                            >
                              📎 Attachment
                            </a>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      );
                    })}

                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => deleteSingleMutation.mutate({ id: t.id })}
                        className="text-string-red hover:bg-string-red/20 p-1 px-2 rounded font-typewriter text-xs transition-colors"
                        title="Delete Testimony"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No Witnesses Have Come Forward Yet"
          description="Your case file is active, but no sworn depositions have been filed. Distribute your Case Link to gather testimony."
        />
      )}

      {/* Row-Click Witness Statement Drawer Modal */}
      <Modal
        isOpen={!!selectedTestimonyId}
        onClose={() => setSelectedTestimonyId(null)}
        title="SWORN WITNESS STATEMENT DEPOSITION"
      >
        {drawerTestimony ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <Stamp text="OFFICIAL DEPOSITION" variant="amber" rotation="left" size="sm" />
              <span className="font-typewriter text-xs text-fog-grey">
                Filed: {new Date(drawerTestimony.submittedAt).toLocaleString()}
              </span>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {drawerTestimony.clues
                .filter((c) => c.type !== 'statement')
                .map((clue) => {
                  const val = (drawerTestimony.answers as Record<string, unknown>)[clue.id];

                  return (
                    <Card key={clue.id} tabTitle={clue.label.toUpperCase()}>
                      <div className="font-serif text-sm font-bold text-lamp-amber mb-1">
                        {clue.label}
                      </div>

                      <div className="font-sans text-xs text-primary">
                        {clue.type === 'fileUpload' && val ? (
                          <a
                            href={`/api/files/${val}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-lamp-amber text-lamp-amber font-typewriter text-xs hover:bg-lamp-amber/20 transition-colors"
                          >
                            📎 Download Attached Evidence File
                          </a>
                        ) : typeof val === 'object' ? (
                          <pre className="font-mono text-xs bg-surface p-2 rounded">{JSON.stringify(val, null, 2)}</pre>
                        ) : (
                          <p className="whitespace-pre-wrap">{String(val ?? 'No response provided.')}</p>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
      </Modal>

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
