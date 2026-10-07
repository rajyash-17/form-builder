'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';

const ACCENT_PRESETS = [
  { label: 'Lamp Amber', hex: '#f0b44c' },
  { label: 'String Red', hex: '#b3261e' },
  { label: 'Aged Paper', hex: '#e9dfc7' },
  { label: 'Emerald Badge', hex: '#10b981' },
  { label: 'Informant Cyan', hex: '#06b6d4' },
];

export default function CaseSettingsPage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const { data: caseData, isLoading, refetch } = trpc.case.getById.useQuery({ id: caseId });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#f0b44c');
  const [coverBannerUrl, setCoverBannerUrl] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [responseLimit, setResponseLimit] = useState<number | ''>('');
  const [closeDate, setCloseDate] = useState('');
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(true);
  const [notifyEmailOnTestimony, setNotifyEmailOnTestimony] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');

  useEffect(() => {
    if (caseData) {
      setTitle(caseData.title);
      setDescription(caseData.description || '');
      setAccentColor(caseData.settings?.accentColor || '#f0b44c');
      setCoverBannerUrl(caseData.settings?.coverBannerUrl || '');
      setThankYouMessage(caseData.settings?.thankYouMessage || '');
      setRedirectUrl(caseData.settings?.redirectUrl || '');
      setResponseLimit(caseData.settings?.responseLimit || '');
      setCloseDate(caseData.settings?.closeDate || '');
      setAllowMultipleSubmissions(caseData.settings?.allowMultipleSubmissions ?? true);
      setNotifyEmailOnTestimony(caseData.settings?.notifyEmailOnTestimony ?? false);
      setNotificationEmail(caseData.settings?.notificationEmail || '');
    }
  }, [caseData]);

  const updateMutation = trpc.case.update.useMutation({
    onSuccess: () => {
      setToast({ message: 'Case File settings saved successfully.', type: 'success' });
      refetch();
    },
    onError: (err) => {
      setToast({ message: err.message || 'Failed to update settings.', type: 'error' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    updateMutation.mutate({
      id: caseId,
      title,
      description,
      status: caseData.status,
      clues: caseData.clues,
      settings: {
        accentColor,
        coverBannerUrl,
        thankYouMessage,
        redirectUrl,
        responseLimit: typeof responseLimit === 'number' ? responseLimit : undefined,
        closeDate: closeDate || undefined,
        allowMultipleSubmissions,
        notifyEmailOnTestimony,
        notificationEmail,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <Card tabTitle="CASE FILE CONFIGURATION">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Case File Details */}
          <div>
            <h3 className="font-serif text-lg font-bold text-ink-black dark:text-aged-paper mb-1">
              General Case File Details
            </h3>
            <p className="font-typewriter text-xs text-fog-grey mb-4">
              Update official title and background brief for this investigation.
            </p>

            <div className="space-y-4">
              <Input
                label="Case Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Case Brief / Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Theme & Cover Customization */}
          <div className="pt-4 border-t border-border-color">
            <h3 className="font-serif text-lg font-bold text-ink-black dark:text-aged-paper mb-1">
              🎨 Per-Case Theme & Visual Customization
            </h3>
            <p className="font-typewriter text-xs text-fog-grey mb-4">
              Customize accent highlight color and cover header banner for the public Interrogation Room.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-typewriter uppercase tracking-wider text-fog-grey mb-2">
                  Public Form Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setAccentColor(preset.hex)}
                      className={`px-3 py-1.5 rounded font-typewriter text-xs flex items-center gap-2 border transition-all ${
                        accentColor === preset.hex
                          ? 'border-lamp-amber ring-2 ring-lamp-amber/40 font-bold'
                          : 'border-border-color hover:border-lamp-amber'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
                <Input
                  label="Custom Hex Code"
                  type="text"
                  placeholder="#f0b44c"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Cover Banner Image URL (Optional)"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={coverBannerUrl}
                  onChange={(e) => setCoverBannerUrl(e.target.value)}
                />
                {coverBannerUrl && (
                  <div className="mt-2 h-28 w-full rounded overflow-hidden border border-border-color bg-desk-dark/40">
                    <img src={coverBannerUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deposition Limits & Receipts */}
          <div className="pt-4 border-t border-border-color">
            <h3 className="font-serif text-lg font-bold text-ink-black dark:text-aged-paper mb-1">
              ⚖️ Deposition Settings & Intake Controls
            </h3>
            <p className="font-typewriter text-xs text-fog-grey mb-4">
              Configure witness testimony receipt behavior, limits, and expiration date.
            </p>

            <div className="space-y-4">
              <Textarea
                label="Sworn Testimony Receipt Message"
                placeholder="Message displayed to witnesses after submitting sworn testimony..."
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                rows={2}
              />

              <Input
                label="Witness Redirect URL (Optional)"
                type="url"
                placeholder="https://example.com/bureau-thank-you"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Max Testimony Limit (Optional)"
                  type="number"
                  placeholder="e.g. 100"
                  value={responseLimit}
                  onChange={(e) => setResponseLimit(e.target.value ? Number(e.target.value) : '')}
                />

                <Input
                  label="Close Date Expiration (Optional)"
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="allowMultiple"
                  checked={allowMultipleSubmissions}
                  onChange={(e) => setAllowMultipleSubmissions(e.target.checked)}
                  className="w-4 h-4 text-lamp-amber accent-lamp-amber cursor-pointer rounded"
                />
                <label htmlFor="allowMultiple" className="font-typewriter text-xs text-primary cursor-pointer select-none">
                  Allow multiple sworn testimonies from the same informant IP
                </label>
              </div>
            </div>
          </div>

          {/* Email Notification Settings */}
          <div className="pt-4 border-t border-border-color">
            <h3 className="font-serif text-lg font-bold text-ink-black dark:text-aged-paper mb-1">
              📬 Informant Dispatch Email Notifications
            </h3>
            <p className="font-typewriter text-xs text-fog-grey mb-4">
              Receive automatic email alerts whenever a new sworn testimony is submitted.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyEmail"
                  checked={notifyEmailOnTestimony}
                  onChange={(e) => setNotifyEmailOnTestimony(e.target.checked)}
                  className="w-4 h-4 text-lamp-amber accent-lamp-amber cursor-pointer rounded"
                />
                <label htmlFor="notifyEmail" className="font-typewriter text-xs text-primary cursor-pointer select-none">
                  Notify me by email on new sworn testimony receipt
                </label>
              </div>

              {notifyEmailOnTestimony && (
                <Input
                  label="Notification Recipient Email Address"
                  type="email"
                  placeholder="detective@agency.bureau"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  required={notifyEmailOnTestimony}
                />
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border-color">
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving Settings...' : '💾 Save Case Settings'}
            </Button>
          </div>
        </form>
      </Card>

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
