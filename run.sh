#!/usr/bin/env bash
# One entry point for running and testing Germany View.
#
#   ./run.sh          set up, then start backend + frontend
#   ./run.sh test     set up, then run every check CI runs (lint, tests, type-checks, build)
#   ./run.sh setup    only check prerequisites, install dependencies, create .env files
#   ./run.sh help
#
# Options: --clean (reinstall dependencies from the lockfiles).
set -euo pipefail
cd "$(dirname "$0")"

if [ -t 1 ]; then BOLD=$'\e[1m'; RED=$'\e[31m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RESET=$'\e[0m'
else BOLD=""; RED=""; GREEN=""; YELLOW=""; RESET=""; fi
say()  { echo "${BOLD}▸ $*${RESET}"; }
warn() { echo "${YELLOW}! $*${RESET}"; }
die()  { echo "${RED}✗ $*${RESET}" >&2; exit 1; }

COMMAND="start"; CLEAN=false
for arg in "$@"; do
  case "$arg" in
    start|test|setup|help) COMMAND="$arg" ;;
    --clean) CLEAN=true ;;
    -h|--help) COMMAND="help" ;;
    *) die "Unknown argument: $arg (see ./run.sh help)" ;;
  esac
done

# ---------- setup ----------

check_prerequisites() {
  command -v node >/dev/null || die "Node.js not found. Install Node.js 20 or newer (https://nodejs.org)."
  command -v npm >/dev/null || die "npm not found (it comes with Node.js)."
  local major
  major=$(node -p 'process.versions.node.split(".")[0]')
  [ "$major" -ge 20 ] || die "Node.js $(node -v) is too old: 20 or newer is needed."
}

ensure_env_files() {
  local f
  for f in .env server/.env; do
    if [ ! -f "$f" ]; then
      cp "$f.example" "$f"
      warn "Created $f from $f.example."
    fi
  done
}

# Installs a folder's dependencies when they're missing or older than its lockfile.
# Without a lockfile yet (first run), `npm install` creates one.
ensure_dependencies() {
  local dir="$1" stamp="$1/node_modules/.package-lock.json"
  if [ ! -f "$dir/package-lock.json" ]; then
    say "Installing dependencies in $dir/ (npm install: no lockfile yet)"
    (cd "$dir" && npm install --no-audit --no-fund)
  elif $CLEAN || [ ! -f "$stamp" ] || [ "$dir/package-lock.json" -nt "$stamp" ]; then
    say "Installing dependencies in $dir/ (npm ci)"
    (cd "$dir" && npm ci --no-audit --no-fund)
  fi
}

setup() {
  check_prerequisites
  ensure_env_files
  ensure_dependencies .
  ensure_dependencies server
}

# ---------- start ----------

backend_port() {
  local port
  port=$(grep -E '^PORT=' server/.env 2>/dev/null | tail -1 | cut -d= -f2 | tr -d '[:space:]"' || true)
  echo "${port:-5002}"
}

port_in_use() {
  command -v lsof >/dev/null && lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

start() {
  local port
  port=$(backend_port)
  if port_in_use "$port"; then
    die "Port $port is already in use. Is the app already running? Stop it first."
  fi
  # Not needed by the skeleton yet, but by the pages that come next.
  [ -d data/raw ] || warn "No data/raw/: the pages will need it once they show data. See data/README.md."
  ls data/map/*.pmtiles >/dev/null 2>&1 || warn "No offline basemap in data/map/. Get it with: npm run map:download"
  say "Starting backend (http://localhost:$port) and frontend (Vite prints its URL, usually http://localhost:5173). Stop with Ctrl+C."
  exec npm run startDev
}

# ---------- test ----------

RESULTS=()
FAILED=0

step() {
  local name="$1"; shift
  say "$name"
  local t0=$SECONDS
  if "$@"; then
    RESULTS+=("${GREEN}✓${RESET} $name ($((SECONDS - t0)) s)")
  else
    RESULTS+=("${RED}✗${RESET} $name ($((SECONDS - t0)) s)")
    FAILED=$((FAILED + 1))
  fi
}

run_tests() {
  step "Frontend: lint"                  npm run lint
  step "Frontend: unit tests"            npm test
  step "Frontend: type-check and build"  npm run build
  step "Server: type-check"              bash -c "cd server && npx tsc --noEmit"
  step "Server: tests"                   bash -c "cd server && npm test"
  echo
  echo "${BOLD}Summary${RESET}"
  printf '  %s\n' "${RESULTS[@]}"
  if [ "$FAILED" -gt 0 ]; then die "$FAILED check(s) failed."; fi
  echo "${GREEN}All checks passed.${RESET}"
}

# ---------- main ----------

case "$COMMAND" in
  help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//' ;;
  setup) setup; say "Setup done." ;;
  start) setup; start ;;
  test) setup; run_tests ;;
esac
