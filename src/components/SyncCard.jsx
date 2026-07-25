import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { signIn, signUp } from '../lib/supabaseSync.js'

// Full cloud-sync panel for Settings: connection state, sign in / out, manual
// sync and – when both sides moved – an explicit conflict resolution.
export default function SyncCard() {
  const { sync, t, lang } = useStore()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  // Explicit choice instead of two similar-looking buttons: on a brand-new
  // project "sign in" can only ever fail, which reads as a broken login.
  const [mode, setMode] = useState('in') // 'in' = sign in, 'up' = create account

  if (!sync) return null

  // No Supabase project wired in: say so plainly instead of showing dead controls.
  if (!sync.cloudConfigured) {
    return (
      <section className="card">
        <h3 className="card-title">{t('cloudSync')}</h3>
        <p className="sync-line off"><span className="sync-dot" />{t('sync_notConfigured')}</p>
        <p className="muted small">{t('sync_notConfiguredHint')}</p>
      </section>
    )
  }

  const { state, user, error, lastSyncedAt, pendingChanges } = sync
  const when = lastSyncedAt ? new Date(lastSyncedAt) : null
  const whenStr = when && !isNaN(when) ? when.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB') : '–'

  // Supabase reports raw English API errors; translate the ones a user can
  // actually act on, and say WHAT to do rather than what went wrong.
  const explain = (e) => {
    const raw = String(e?.message || '')
    if (/invalid login credentials/i.test(raw)) return t('sync_errNoAccount')
    if (/email not confirmed/i.test(raw)) return t('sync_errNotConfirmed')
    if (/signups? not allowed|signup is disabled/i.test(raw)) return t('sync_errSignupOff')
    if (/already registered|already exists/i.test(raw)) return t('sync_errExists')
    if (/password/i.test(raw) && /6|short|least/i.test(raw)) return t('sync_errPassword')
    if (/unable to validate email|invalid format/i.test(raw)) return t('sync_errEmail')
    if (/failed to fetch|networkerror|load failed/i.test(raw)) return t('sync_errNetwork')
    return raw || t('sync_signInErr')
  }

  const doAuth = async () => {
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'up') {
        await signUp(email.trim(), pw)
        setMsg({ ok: true, text: t('sync_signUpOk') })
      } else {
        await signIn(email.trim(), pw)
        setMsg({ ok: true, text: t('sync_signInOk') })
      }
      setPw('')
    } catch (e) {
      setMsg({ ok: false, text: explain(e) })
      // Wrong door: offer the other one straight away.
      if (mode === 'in' && /invalid login credentials/i.test(String(e?.message || ''))) setMode('up')
      if (mode === 'up' && /already registered|already exists/i.test(String(e?.message || ''))) setMode('in')
    } finally {
      setBusy(false)
    }
  }

  const STATE_KEY = {
    signedOut: 'sync_signedOut',
    offline: 'sync_offline',
    syncing: 'sync_syncing',
    synced: 'sync_synced',
    error: 'sync_error',
    conflict: 'sync_conflict'
  }
  const STATE_CLS = {
    signedOut: 'off', offline: 'warn', syncing: 'busy', synced: 'ok', error: 'err', conflict: 'warn'
  }

  return (
    <section className="card">
      <h3 className="card-title">{t('cloudSync')}</h3>

      <p className={'sync-line ' + (STATE_CLS[state] || 'off')}>
        <span className="sync-dot" />
        {t(STATE_KEY[state] || 'sync_signedOut')}
        {user && <span className="muted small"> · {user.email}</span>}
      </p>
      {state !== 'signedOut' && (
        <p className="muted small">
          {t('sync_lastSync')}: {whenStr}
          {pendingChanges ? ' · ' + t('sync_pending') : ''}
        </p>
      )}
      {state === 'error' && error && <p className="inline-msg err">{error}</p>}

      {/* Both sides changed since the last agreement – the user picks a side. */}
      {state === 'conflict' && (
        <div className="sync-conflict">
          <p className="inline-msg err">⚠ {t('sync_conflictHint')}</p>
          <div className="btn-row">
            <button className="btn btn-primary" disabled={busy} onClick={() => sync.keepLocal()}>
              {t('sync_keepLocal')}
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => sync.takeRemote()}>
              {t('sync_takeRemote')}
            </button>
          </div>
        </div>
      )}

      {!user ? (
        <div className="sync-auth">
          <div className="seg-toggle" role="group" aria-label={t('sync_mode')}>
            <button
              className={'seg-btn' + (mode === 'in' ? ' active' : '')}
              aria-pressed={mode === 'in'}
              onClick={() => { setMode('in'); setMsg(null) }}
            >
              {t('sync_signIn')}
            </button>
            <button
              className={'seg-btn' + (mode === 'up' ? ' active' : '')}
              aria-pressed={mode === 'up'}
              onClick={() => { setMode('up'); setMsg(null) }}
            >
              {t('sync_signUp')}
            </button>
          </div>
          <p className="muted small">{mode === 'up' ? t('sync_signUpHint') : t('sync_signInHint')}</p>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">{t('p_email')}</span>
              <input
                className="input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">{t('sync_password')}</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && email && pw) doAuth() }}
              />
            </label>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" disabled={busy || !email || !pw} onClick={doAuth}>
              {busy ? '…' : mode === 'up' ? t('sync_createAccount') : t('sync_signIn')}
            </button>
          </div>
        </div>
      ) : (
        <div className="btn-row">
          <button className="btn btn-primary" disabled={state === 'syncing'} onClick={() => sync.syncNow()}>
            ↻ {t('sync_now')}
          </button>
          <button className="btn btn-ghost" onClick={() => sync.disconnect()}>{t('sync_signOut')}</button>
        </div>
      )}

      {msg && <p className={'inline-msg ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>}
      <p className="muted small">{t('sync_note')}</p>
    </section>
  )
}
