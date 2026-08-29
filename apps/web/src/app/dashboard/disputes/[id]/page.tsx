'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Input, Skeleton, Textarea } from '@marketplace/ui';
import { addDisputeComment, addEvidence, fetchDispute, type Dispute } from '@/lib/disputesApi';

export default function UserDisputeDetailPage({ params }: { params: { id: string } }) {
  const disputeId = params.id;
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState<string>('');
  const [commenting, setCommenting] = useState<boolean>(false);

  const [newEvidenceUrl, setNewEvidenceUrl] = useState<string>('');
  const [uploadingEvidence, setUploadingEvidence] = useState<boolean>(false);

  const refreshData = async () => {
    if (!disputeId) return;
    try {
      const data = await fetchDispute(disputeId);
      setDispute(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dispute details');
    }
  };

  useEffect(() => {
    if (disputeId) {
      setLoading(true);
      setError(null);
      fetchDispute(disputeId)
        .then((data) => setDispute(data))
        .catch((err: any) => setError(err?.message || 'Failed to load dispute details'))
        .finally(() => setLoading(false));
    }
  }, [disputeId]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !dispute) return;
    setCommenting(true);
    try {
      await addDisputeComment(dispute.id, newComment.trim());
      setNewComment('');
      await refreshData();
    } catch (err: any) {
      alert(err?.message || 'Failed to send message');
    } finally {
      setCommenting(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!newEvidenceUrl.trim() || !dispute) return;
    setUploadingEvidence(true);
    try {
      await addEvidence(dispute.id, { fileUrl: newEvidenceUrl.trim() });
      setNewEvidenceUrl('');
      await refreshData();
    } catch (err: any) {
      alert(err?.message || 'Failed to add evidence');
    } finally {
      setUploadingEvidence(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error || 'Dispute not found'}</Alert>
        <Link href="/dashboard/disputes">
          <Button variant="outline">&larr; Back to Disputes</Button>
        </Link>
      </div>
    );
  }

  const isWaitingForInfo = dispute.status === 'waiting_for_info' || dispute.status === 'waiting_for_information' || dispute.status === 'awaiting_response';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/disputes">
          <Button variant="ghost" size="sm">&larr; Back to Disputes</Button>
        </Link>
        <span className="text-xs text-gray-500 font-mono">ID: {dispute.id}</span>
      </div>

      {/* Case Header Banner */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                {dispute.ticketNumber}
              </span>
              <Badge variant={dispute.status === 'resolved' ? 'success' : dispute.status === 'escalated' ? 'error' : 'warning'}>
                {dispute.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              <Badge variant="default">{dispute.priority.toUpperCase()}</Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-2">{dispute.title}</h1>
          </div>

          <div className="text-xs text-gray-500 text-right">
            <div>Filed: {new Date(dispute.createdAt).toLocaleDateString()}</div>
            {dispute.category && <div>Category: <strong className="text-gray-700">{dispute.category.name}</strong></div>}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Issue Description</h4>
          <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg border whitespace-pre-wrap">{dispute.description}</p>
        </div>

        {/* Action Required Alert */}
        {isWaitingForInfo && (
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-lg text-amber-900 space-y-2">
            <h4 className="font-bold text-sm flex items-center gap-2">
              ⚠️ Information Requested by Moderation Team
            </h4>
            <p className="text-xs">
              An admin has requested additional details or supporting documents regarding your case. Please reply in the communication thread below or attach extra evidence.
            </p>
          </div>
        )}

        {/* Resolution Banner */}
        {(dispute.status === 'resolved' || dispute.status === 'closed') && (
          <div className="bg-green-50 border border-green-300 p-4 rounded-lg text-green-900 space-y-2">
            <h4 className="font-bold text-sm flex items-center gap-2">
              ✓ Case Resolution Summary
            </h4>
            {dispute.resolutionOutcome && (
              <div className="text-xs">
                <strong>Decision: </strong> {dispute.resolutionOutcome.replace(/_/g, ' ')}
              </div>
            )}
            {dispute.resolutionReason && (
              <div className="text-xs">
                <strong>Reason: </strong> {dispute.resolutionReason}
              </div>
            )}
            {dispute.resolvedAt && (
              <div className="text-[10px] text-green-700">
                Resolved on: {new Date(dispute.resolvedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Related Items Context */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          {dispute.listing && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <span className="font-semibold text-gray-500 block">Related Listing</span>
              <span className="font-bold text-gray-800 truncate block">{dispute.listing.title}</span>
            </div>
          )}
          {dispute.order && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <span className="font-semibold text-gray-500 block">Related Order</span>
              <span className="font-bold text-gray-800 font-mono">{dispute.order.orderNumber}</span>
            </div>
          )}
          {dispute.rental && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <span className="font-semibold text-gray-500 block">Related Rental</span>
              <span className="font-bold text-gray-800 font-mono">{dispute.rental.orderNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Evidence & Communication & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Communication & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence Attachments */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b pb-2 flex items-center justify-between">
              <span>Evidence & Supporting Files</span>
              <span className="text-xs text-gray-500 font-normal">{dispute.evidence?.length || 0} file(s)</span>
            </h3>

            {dispute.evidence && dispute.evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dispute.evidence.map((item) => (
                  <a
                    key={item.id}
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 border rounded-lg hover:border-primary transition-colors bg-gray-50 block space-y-1"
                  >
                    <div className="text-xs font-semibold text-gray-800 truncate">
                      📎 {item.fileName || 'Evidence File'}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{item.fileUrl}</div>
                    <div className="text-[10px] text-gray-400">
                      Uploaded by {item.uploader?.displayName || 'User'} on {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No files attached yet.</p>
            )}

            {/* Add Evidence Form */}
            {dispute.status !== 'closed' && (
              <div className="pt-3 border-t space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Add Supporting Photo/File URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={newEvidenceUrl}
                    onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddEvidence} loading={uploadingEvidence}>Upload</Button>
                </div>
              </div>
            )}
          </div>

          {/* Communication Thread */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b pb-2">
              Case Messages & Responses
            </h3>

            {dispute.comments && dispute.comments.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {dispute.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg text-xs space-y-1 border ${
                      comment.author.id === dispute.reporterId
                        ? 'bg-blue-50 border-blue-200 ml-4'
                        : 'bg-gray-50 border-gray-200 mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-center font-semibold text-gray-700">
                      <span>{comment.author.displayName}</span>
                      <span className="text-[10px] font-normal text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No messages in thread yet.</p>
            )}

            {/* Send Comment Form */}
            {dispute.status !== 'closed' && (
              <div className="pt-3 border-t space-y-2">
                <Textarea
                  rows={3}
                  placeholder="Type a message or reply to moderation..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSendComment} loading={commenting}>Send Message</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Event History Timeline */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b pb-2">
              Case Timeline
            </h3>

            {dispute.history && dispute.history.length > 0 ? (
              <div className="relative border-l border-gray-200 ml-3 space-y-4">
                {dispute.history.map((event) => (
                  <div key={event.id} className="mb-4 ml-4">
                    <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-1.5 border border-white mt-1"></div>
                    <div className="text-xs font-bold text-gray-800">{event.action.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-gray-400">{new Date(event.createdAt).toLocaleString()}</div>
                    {event.note && <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border">{event.note}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No history events yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
