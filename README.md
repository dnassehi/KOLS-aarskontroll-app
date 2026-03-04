# kols-arskontroll-app

Browser-basert KOLS-årskontroll som eget program med egen database.

## Hva som er implementert (MVP)
- Innlogging med epost + passord (én bruker per epost)
- Pasientoppslag og opprettelse via **pasient-ID (pseudonym)**
- Opprett ny årskontroll
- "Nytt skjema fra forrige år" med korrekt nullstilling av felt
- Automatisk klassifisering:
  - symptombelastning (CAT/mMRC)
  - risikonivå (eksaserbasjoner/innleggelser)
  - obstruksjonsgrad (FEV1 % pred)
  - behandlingsforslag (trinnvis stabil KOLS)
- Eksport:
  - kompakt journaltekst (copy/paste)
  - enkel PDF

## Ikke-kopierbare felt ved "nytt fra forrige år"
- CAT
- mMRC
- Eksaserbasjoner siste 12 mnd
- FEV1
- FEV1 % pred
- FVC
- FEV1/FVC

## Teknologi
- Next.js (App Router)
- Prisma + PostgreSQL
- Docker Compose

## Struktur

```text
kols-arskontroll-app/
  AGENTS.md
  README.md
  .env.example
  docker-compose.yml
  web/
    src/
    prisma/
    Dockerfile
    .env.example
```

## Kjør lokalt (utvikling)

1. Start database via Docker:
```bash
cd kols-arskontroll-app
cp .env.example .env
docker compose up -d db
```

2. Start app lokalt:
```bash
cd web
cp .env.example .env
pnpm install
pnpm prisma migrate dev --name init
pnpm dev
```

App: `http://localhost:3011`

## Kjør produksjonsnært (Docker)

```bash
cd kols-arskontroll-app
cp .env.example .env
docker compose up -d --build
```

App: `http://localhost:3011`

## API (MVP)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/patients?patientCode=...`
- `POST /api/patients`
- `POST /api/reviews`
- `POST /api/reviews/clone`
- `GET /api/reviews/:id/export/text`
- `GET /api/reviews/:id/export/pdf`

## Feilsøking

### Hvis appen "kaprer" terminalen
`pnpm dev` kjører i forgrunnen. Kjør i bakgrunnen slik:
```bash
cd web
nohup pnpm dev > /tmp/kols-dev.log 2>&1 &
```
Stopp igjen:
```bash
pkill -f "next dev -p 3010"
```

### Hvis databasen ikke kjører
Appen bruker PostgreSQL via `DATABASE_URL` i `web/.env`.
- Med Docker: bruk `docker compose up -d db`
- Uten Docker: bruk lokal Postgres på `localhost:5432` og oppdater `DATABASE_URL`

Eksempel uten Docker:
```env
DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/<db>?schema=public
```

## Viktig
- Dette er beslutningsstøtte. Klinisk skjønn gjelder alltid.
- Sett sterk `AUTH_SECRET` og robuste passord i produksjon.
