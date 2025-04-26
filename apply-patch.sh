#!/usr/bin/env bash
set -euo pipefail

PATCH="split-menus.patch"
LOG="patch-apply.log"

# helper to timestamp + tee
log(){ echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')] $*" | tee -a "$LOG"; }

# start fresh
: > "$LOG"

log "🔍 Checking that patch file exists"
if [[ ! -f "$PATCH" ]]; then
  log "❌ Patch file '$PATCH' not found!"
  exit 1
fi

log "🛠️  Running dry-run"
if patch --dry-run --verbose -p1 < "$PATCH" >> "$LOG" 2>&1; then
  log "✅ Dry-run succeeded"
else
  log "❌ Dry-run failed—see above for details"
  exit 2
fi

log "🚀 Applying patch"
if patch -p1 < "$PATCH" >> "$LOG" 2>&1; then
  log "✅ Patch applied successfully!"
else
  log "❌ Patch apply failed—see above for details"
  exit 3
fi
