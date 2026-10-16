'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchSystemSettings,
  updateSystemSetting,
  fetchFeatureFlags,
  updateFeatureFlag,
  type SystemSettingItem,
  type FeatureFlagItem,
} from '../../../lib/adminApi'
import { usePermissions } from '../../../hooks/usePermissions'
import { Modal, Button, Badge, Alert, Spinner } from '@marketplace/ui'

export default function SystemSettingsPage() {
  const { can } = usePermissions()

  const [activeTab, setActiveTab] = useState<'settings' | 'flags'>('settings')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Settings State
  const [settings, setSettings] = useState<SystemSettingItem[]>([])
  const [groupFilter, setGroupFilter] = useState<string>('')

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagItem[]>([])
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  // Edit Setting Modal State
  const [editSetting, setEditSetting] = useState<SystemSettingItem | null>(null)
  const [editSettingValue, setEditSettingValue] = useState<string>('')
  const [savingSetting, setSavingSetting] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchSystemSettings(groupFilter || undefined)
      setSettings(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load system settings.')
    } finally {
      setLoading(false)
    }
  }, [groupFilter])

  const loadFeatureFlags = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchFeatureFlags()
      setFeatureFlags(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flags.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings()
    } else {
      loadFeatureFlags()
    }
  }, [activeTab, loadSettings, loadFeatureFlags])

  // Toggle Feature Flag
  async function handleToggleFeatureFlag(flag: FeatureFlagItem) {
    if (!can('feature_flags.manage')) return
    setError(null)
    setTogglingKey(flag.key)

    try {
      const nextState = !flag.enabled
      await updateFeatureFlag(flag.key, nextState)
      setFeatureFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, enabled: nextState } : f)),
      )
      setSuccessMessage(`Feature '${flag.name}' ${nextState ? 'enabled' : 'disabled'}.`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle feature flag.')
    } finally {
      setTogglingKey(null)
    }
  }

  // Open Edit Setting Modal
  function handleOpenEditSetting(item: SystemSettingItem) {
    setEditSetting(item)
    const formatted =
      typeof item.value === 'object'
        ? JSON.stringify(item.value, null, 2)
        : String(item.value)
    setEditSettingValue(formatted)
  }

  // Save Setting Value
  async function handleSaveSetting(e: React.FormEvent) {
    e.preventDefault()
    if (!editSetting) return
    setError(null)
    setSavingSetting(true)

    try {
      let parsedValue: any = editSettingValue
      try {
        parsedValue = JSON.parse(editSettingValue)
      } catch {
        // Keep string if not valid JSON
      }

      await updateSystemSetting(editSetting.key, parsedValue)
      setSuccessMessage(`System setting '${editSetting.key}' updated successfully.`)
      setEditSetting(null)
      loadSettings()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save setting.')
    } finally {
      setSavingSetting(false)
    }
  }

  // Group settings by group name
  const groupedSettings = settings.reduce<Record<string, SystemSettingItem[]>>((acc, s) => {
    const groupName = s.group || 'general'
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Settings & Feature Flags
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure core marketplace parameters, system-wide security thresholds, and runtime switches.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            System Configuration
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition ${
              activeTab === 'flags'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Feature Flags & Circuit Breakers ({featureFlags.length})
          </button>
        </nav>
      </div>

      {/* ── TAB 1: SYSTEM SETTINGS ───────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Setting Groups</option>
              <option value="marketplace">Marketplace</option>
              <option value="security">Security & Sessions</option>
              <option value="communication">Communication</option>
              <option value="notifications">Notifications</option>
              <option value="media">Media & Storage</option>
              <option value="search">Search & Indexing</option>
            </select>

            <Button variant="ghost" onClick={loadSettings} disabled={loading}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Spinner className="mx-auto h-6 w-6" />
              <span className="mt-2 block">Loading platform settings...</span>
            </div>
          ) : Object.keys(groupedSettings).length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
              No configuration settings found.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSettings).map(([group, items]) => (
                <div key={group} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="border-b border-border bg-muted/40 px-6 py-4">
                    <h3 className="font-semibold text-foreground uppercase tracking-wider text-xs">
                      {group.replace(/_/g, ' ')} Group
                    </h3>
                  </div>

                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 hover:bg-muted/20 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">{item.key}</span>
                            {item.isPublic && (
                              <Badge variant="secondary">Public</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <div className="pt-1 text-[11px] text-muted-foreground">
                            Last updated {new Date(item.updatedAt).toLocaleString()}
                            {item.updatedBy && ` by ${item.updatedBy.displayName}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="rounded-xl border border-border bg-muted/30 px-3 py-1.5 font-mono text-xs max-w-xs overflow-hidden text-ellipsis">
                            {typeof item.value === 'object'
                              ? JSON.stringify(item.value)
                              : String(item.value)}
                          </div>

                          {can('settings.manage') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditSetting(item)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: FEATURE FLAGS ─────────────────────────────────────────────── */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Feature flags provide runtime toggles for marketplace features without requiring redeployment.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureFlags.map((flag) => {
              const isToggling = togglingKey === flag.key
              return (
                <div
                  key={flag.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{flag.name}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          flag.enabled
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            flag.enabled ? 'bg-emerald-500' : 'bg-muted-foreground'
                          }`}
                        />
                        {flag.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>

                    <p className="font-mono text-xs text-muted-foreground">{flag.key}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {flag.description || 'Controls feature availability across user interfaces.'}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Updated {new Date(flag.updatedAt).toLocaleDateString()}
                    </span>

                    {can('feature_flags.manage') && (
                      <Button
                        size="sm"
                        variant={flag.enabled ? 'destructive' : 'primary'}
                        onClick={() => handleToggleFeatureFlag(flag)}
                        disabled={isToggling}
                      >
                        {isToggling ? (
                          <Spinner size="sm" />
                        ) : flag.enabled ? (
                          'Disable Flag'
                        ) : (
                          'Enable Flag'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT SETTING ──────────────────────────────────────────────── */}
      <Modal
        open={Boolean(editSetting)}
        onClose={() => setEditSetting(null)}
        title={`Edit Setting: ${editSetting?.key}`}
      >
        <form onSubmit={handleSaveSetting} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Modifying platform configuration directly impacts marketplace runtime behaviors. Modifications are logged to immutable security audit trails.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground">Value (JSON or Scalar)</label>
            <textarea
              value={editSettingValue}
              onChange={(e) => setEditSettingValue(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-input bg-background p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setEditSetting(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingSetting}>
              {savingSetting ? 'Saving...' : 'Apply Setting'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
