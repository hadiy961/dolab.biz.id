#!/bin/sh
#
# Helper deploy dolab.biz.id.
# Portable: Linux, macOS, Windows (Git Bash atau WSL). Hanya POSIX sh,
# tanpa bashism, tanpa sed -i, tanpa readlink -f.
#
# Build dikerjakan GitHub Actions dan sekarang HANYA dipicu dari sini
# atau dari tag rilis. Commit ke main tidak memicu build apa pun.
#
#   ./deploy/deploy.sh status              apa yang jalan di prod + probe publik
#   ./deploy/deploy.sh preview             build di CI, lalu buka di 127.0.0.1:8080
#   ./deploy/deploy.sh preview --local     build di mesin ini (butuh Docker saja)
#   ./deploy/deploy.sh publish             build di CI, push :preview, prod tidak disentuh
#   ./deploy/deploy.sh use <tag>           ganti tag prod (stable|beta|preview|sha-xxx|versi)
#   ./deploy/deploy.sh release <versi>     tag + push -> CI build & rilis
#   ./deploy/deploy.sh local               build+push darurat tanpa CI
#
# Rollback = `use` dengan tag rilis lama, mis. `use 1.0.0-stable`.
set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$REPO"

APP=dolab-web
IMAGE=hadiyatna9/dolab-web
GH_REPO=hadiy961/dolab.biz.id
COMPOSE=deploy/docker-compose.prod.yml
DOCKERFILE=deploy/Dockerfile

PROD_HOST=${PROD_HOST:-manage_56}
PROD_DIR=${PROD_DIR:-/data/web/dolab-web}
PUBLIC_URL=${PUBLIC_URL:-https://dolab.biz.id}
ORIGIN_PORT=${ORIGIN_PORT:-3001}
PREVIEW_PORT=${PREVIEW_PORT:-}
SECRETS=${SECRETS:-/root/.secrets/dockerhub.env}

log() { printf '%s\n' "$*"; }
die() { printf 'FAILED: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "'$1' tidak ada di PATH"; }
sha_short() { git rev-parse --short HEAD 2>/dev/null || echo nogit; }

# Panggil workflow release.yml dengan channel tertentu, lalu tunggu sampai selesai.
dispatch_and_wait() {
  need gh
  channel=$1
  log "== dispatch CI (channel=$channel) di $GH_REPO"
  before=$(gh run list -R "$GH_REPO" --workflow release.yml --limit 1 \
             --json databaseId -q '.[0].databaseId' 2>/dev/null || true)
  gh workflow run release.yml -R "$GH_REPO" -f "channel=$channel" >/dev/null
  i=0
  run_id=
  while [ "$i" -lt 30 ]; do
    candidate=$(gh run list -R "$GH_REPO" --workflow release.yml --limit 1 \
                  --json databaseId -q '.[0].databaseId')
    if [ -n "$candidate" ] && [ "$candidate" != "$before" ]; then run_id=$candidate; break; fi
    i=$((i + 1))
    sleep 2
  done
  [ -n "$run_id" ] || die "run CI tidak muncul; cek manual: gh run list -R $GH_REPO"
  log "    run $run_id, menunggu..."
  if ! gh run watch "$run_id" -R "$GH_REPO" --exit-status >/dev/null; then
    die "CI gagal; lihat: gh run view $run_id -R $GH_REPO --log-failed"
  fi
  log "    CI OK ($IMAGE:$channel)"
}

cmd_status() {
  need ssh
  log "== prod $PROD_HOST"
  ssh "$PROD_HOST" "docker inspect $APP --format '    image  : {{.Config.Image}}'" 2>/dev/null \
    || log "    image  : (container tidak ada)"
  ssh "$PROD_HOST" "docker inspect $APP --format '    status : {{.State.Status}} health={{.State.Health.Status}}'" 2>/dev/null || true
  ssh "$PROD_HOST" "curl -fsS -o /dev/null -w '    origin : %{http_code}\\n' http://127.0.0.1:$ORIGIN_PORT/" \
    || log "    origin : TIDAK MERESPONS"
  curl -fsS -o /dev/null -w "    publik : %{http_code}\n" --max-time 20 "$PUBLIC_URL" \
    || log "    publik : TIDAK MERESPONS"
}

cmd_preview() {
  mode=${1:-ci}
  case "$mode" in
    --local)
      need docker
      log "== build lokal $IMAGE:preview dari $(sha_short)"
      docker build -f "$DOCKERFILE" -t "$IMAGE:preview" .
      ;;
    *)
      dispatch_and_wait preview
      need docker
      log "== tarik $IMAGE:preview"
      docker pull -q "$IMAGE:preview" >/dev/null
      ;;
  esac
  # Port 8080/8081 di mesin ini sudah dipakai layanan lain, jadi port dicari
  # otomatis dari 8090 ke atas. Mau port tetap? PREVIEW_PORT=8095 ./deploy/deploy.sh preview
  docker rm -f "$APP-preview" >/dev/null 2>&1 || true
  port=${PREVIEW_PORT:-8092}
  errfile=${TMPDIR:-/tmp}/preview-$$.log
  n=0
  while :; do
    log "== http://127.0.0.1:$port  (Ctrl-C untuk stop)"
    rc=0
    docker run --rm --name "$APP-preview" -p "127.0.0.1:$port:80" "$IMAGE:preview" 2>"$errfile" || rc=$?
    case "$rc" in
      0) rm -f "$errfile"; break ;;
      130 | 137 | 143)
        # Ctrl-C / container dimatikan dari luar: bukan kegagalan.
        rm -f "$errfile"
        log "    preview dihentikan"
        break
        ;;
    esac
    case "$(cat "$errfile")" in
      *"already allocated"* | *"address already in use"* | *"Bind for"*)
        n=$((n + 1))
        if [ "$n" -ge 20 ]; then
          rm -f "$errfile"
          die "tidak dapat port bebas; set PREVIEW_PORT manual"
        fi
        port=$((port + 1))
        ;;
      *)
        cat "$errfile" >&2
        rm -f "$errfile"
        die "docker run gagal"
        ;;
    esac
  done
}

