# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
# ลง libc6-compat เพื่อกัน error บางอย่างใน alpine
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# ลง dependencies
RUN npm ci

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ปิด Telemetry ของ Next.js (ประหยัด resource)
ENV NEXT_TELEMETRY_DISABLED 1
# สั่ง Build งาน
RUN npm run build

# --- Stage 3: Runner (Production) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# สร้าง User ใหม่เพื่อความปลอดภัย
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy ไฟล์ที่จำเป็นจาก Stage Builder
# ก๊อปไฟล์ Public
COPY --from=builder /app/public ./public
# ก๊อปไฟล์ Standalone (ตัวเซิร์ฟเวอร์ย่อส่วน)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# ก๊อปไฟล์ Static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Next.js standalone ปกติรันที่ port 3000
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]