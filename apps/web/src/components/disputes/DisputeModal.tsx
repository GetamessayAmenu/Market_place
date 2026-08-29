'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Input, Modal, Select, Textarea } from '@marketplace/ui';
import { createDispute, fetchDisputeCategories, type Dispute, type DisputeCategory } from '@/lib/disputesApi';

export interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: 'listing' | 'order' | 'rental' | 'custom_order' | 'chat' | 'user';
  entityId?: string;
  entityTitle?: string;
  reportedUserId?: string;
  reportedUserName?: string;
}

export function DisputeModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  reportedUserId,
  reportedUserName,
}: DisputeModalProps) {
  const [step, setStep] = useState<'category' | 'details' | 'evidence' | 'review' | 'success'>('category');
  const [categories, setCategories] = useState<DisputeCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [evidenceList, setEvidenceList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdDispute, setCreatedDispute] = useState<Dispute | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDisputeCategories()
        .then((data) => setCategories(data))
        .catch(() => {
          setCategories([
            { id: '1', name: 'Item not as described', slug: 'item-not-as-described' },
            { id: '2', name: 'Fraud / Scam', slug: 'fraud-scam' },
            { id: '3', name: 'Payment disagreement', slug: 'payment-disagreement' },
            { id: '4', name: 'Seller issue', slug: 'seller-issue' },
            { id: '5', name: 'Rental damage / return issue', slug: 'rental-return-issue' },
            { id: '6', name: 'Custom order disagreement', slug: 'custom-order-disagreement' },
            { id: '7', name: 'Other', slug: 'other' },
          ]);
        });

      if (entityTitle) {
        setTitle(`Issue with ${entityType ? entityType.replace('_', ' ') : 'item'}: ${entityTitle}`);
      }
    } else {
      setStep('category');
      setSelectedCategoryId('');
      setTitle('');
      setDescription('');
      setEvidenceList([]);
      setEvidenceUrl('');
      setError(null);
      setCreatedDispute(null);
    }
  }, [isOpen, entityTitle, entityType]);

  const handleAddEvidence = () => {
    if (!evidenceUrl.trim()) return;
    setEvidenceList((prev) => [...prev, evidenceUrl.trim()]);
    setEvidenceUrl('');
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and a detailed description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
        ...(selectedCategory?.slug ? { categorySlug: selectedCategory.slug } : {}),
        ...(reportedUserId ? { reportedUserId } : {}),
        ...(evidenceList.length > 0 ? { evidenceUrls: evidenceList } : {}),
      };

      if (entityType === 'listing' && entityId) payload.listingId = entityId;
      if (entityType === 'order' && entityId) payload.orderId = entityId;
      if (entityType === 'rental' && entityId) payload.rentalId = entityId;
      if (entityType === 'custom_order' && entityId) payload.customOrderId = entityId;
      if (entityType === 'chat' && entityId) payload.conversationId = entityId;
      if (entityType === 'user' && entityId && !reportedUserId) payload.reportedUserId = entityId;

      const dispute = await createDispute(payload);
      setCreatedDispute(dispute);
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={step === 'success' ? 'Dispute Submitted' : 'File a Dispute / Report Issue'}
      size="lg"
    >
      <div className="space-y-6 py-2">
        {step !== 'success' && (
          <div className="flex items-center justify-between border-b pb-3 text-xs font-medium text-gray-500">
            <span className={step === 'category' ? 'text-primary font-bold' : ''}>1. Category</span>
            <span>&rarr;</span>
            <span className={step === 'details' ? 'text-primary font-bold' : ''}>2. Details</span>
            <span>&rarr;</span>
            <span className={step === 'evidence' ? 'text-primary font-bold' : ''}>3. Evidence</span>
            <span>&rarr;</span>
            <span className={step === 'review' ? 'text-primary font-bold' : ''}>4. Review</span>
          </div>
        )}

        {error && <Alert variant="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        {step === 'category' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Dispute Category
              </label>
              <Select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                options={[
                  { value: '', label: '-- Choose a category --' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            {entityTitle && (
              <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600">
                <span className="font-semibold text-gray-800">Related Context: </span>
                {entityType ? entityType.replace('_', ' ').toUpperCase() : 'ITEM'}: {entityTitle}
                {reportedUserName && ` (User: ${reportedUserName})`}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => setStep('details')}>Next &rarr;</Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispute Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Item received is damaged and missing parts"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Explanation</label>
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened in detail, including relevant dates, agreed terms, and attempts to resolve with the other party."
              />
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('category')}>&larr; Back</Button>
              <Button onClick={() => setStep('details')}>Next &rarr;</Button>
            </div>
          </div>
        )}

        {step === 'evidence' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach Evidence / Photos (URLs)</label>
              <p className="text-xs text-gray-500 mb-2">
                Provide image or document URLs showing the issue, receipts, defect photos, or chat screenshots.
              </p>
              <div className="flex gap-2">
                <Input
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or image link"
                />
                <Button variant="secondary" onClick={handleAddEvidence} type="button">Add</Button>
              </div>
            </div>

            {evidenceList.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Added Evidence Items ({evidenceList.length})</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border p-2 rounded-md bg-gray-50">
                  {evidenceList.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 text-xs rounded border">
                      <span className="truncate max-w-md font-mono text-gray-700">{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        className="text-red-600 hover:text-red-800 font-semibold px-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('details')}>&larr; Back</Button>
              <Button onClick={() => setStep('review')}>Review Submission &rarr;</Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-md space-y-2 border">
              <div>
                <span className="font-semibold text-gray-700">Category: </span>
                <span>{categories.find((c) => c.id === selectedCategoryId)?.name || 'General'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Title: </span>
                <span>{title}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Description: </span>
                <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{description}</p>
              </div>
              {evidenceList.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700">Evidence Count: </span>
                  <span>{evidenceList.length} attachment(s)</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 italic">
              Submitting this dispute will notify the moderation team and relevant parties. Both parties will be given an opportunity to present evidence before an admin makes a resolution decision.
            </p>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('evidence')} disabled={loading}>&larr; Back</Button>
              <Button onClick={handleSubmit} loading={loading}>Submit Dispute</Button>
            </div>
          </div>
        )}

        {step === 'success' && createdDispute && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>

            <h3 className="text-lg font-bold text-gray-900">Dispute Submitted Successfully</h3>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm text-blue-900">
              Dispute Ticket ID: <span className="font-mono font-bold">{createdDispute.ticketNumber}</span>
            </div>

            <p className="text-xs text-gray-600 max-w-md mx-auto">
              Your dispute has been logged and assigned to moderation. You can track status updates, add evidence, and communicate with the admin in your Dispute Center.
            </p>

            <div className="flex justify-center gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Link href={`/dashboard/disputes/${createdDispute.id}`}>
                <Button onClick={onClose}>View Dispute Status</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