cmd_publish() {
  dispatch_and_wait preview
  need docker
  docker pull -q "$IMAGE:preview" >/dev/null
  log "== $IMAGE:preview siap"
  docker inspect --format '    digest : {{index .RepoDigests 0}}' "$IMAGE:preview" 2>/dev/null || true
  log "    produksi tidak berubah. Kalau memang mau ini di prod: $0 use preview"
}

cmd_use() {
  tag=${1:-}
  [ -n "$tag" ] || die "usage: use <stable|beta|preview|sha-xxxxxxx|1.0.0-stable>"
  need ssh
  need scp
  log "== prod $PROD_HOST -> :$tag"
  ssh "$PROD_HOST" "mkdir -p $PROD_DIR"
  scp -q "$COMPOSE" "$PROD_HOST:$PROD_DIR/docker-compose.yml"
  ssh "$PROD_HOST" "cd $PROD_DIR && TAG='$tag' docker compose -f docker-compose.yml pull -q && TAG='$tag' docker compose -f docker-compose.yml up -d" >/dev/null
  sleep 5
  cmd_status
}

cmd_release() {
  version=${1:-}
  [ -n "$version" ] || die "usage: release v1.1.0-stable | v1.1.0-beta.1"
  case "$version" in
    v[0-9]*.[0-9]*.[0-9]*-stable | v[0-9]*.[0-9]*.[0-9]*-beta*) : ;;
    *) die "format versi harus vX.Y.Z-stable atau vX.Y.Z-beta.N" ;;
  esac
  { git diff --quiet && git diff --cached --quiet; } || die "working tree kotor; commit dulu"
  if git rev-parse "$version" >/dev/null 2>&1; then die "tag $version sudah ada"; fi
  log "== tag $version di $(sha_short)"
  git tag -a "$version" -m "$version"
  git push origin "$version"
  log "    CI build & rilis tag ini. Setelah selesai: $0 use stable"
}

cmd_local() {
  need docker
  if [ -r "$SECRETS" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$SECRETS"
    set +a
  fi
  [ -n "${DOCKERHUB_USERNAME:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ] \
    || die "kredensial tidak ada: isi $SECRETS atau export DOCKERHUB_USERNAME + DOCKERHUB_TOKEN"
  log "== build+push lokal (jalur darurat, tanpa CI)"
  printf '%s' "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin >/dev/null
  tag=sha-$(sha_short)
  docker build -f "$DOCKERFILE" -t "$IMAGE:$tag" .
  docker push "$IMAGE:$tag"
  log "OK: $IMAGE:$tag"
}

usage() {
  cat <<'EOF'
./deploy/deploy.sh status              apa yang jalan di prod + probe publik
./deploy/deploy.sh preview             build di CI, lalu buka di 127.0.0.1 (PORT)
./deploy/deploy.sh preview --local     build di mesin ini (butuh Docker saja)
./deploy/deploy.sh publish             build di CI, push :preview, prod tidak disentuh
./deploy/deploy.sh use <tag>           ganti tag prod (stable|beta|preview|sha-xxx|versi)
./deploy/deploy.sh release <versi>     tag + push -> CI build & rilis
./deploy/deploy.sh local               build+push darurat tanpa CI
EOF
}

case ${1:-status} in
  status) cmd_status ;;
  preview) shift; cmd_preview "${1:-ci}" ;;
  publish) cmd_publish ;;
  use) shift; cmd_use "${1:-}" ;;
  release) shift; cmd_release "${1:-}" ;;
  local) cmd_local ;;
  help | -h | --help) usage ;;
  *) die "perintah tidak dikenal: $1 (status|preview|publish|use|release|local)" ;;
esac
