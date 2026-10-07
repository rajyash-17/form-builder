'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  caseTitle: string;
}

export function ShareModal({ isOpen, onClose, shareId, caseTitle }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'embed'>('link');
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/c/${shareId}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="650" frameborder="0" style="border: 1px solid rgba(240, 180, 76, 0.3); border-radius: 8px;"></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  // Generate SVG QR code via public Google Chart API / SVG fallback for crisp QR rendering
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    shareUrl
  )}&color=f0b44c&bgcolor=15151a`;

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case-qr-${shareId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📢 Case File Dispatch & Share Link">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-border-color">
          {(
            [
              { id: 'link', label: '🔗 Case Link' },
              { id: 'qr', label: '📱 QR Code' },
              { id: 'embed', label: '💻 iFrame Embed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-typewriter text-xs transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-lamp-amber text-lamp-amber font-bold'
                  : 'border-transparent text-fog-grey hover:text-aged-paper'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Case Link */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <p className="font-typewriter text-xs text-fog-grey">
              Distribute this Case Link to informants to receive sworn witness depositions.
            </p>

            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-xs" />
              <Button variant="primary" onClick={handleCopyLink}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: QR Code Download */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center flex flex-col items-center">
            <p className="font-typewriter text-xs text-fog-grey">
              Informants can scan this barcode with a mobile camera to instantly access the Interrogation Room.
            </p>

            <div className="p-4 bg-[#15151a] border border-lamp-amber/40 rounded-lg shadow-amber-glow inline-block">
              <img
                src={qrImageUrl}
                alt="Case File QR Code"
                className="w-48 h-48 rounded"
              />
            </div>

            <Button variant="primary" size="sm" onClick={handleDownloadQR}>
              💾 Download PNG QR Code
            </Button>
          </div>
        )}

        {/* Tab 3: iFrame Embed Code & Live Preview */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <p className="font-typewriter text-xs text-fog-grey">
              Embed this interactive Case File directly into any external website or portal.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-typewriter text-fog-grey uppercase">
                HTML Embed Code Snippet
              </label>
              <textarea
                value={embedCode}
                readOnly
                rows={3}
                className="w-full p-2.5 rounded text-xs font-mono bg-desk-dark text-lamp-amber border border-border-color focus:border-lamp-amber"
              />
              <Button variant="primary" size="sm" onClick={handleCopyEmbed} className="w-full">
                {embedCopied ? '✓ Embed Code Copied!' : '📋 Copy iFrame Embed Snippet'}
              </Button>
            </div>

            <div className="pt-2 border-t border-border-color">
              <label className="block text-[11px] font-typewriter text-lamp-amber uppercase mb-2">
                Live iFrame Preview
              </label>
              <div className="w-full h-48 rounded border border-border-color overflow-hidden bg-surface/50">
                <iframe src={shareUrl} className="w-full h-full border-0" title={caseTitle} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
