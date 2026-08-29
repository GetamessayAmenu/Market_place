"use client";
import React, { useState } from 'react';
import { Button } from '@marketplace/ui';
import { blockUser, reportMessageOrUser, type ChatUser } from '../../lib/chatApi';

interface BlockReportModalProps {
  isOpen: boolean;
  mode: 'block' | 'report';
  targetUser: ChatUser;
  targetMessageId?: string;
  conversationId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  'Off-platform payment scam / request',
  'Inappropriate or abusive language',
  'Fake listing or counterfeit item',
  'Harassment or unwanted contact',
  'Spam or deceptive behavior',
  'Other',
];

export default function BlockReportModal({
  isOpen,
  mode,
  targetUser,
  targetMessageId,
  conversationId,
  onClose,
  onSuccess,
}: BlockReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'block') {
        await blockUser(targetUser.id, reason);
      } else {
        const reportPayload: { targetType: 'user' | 'message'; reportedUserId: string; messageId?: string; conversationId?: string; reason: string; description?: string } = {
          targetType: targetMessageId ? 'message' : 'user',
          reportedUserId: targetUser.id,
          reason: reason || 'Other',
        };
        if (targetMessageId) reportPayload.messageId = targetMessageId;
        if (conversationId) reportPayload.conversationId = conversationId;
        if (description) reportPayload.description = description;

        await reportMessageOrUser(reportPayload);
      }
      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || 'Action failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
        <h3 className="text-lg font-bold text-foreground">
          {mode === 'block' ? `Block ${targetUser.displayName}?` : 'Report Content'}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === 'block'
            ? 'Blocked users will not be able to send you messages or view your direct profile.'
            : `Filing a confidential moderation report regarding ${targetUser.displayName}.`}
        </p>

        {error && (
          <div className="mt-3 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {mode === 'report' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Additional details (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about what happened..."
                rows={3}
                className="w-full rounded-md border bg-background p-2.5 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === 'block' ? 'destructive' : 'primary'}
              size="sm"
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'block' ? 'Block User' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
