# =============================================================================
# AegisMed AI — Hardened Multi-Stage Dockerfile (sec-0.2)
#
# Pemetaan Risiko (Tugas 1):
#   R01: Kebocoran PHI  — Non-root user, least-privilege filesystem
#   R03: Account Takeover — No shell access in production image
#   R04: DoS — Resource limits applied via compose (mem_limit, cpus)
#   T06: Elevation of Privilege — Dropped Linux capabilities
#
# Kontrol Keamanan Container (sec-0.2):
#   ✅ Pengguna non-root (uid 1001, gid 1001)
#   ✅ Capability Linux dibatasi (drop ALL, add hanya NET_BIND_SERVICE)
#   ✅ Port aplikasi (3000) dan DB (5432) tidak dipublikasikan ke 0.0.0.0
#   ✅ Read-only root filesystem (via compose)
#   ✅ No new privileges flag
# =============================================================================

# ── Stage 1: Dependency installer ─────────────────────────────────────────────
FROM node:22-alpine AS deps
LABEL stage="deps"

WORKDIR /app

# Salin hanya file manifest dependensi terlebih dahulu (layer cache optimal)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Pasang dependensi produksi saja (--omit=dev untuk image lebih kecil)
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

# ── Stage 2: Builder ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
LABEL stage="builder"

WORKDIR /app

# Salin semua dependensi dari stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# ── Stage 3: Production Runner (Hardened) ─────────────────────────────────────
FROM node:22-alpine AS runner
LABEL stage="production"
LABEL maintainer="aegismed-security@example.com"
LABEL org.opencontainers.image.title="AegisMed AI"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.description="Clinical Decision Support System — AegisMed AI"
LABEL security.hardened="true"
LABEL security.milestone="sec-0.2"

# ── Hardening: Buat pengguna non-root khusus (uid/gid 1001) ──────────────────
# R03, T06: Mencegah privilege escalation jika terjadi container breakout
RUN addgroup --system --gid 1001 aegismed \
    && adduser --system --uid 1001 --ingroup aegismed --no-create-home --shell /sbin/nologin aegismed

WORKDIR /app

# Salin artefak build dari stage builder dengan kepemilikan non-root
COPY --from=builder --chown=aegismed:aegismed /app/.next/standalone ./
COPY --from=builder --chown=aegismed:aegismed /app/.next/static ./.next/static
COPY --from=builder --chown=aegismed:aegismed /app/public ./public

# Hardening filesystem: direktori tmp untuk Next.js cache
RUN mkdir -p /tmp/aegismed-cache \
    && chown aegismed:aegismed /tmp/aegismed-cache

# ── Security: Set environment variables ───────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# ── Hardening: Jalankan sebagai pengguna non-root ─────────────────────────────
USER aegismed

# Expose port aplikasi (3000) — tidak di-publish ke 0.0.0.0 oleh default
# Port publish dikontrol di docker-compose.yml via "127.0.0.1:3000:3000"
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# Jalankan server Next.js
CMD ["node", "server.js"]
