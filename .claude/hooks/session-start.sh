#!/bin/bash
#
# Bring the workspace up to date before any work starts, then make sure the
# dependencies are there.
#
# WHY THIS EXISTS
#
# Sessions for this repository have repeatedly begun on a disk that was frozen
# on 2026-07-27 at commit 93fde92 (v1.35.1), together with the handful of files
# that happened to be half-edited at that moment. The reflog on such a disk
# jumps straight from that commit to the current day - the eighteen versions in
# between were made in other containers, pushed, and never seen here. So it is
# not a checkout that drifted; it is an old snapshot being mounted again.
#
# On its own that is merely stale. What makes it dangerous is the second half:
# the workspace then looks like "a branch with uncommitted changes", and the
# obvious response - commit them - would roll the app back eighteen versions
# and push that over real work.
#
# So this hook does the one repair that is always right, and nothing else:
#   fetch, put anything dirty into a stash (recoverable, never discarded), and
#   fast-forward ONLY. A fast-forward cannot rewrite history and cannot lose a
#   commit; if the branch holds genuine local work the merge refuses and the
#   hook says so instead of forcing anything.
#
# Everything here is idempotent - on an already-current workspace it fetches,
# finds nothing to do and exits.

set -uo pipefail   # NOT -e: a failed fetch must warn, not abort the session

BRANCH="claude/737-instructor-monitoring-dashboard-2ox5gd"
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

say() { echo "[session-start] $*"; }

if [ ! -d .git ]; then
  say "no git repository here - nothing to sync"
  exit 0
fi

CURRENT="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if [ "$CURRENT" != "$BRANCH" ]; then
  say "on '$CURRENT', not the development branch - leaving it alone"
else
  # Retry: the proxy in this environment refuses a connection now and then, and
  # a single failure would leave the session on stale code without saying why.
  FETCHED=""
  for attempt in 1 2 3 4; do
    if git fetch --quiet origin "$BRANCH" 2>/dev/null; then FETCHED="yes"; break; fi
    say "fetch attempt $attempt failed, retrying"
    sleep $((attempt * 2))
  done

  if [ -z "$FETCHED" ]; then
    say "WARNING: could not reach origin. The workspace may be out of date -"
    say "         check 'git log origin/$BRANCH' before trusting what is here."
  else
    LOCAL="$(git rev-parse HEAD)"
    REMOTE="$(git rev-parse "origin/$BRANCH")"
    if [ "$LOCAL" = "$REMOTE" ]; then
      say "already at origin/$BRANCH ($(git log -1 --format=%h))"
    else
      BEHIND="$(git rev-list --count "HEAD..origin/$BRANCH")"
      AHEAD="$(git rev-list --count "origin/$BRANCH..HEAD")"
      say "local $(git log -1 --format=%h) is $BEHIND behind / $AHEAD ahead of origin"

      # Anything dirty goes into a stash BEFORE the fast-forward. Stash, never
      # checkout/reset: if those files ever turn out to be real work they are
      # still there under `git stash list`.
      if [ -n "$(git status --porcelain)" ]; then
        STAMP="session-start-$(date +%s)"
        if git stash push -u -q -m "$STAMP" 2>/dev/null; then
          say "put the dirty working tree aside as stash '$STAMP' (recover with: git stash list)"
        else
          say "WARNING: could not stash the working tree - leaving everything untouched"
          exit 0
        fi
      fi

      # --ff-only on purpose: this can only ever move HEAD forward along the
      # branch that already exists. It cannot rewrite, squash or drop a commit,
      # and it fails loudly rather than merging if the local side has work of
      # its own.
      if git merge --ff-only "origin/$BRANCH" --quiet 2>/dev/null; then
        say "fast-forwarded to $(git log -1 --format='%h %s')"
      else
        say "WARNING: cannot fast-forward - this branch has commits origin does not."
        say "         Left exactly as it was. Reconcile by hand before pushing."
      fi
    fi
  fi
fi

# Dependencies. `install` rather than `ci` so an already-warm node_modules is
# reused; the container image is cached after this hook, so the cost is paid
# once rather than on every session.
if [ -f package.json ]; then
  if npm install --no-audit --no-fund --loglevel=error; then
    say "dependencies ready ($(node -p "require('./package.json').version" 2>/dev/null || echo '?'))"
  else
    say "WARNING: npm install failed - tests and the build will not run"
  fi
fi

exit 0
