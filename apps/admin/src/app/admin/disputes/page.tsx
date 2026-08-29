'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchAdminDisputes,
  fetchAdminDisputeStats,
  fetchDisputeCategories,
  type AdminDispute,
  type AdminDisputeCategory,
  type AdminDisputeStats,
} from '@/lib/adminApi';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stats, setStats] = useState<AdminDisputeStats | null>(null);
  const [categories, setCategories] = useState<AdminDisputeCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  const loadStatsAndCategories = async () => {
    try {
      const [statsRes, catsRes] = await Promise.all([
        fetchAdminDisputeStats().catch(() => null),
        fetchDisputeCategories().catch(() => []),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (catsRes) setCategories(catsRes);
    } catch {
      // Non-fatal
    }
  };

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDisputes({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        categoryId: categoryFilter || undefined,
        search: search || undefined,
        skip: (page - 1) * limit,
        take: limit,
      });
      setDisputes(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch disputes list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndCategories();
  }, []);

  useEffect(() => {
    loadDisputes();
  }, [statusFilter, priorityFilter, categoryFilter, search, page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">OPEN</span>;
      case 'under_review':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">UNDER REVIEW</span>;
      case 'waiting_for_info':
      case 'waiting_for_information':
      case 'awaiting_response':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-800 font-medium">WAITING FOR INFO</span>;
      case 'escalated':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-600 text-white animate-pulse">ESCALATED</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">RESOLVED</span>;
      case 'closed':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-800">{status.toUpperCase()}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-800">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-700">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-600">LOW</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Center & Moderation</h1>
          <p className="text-sm text-gray-500">Investigate marketplace conflicts, enforce policy, and resolve buyer/seller disputes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/disputes/categories"
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border rounded-lg hover:bg-gray-50 shadow-sm"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <span className="text-xs font-semibold text-gray-500 block">Total Cases</span>
            <span className="text-xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 shadow-sm">
            <span className="text-xs font-semibold text-amber-700 block">Open</span>
            <span className="text-xl font-bold text-amber-900">{stats.open}</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-sm">
            <span className="text-xs font-semibold text-blue-700 block">Under Review</span>
            <span className="text-xl font-bold text-blue-900">{stats.underReview}</span>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 shadow-sm">
            <span className="text-xs font-semibold text-purple-700 block">Waiting Info</span>
            <span className="text-xl font-bold text-purple-900">{stats.waitingForInfo}</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 shadow-sm">
            <span className="text-xs font-semibold text-rose-700 block">Escalated</span>
            <span className="text-xl font-bold text-rose-900">{stats.escalated}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700 block">Resolved</span>
            <span className="text-xl font-bold text-emerald-900">{stats.resolved}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border shadow-sm">
            <span className="text-xs font-semibold text-gray-600 block">Avg Time</span>
            <span className="text-xl font-bold text-gray-800">{stats.avgResolutionHours}h</span>
          </div>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">{error}</div>}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search ticket #, title, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-xs w-full md:w-60 focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-md text-xs bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="waiting_for_info">Waiting for Info</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-md text-xs bg-white text-gray-700"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-md text-xs bg-white text-gray-700"
          >
            <option value="">All Categories</option>
            {Array.isArray(categories) && categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 self-end md:self-center">
          Showing {Array.isArray(disputes) ? disputes.length : 0} of {total} cases
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading dispute queue...</div>
        ) : !Array.isArray(disputes) || disputes.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No disputes found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
                <tr>
                  <th className="p-3">Ticket & Title</th>
                  <th className="p-3">Parties (Reporter / Respondent)</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Admin</th>
                  <th className="p-3">Filed Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-800">
                {disputes.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 max-w-xs">
                      <span className="font-mono font-bold text-gray-900 block">{item.ticketNumber}</span>
                      <span className="font-medium text-gray-800 truncate block">{item.title}</span>
                    </td>

                    <td className="p-3 space-y-0.5">
                      <div>
                        <span className="text-gray-400">By: </span>
                        <strong className="text-gray-900">{item.reporter?.displayName || 'User'}</strong>
                      </div>
                      {item.reportedUser && (
                        <div>
                          <span className="text-gray-400">Vs: </span>
                          <strong className="text-gray-900">{item.reportedUser.displayName}</strong>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {item.category ? (
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium">
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">General</span>
                      )}
                    </td>

                    <td className="p-3">{getPriorityBadge(item.priority)}</td>

                    <td className="p-3">{getStatusBadge(item.status)}</td>

                    <td className="p-3">
                      {item.assignedAdmin ? (
                        <span className="font-medium text-gray-700">{item.assignedAdmin.displayName}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold italic">Unassigned</span>
                      )}
                    </td>

                    <td className="p-3 text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/disputes/${item.id}`}
                        className="px-3 py-1.5 bg-primary text-white font-semibold rounded text-xs hover:bg-primary/90 transition-colors inline-block"
                      >
                        Investigate &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="p-3 bg-gray-50 border-t flex justify-between items-center text-xs text-gray-600">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border rounded disabled:opacity-50"
            >
              &larr; Previous
            </button>
            <span>Page {page} of {Math.ceil(total / limit)}</span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-white border rounded disabled:opacity-50"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
