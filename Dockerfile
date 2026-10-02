# Prastav production container.
# Next.js 16 app + the proposal engine. Carries a full Chromium (for PDF
# rendering) and the Noto/Indic font stack (so Hindi and other Indic scripts
# render correctly). This one file runs identically on Render, Fly.io or a VPS,
# so the deploy is portable and not locked to any platform.

FROM node:22-bookworm-slim

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Fonts + text shaping. fonts-indic + libharfbuzz are what make Devanagari
# conjuncts and matras render properly in the generated PDF.
RUN apt-get update && apt-get install -y --no-install-recommends \
      fonts-noto-core \
      fonts-noto-ui-core \
      fonts-noto-color-emoji \
      fonts-indic \
      libharfbuzz0b \
      libharfbuzz-icu0 \
      fontconfig \
      ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Node dependencies, lockfile-exact. Includes dev deps (TypeScript, Tailwind)
# which the production build needs.
COPY package.json package-lock.json ./
RUN npm ci

# Chromium and its OS runtime libraries, for the PDF renderer.
RUN npx playwright install --with-deps chromium

# Public config that Next inlines into the browser bundle at build time.
# Render passes these as build args automatically when env vars of the same
# name are set on the service (because the Dockerfile declares them as ARG).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Application source and production build.
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
# Render provides $PORT; bind all interfaces so the platform can reach it.
CMD ["sh", "-c", "node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
