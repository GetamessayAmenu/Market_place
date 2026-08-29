'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Input, Skeleton } from '@marketplace/ui';
import { fetchMyDisputes, type Dispute } from '@/lib/disputesApi';
import { DisputeModal } from '@/components/disputes/DisputeModal';

export default function UserDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadDisputes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchMyDisputes({
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        setDisputes(res.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load disputes');
      } finally {
        setLoading(false);
      }
    }

    loadDisputes();
  }, [statusFilter]);

  const filteredDisputes = disputes.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.ticketNumber.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning">OPEN</Badge>;
      case 'under_review':
        return <Badge variant="info">UNDER REVIEW</Badge>;
      case 'waiting_for_info':
      case 'waiting_for_information':
      case 'awaiting_response':
        return <Badge variant="warning">WAITING FOR INFO</Badge>;
      case 'escalated':
        return <Badge variant="error">ESCALATED</Badge>;
      case 'resolved':
        return <Badge variant="success">RESOLVED</Badge>;
      case 'closed':
        return <Badge variant="default">CLOSED</Badge>;
      default:
        return <Badge variant="default">{status.toUpperCase()}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <Badge variant="error">{priority.toUpperCase()}</Badge>;
      case 'medium':
        return <Badge variant="warning">MEDIUM</Badge>;
      default:
        return <Badge variant="default">{priority.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Center</h1>
          <p className="text-sm text-gray-500">Track and manage your filed disputes and resolution requests.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>File New Dispute</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['all', 'open', 'under_review', 'waiting_for_info', 'escalated', 'resolved', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search ticket # or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl">
            ⚖️
          </div>
          <h3 className="text-base font-bold text-gray-800">No Disputes Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {statusFilter === 'all'
              ? "You haven't filed or received any disputes yet."
              : `No disputes found under status '${statusFilter}'.`}
          </p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>Report an Issue</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {dispute.ticketNumber}
                  </span>
                  {getStatusBadge(dispute.status)}
                  {getPriorityBadge(dispute.priority)}
                  {dispute.category && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                      {dispute.category.name}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-gray-900 leading-snug">{dispute.title}</h3>

                <p className="text-xs text-gray-600 line-clamp-2">{dispute.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                  <span>Filed: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                  {dispute.reportedUser && (
                    <span>Against: <strong className="text-gray-700">{dispute.reportedUser.displayName}</strong></span>
                  )}
                  {dispute.listing && (
                    <span>Item: <strong className="text-gray-700">{dispute.listing.title}</strong></span>
                  )}
                  {dispute.order && (
                    <span>Order: <strong className="text-gray-700">{dispute.order.orderNumber}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <Link href={`/dashboard/disputes/${dispute.id}`}>
                  <Button variant="outline" size="sm">View Details &rarr;</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* General Dispute Filing Modal */}
      <DisputeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
