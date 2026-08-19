import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { signIn, signUp } from '../lib/supabaseSync.js'

// Full cloud-sync panel for Settings: connection state, sign in / out, a manual
// sync, and – after the cloud overwrote unpushed local edits – a one-click way
// to bring those edits back.
export default function SyncCard() {
  const { sync, t, lang } = useStore()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  // Explicit choice instead of two similar-looking buttons: on a brand-new
  // project "sign in" can only ever fail, which reads as a broken login.

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

  // Sign in only. Creating an account from here is not possible - see the note
  // in the form - so there is one door and it is the one that works.
  const doAuth = async () => {
    setBusy(true)
    setMsg(null)
    try {
      await signIn(email.trim(), pw)
      setMsg({ ok: true, text: t('sync_signInOk') })
      setPw('')
    } catch (e) {
      setMsg({ ok: false, text: explain(e) })
    } finally {
      setBusy(false)
    }
  }

  const STATE_KEY = {
    signedOut: 'sync_signedOut',
    offline: 'sync_offline',
    syncing: 'sync_syncing',
    synced: 'sync_synced',
    error: 'sync_error'
  }
  const STATE_CLS = {
    signedOut: 'off', offline: 'warn', syncing: 'busy', synced: 'ok', error: 'err'
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
      {/* The engine reports some failures as a translation key rather than a
          raw API string, because they are expected states, not faults. What is
          left is a raw JS message ("TypeError: Failed to fetch" on a dead
          connection), so it goes through the same translator the sign-in form
          uses instead of printing English into a German screen. */}
      {state === 'error' && error && (
        <p className="inline-msg err">{/^sync_/.test(error) ? t(error) : explain({ message: error })}</p>
      )}

      {!user ? (
        <div className="sync-auth">
          {/* No "create account" switch any more.
              Sign-ups are off in the project itself (Supabase → Authentication,
              since 25.07.2026), and that is deliberate: the anon key ships in
              the JavaScript of every deployment, so closed registration is what
              actually keeps strangers out. Offering the button anyway meant the
              only thing it could do was produce an error - so the form says
              plainly how a further device gets in, and how a new account is
              really made. */}
          <p className="muted small">{t('sync_signInHint')}</p>
          <p className="muted small">{t('sync_signUpClosed')}</p>
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
              {busy ? '…' : t('sync_signIn')}
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
