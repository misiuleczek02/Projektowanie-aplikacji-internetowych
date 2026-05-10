FROM node:20-slim

# OpenSSL jest wymagany przez Prisma engine
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalacja zależności (osobny krok dla cache layera)
COPY package.json package-lock.json* ./
RUN npm install

# Schemat Prismy + generowanie klienta
COPY prisma ./prisma
RUN npx prisma generate

# Kod źródłowy
COPY tsconfig.json ./
COPY src ./src

EXPOSE 4000

# Dev mode z hot-reloadem (tsx watch)
CMD ["npm", "run", "dev"]
