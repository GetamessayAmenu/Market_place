'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  addAdminDisputeComment,
  assignAdminDispute,
  closeAdminDispute,
  escalateAdminDispute,
  fetchAdminDispute,
  reopenAdminDispute,
  requestInfoAdminDispute,
  resolveAdminDispute,
  takeDisputeAction,
  updateAdminDisputeStatus,
  type AdminDispute,
} from '@/lib/adminApi';

export default function AdminDisputeInvestigationPage({ params }: { params: { id: string } }) {
  const disputeId = params.id;
  const [dispute, setDispute] = useState<AdminDispute | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'evidence' | 'messages' | 'history'>('evidence');

  // Modals & Action States
  const [requestInfoOpen, setRequestInfoOpen] = useState<boolean>(false);
  const [infoTarget, setInfoTarget] = useState<'reporter' | 'respondent' | 'both'>('reporter');
  const [infoMessage, setInfoMessage] = useState<string>('');

  const [resolveOpen, setResolveOpen] = useState<boolean>(false);
  const [resolutionOutcome, setResolutionOutcome] = useState<string>('BUYER_SUPPORTED');
  const [resolutionReason, setResolutionReason] = useState<string>('');

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string>('warn_user');
  const [actionReason, setActionReason] = useState<string>('');

  const [reopenOpen, setReopenOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');

  const [newComment, setNewComment] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  const loadDispute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDispute(disputeId);
      setDispute(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dispute investigation workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (disputeId) {
      loadDispute();
    }
  }, [disputeId]);

  const handleAssign = async (adminId: string) => {
    try {
      await assignAdminDispute(disputeId, adminId || null);
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign admin');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateAdminDisputeStatus(disputeId, newStatus);
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
  };

  const handleRequestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoMessage.trim()) return;
    try {
      await requestInfoAdminDispute(disputeId, infoTarget, infoMessage.trim());
      setRequestInfoOpen(false);
      setInfoMessage('');
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to request information');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionReason.trim()) return;
    try {
      await resolveAdminDispute(disputeId, {
        resolutionOutcome,
        resolutionReason: resolutionReason.trim(),
      });
      setResolveOpen(false);
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to resolve dispute');
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionReason.trim()) return;
    try {
      await takeDisputeAction(disputeId, {
        action: actionType,
        reason: actionReason.trim(),
      });
      setActionOpen(false);
      setActionReason('');
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to take action');
    }
  };

  const handleEscalate = async () => {
    if (!confirm('Are you sure you want to escalate this dispute to Senior Moderation?')) return;
    try {
      await escalateAdminDispute(disputeId, 'Escalated by admin for complex review.');
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to escalate dispute');
    }
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this dispute?')) return;
    try {
      await closeAdminDispute(disputeId);
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to close dispute');
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    try {
      await reopenAdminDispute(disputeId, reopenReason.trim());
      setReopenOpen(false);
      setReopenReason('');
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to reopen dispute');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await addAdminDisputeComment(disputeId, {
        content: newComment.trim(),
        isInternal: isInternalNote,
      });
      setNewComment('');
      await loadDispute();
    } catch (err: any) {
      alert(err?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading dispute investigation workspace...</div>;
  }

  if (error || !dispute) {
    return (
      <div className="p-6 space-y-4">
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">{error || 'Dispute not found'}</div>
        <Link href="/admin/disputes" className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded text-xs inline-block">
          &larr; Back to Disputes Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Link href="/admin/disputes" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
            &larr; Dispute Queue
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold font-mono text-gray-900">{dispute.ticketNumber}</h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-800 uppercase">
              {dispute.status.replace(/_/g, ' ')}
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-700 uppercase">
              {dispute.priority}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick Dropdown */}
          <select
            value={dispute.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-xs font-semibold bg-white text-gray-800 shadow-sm"
          >
            <option value="open">Status: OPEN</option>
            <option value="under_review">Status: UNDER REVIEW</option>
            <option value="waiting_for_info">Status: WAITING FOR INFO</option>
            <option value="escalated">Status: ESCALATED</option>
            <option value="resolved">Status: RESOLVED</option>
            <option value="closed">Status: CLOSED</option>
          </select>

          {/* Request Info Button */}
          <button
            onClick={() => setRequestInfoOpen(true)}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100"
          >
            Request Info
          </button>

          {/* Sanction Action Button */}
          <button
            onClick={() => setActionOpen(true)}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100"
          >
            Take Action
          </button>

          {/* Resolve Button */}
          {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
            <button
              onClick={() => setResolveOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm"
            >
              Resolve Dispute
            </button>
          )}

          {/* Reopen Button */}
          {(dispute.status === 'resolved' || dispute.status === 'closed') && (
            <button
              onClick={() => setReopenOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              Reopen Case
            </button>
          )}

          {/* Escalate Button */}
          {dispute.status !== 'escalated' && (
            <button
              onClick={handleEscalate}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-sm"
            >
              Escalate
            </button>
          )}

          {/* Close Button */}
          {dispute.status !== 'closed' && (
            <button
              onClick={handleClose}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Case Overview & Party Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dispute Details */}
        <div className="bg-white border rounded-xl p-4 space-y-2 shadow-sm md:col-span-1">
          <h3 className="text-xs font-bold uppercase text-gray-500">Case Information</h3>
          <div>
            <span className="font-semibold text-gray-700 text-xs block">{dispute.title}</span>
            <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{dispute.description}</p>
          </div>
          <div className="pt-2 text-xs text-gray-500 border-t space-y-1">
            <div>Category: <strong className="text-gray-800">{dispute.category?.name || 'General'}</strong></div>
            <div>Filed Date: <strong className="text-gray-800">{new Date(dispute.createdAt).toLocaleString()}</strong></div>
            <div className="flex items-center justify-between pt-1">
              <span>Assigned Admin: <strong className="text-gray-800">{dispute.assignedAdmin?.displayName || 'Unassigned'}</strong></span>
              <button
                onClick={() => {
                  const adminId = prompt('Enter Admin User ID to assign (leave empty to unassign):', dispute.assignedAdminId || '');
                  if (adminId !== null) handleAssign(adminId.trim());
                }}
                className="text-[10px] text-primary underline font-semibold"
              >
                {dispute.assignedAdminId ? 'Reassign' : 'Assign Self'}
              </button>
            </div>
          </div>
        </div>

        {/* Reporter Card */}
        <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-bold uppercase text-blue-600">Complainant / Reporter</h3>
          <div className="text-xs space-y-1">
            <div className="font-bold text-gray-900 text-sm">{dispute.reporter?.displayName || 'User'}</div>
            <div className="text-gray-500">{dispute.reporter?.email}</div>
            {dispute.reporter?.phone && <div className="text-gray-500">{dispute.reporter.phone}</div>}
            <div className="pt-2">
              <Link href={`/admin/users/${dispute.reporterId}`} className="text-xs text-primary font-semibold hover:underline">
                View User Profile &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Respondent Card */}
        <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-bold uppercase text-purple-600">Respondent / Defending Party</h3>
          <div className="text-xs space-y-1">
            {dispute.reportedUser ? (
              <>
                <div className="font-bold text-gray-900 text-sm">{dispute.reportedUser.displayName}</div>
                <div className="text-gray-500">{dispute.reportedUser.email}</div>
                {dispute.reportedUser.phone && <div className="text-gray-500">{dispute.reportedUser.phone}</div>}
                <div className="pt-2">
                  <Link href={`/admin/users/${dispute.reportedUserId}`} className="text-xs text-primary font-semibold hover:underline">
                    View User Profile &rarr;
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-gray-400 italic">No specific respondent attached</div>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Outcome Banner */}
      {(dispute.status === 'resolved' || dispute.status === 'closed') && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-emerald-900 space-y-1">
          <h4 className="font-bold text-sm">✓ Dispute Resolution Outcome</h4>
          {dispute.resolutionOutcome && <div><strong>Decision: </strong>{dispute.resolutionOutcome.replace(/_/g, ' ')}</div>}
          {dispute.resolutionReason && <div><strong>Reasoning: </strong>{dispute.resolutionReason}</div>}
          {dispute.resolvedBy && <div className="text-xs text-emerald-700">Resolved by: {dispute.resolvedBy.displayName}</div>}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b flex gap-4 text-sm font-semibold text-gray-600">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'evidence' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-900'}`}
        >
          1. Investigation & Evidence ({dispute.evidence?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'messages' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-900'}`}
        >
          2. Messages & Admin Notes ({dispute.comments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-900'}`}
        >
          3. Audit Log & History ({dispute.history?.length || 0})
        </button>
      </div>

      {/* TAB 1: EVIDENCE & CONTEXT */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          {/* Related Item Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dispute.listing && (
              <div className="bg-white p-4 border rounded-xl space-y-1 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase block">Linked Listing</span>
                <span className="font-bold text-gray-900 block truncate">{dispute.listing.title}</span>
                <span className="text-xs text-gray-600">Price: {dispute.listing.price} {dispute.listing.currency || 'ETB'}</span>
              </div>
            )}
            {dispute.order && (
              <div className="bg-white p-4 border rounded-xl space-y-1 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase block">Linked Order</span>
                <span className="font-mono font-bold text-gray-900 block">{dispute.order.orderNumber}</span>
                <span className="text-xs text-gray-600">Status: {dispute.order.status}</span>
              </div>
            )}
            {dispute.rental && (
              <div className="bg-white p-4 border rounded-xl space-y-1 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase block">Linked Rental</span>
                <span className="font-mono font-bold text-gray-900 block">{dispute.rental.orderNumber}</span>
                <span className="text-xs text-gray-600">Total: {dispute.rental.totalAmount} ETB</span>
              </div>
            )}
          </div>

          {/* Evidence Grid */}
          <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-gray-900 border-b pb-2">Uploaded Evidence & Files</h3>
            {dispute.evidence && dispute.evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dispute.evidence.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                    <div className="text-xs font-semibold text-gray-800 truncate">
                      📎 {item.fileName || 'Evidence File'}
                    </div>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary font-mono truncate block underline"
                    >
                      {item.fileUrl}
                    </a>
                    <div className="text-[10px] text-gray-400">
                      Uploaded by {item.uploader?.displayName} on {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No evidence files uploaded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MESSAGES & INTERNAL NOTES */}
      {activeTab === 'messages' && (
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-gray-900 border-b pb-2">Communications & Admin Notes</h3>

          {dispute.comments && dispute.comments.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {dispute.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg text-xs space-y-1 border ${
                    comment.isInternal
                      ? 'bg-amber-50 border-amber-300'
                      : comment.author.id === dispute.reporterId
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center font-semibold text-gray-700">
                    <span>
                      {comment.author.displayName}
                      {comment.isInternal && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-200 text-amber-900 font-bold rounded">INTERNAL ADMIN NOTE</span>}
                    </span>
                    <span className="text-[10px] font-normal text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No comments or notes yet.</p>
          )}

          {/* Add Comment / Internal Note Form */}
          <form onSubmit={handleAddComment} className="pt-4 border-t space-y-3">
            <textarea
              rows={3}
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a message or internal note..."
              className="w-full p-3 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded text-amber-600"
                />
                Make Internal Note (Staff Only)
              </label>

              <button
                type="submit"
                disabled={submittingComment}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90"
              >
                {submittingComment ? 'Posting...' : isInternalNote ? 'Save Internal Note' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY TIMELINE */}
      {activeTab === 'history' && (
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-gray-900 border-b pb-2">Audit History & Event Log</h3>

          {dispute.history && dispute.history.length > 0 ? (
            <div className="relative border-l border-gray-200 ml-4 space-y-4">
              {dispute.history.map((evt) => (
                <div key={evt.id} className="mb-4 ml-4 text-xs">
                  <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-1.5 border border-white mt-1"></div>
                  <div className="font-bold text-gray-900">{evt.action.replace(/_/g, ' ')}</div>
                  <div className="text-[10px] text-gray-400">
                    By {evt.actor?.displayName || 'System'} on {new Date(evt.createdAt).toLocaleString()}
                  </div>
                  {evt.note && <p className="text-gray-700 bg-gray-50 p-2 rounded border mt-1">{evt.note}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No history records found.</p>
          )}
        </div>
      )}

      {/* MODAL: Request Information */}
      {requestInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">Request Information</h3>
            <form onSubmit={handleRequestInfoSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Request Target</label>
                <select
                  value={infoTarget}
                  onChange={(e) => setInfoTarget(e.target.value as any)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="reporter">Complainant / Reporter Only</option>
                  <option value="respondent">Respondent Only</option>
                  <option value="both">Both Parties</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Message / Question</label>
                <textarea
                  rows={4}
                  required
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  placeholder="Specify the information or documents requested..."
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button type="button" onClick={() => setRequestInfoOpen(false)} className="px-3 py-1.5 bg-gray-100 rounded text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-semibold rounded text-xs">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Dispute */}
      {resolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">Resolve Dispute</h3>
            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Resolution Outcome</label>
                <select
                  value={resolutionOutcome}
                  onChange={(e) => setResolutionOutcome(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="BUYER_SUPPORTED">Buyer / Reporter Supported</option>
                  <option value="SELLER_SUPPORTED">Seller / Respondent Supported</option>
                  <option value="MUTUAL_AGREEMENT">Mutual Agreement Reached</option>
                  <option value="POLICY_VIOLATION">Policy Violation Enforced</option>
                  <option value="NO_VIOLATION">No Policy Violation Found</option>
                  <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Resolution Reasoning</label>
                <textarea
                  rows={4}
                  required
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  placeholder="Provide explicit reasoning for this decision..."
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button type="button" onClick={() => setResolveOpen(false)} className="px-3 py-1.5 bg-gray-100 rounded text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded text-xs">
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Moderation Action */}
      {actionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">Take Moderation Action</h3>
            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sanction Action</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="warn_user">Issue Warning to Respondent</option>
                  <option value="suspend_user">Suspend Respondent Account</option>
                  <option value="remove_listing">Archive / Remove Listing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Action Reason</label>
                <textarea
                  rows={3}
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Reason for administrative sanction..."
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button type="button" onClick={() => setActionOpen(false)} className="px-3 py-1.5 bg-gray-100 rounded text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded text-xs">
                  Execute Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reopen Case */}
      {reopenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border shadow-xl">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2">Reopen Dispute Case</h3>
            <form onSubmit={handleReopenSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reopen Reason</label>
                <textarea
                  rows={3}
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explain why this case is being reopened..."
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button type="button" onClick={() => setReopenOpen(false)} className="px-3 py-1.5 bg-gray-100 rounded text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded text-xs">
                  Reopen Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
