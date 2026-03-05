# kols-arskontroll-app

Browser-basert KOLS-årskontroll som eget program med egen database.

## Hva som er implementert
- Innlogging med epost + passord (én bruker per epost)
- Pasientoppslag/opprettelse via **pasient-ID (pseudonym)**
  - eksakt søk + forslag ved delvis treff (pasient-ID/navn)
- Opprett ny årskontroll
- "Nytt skjema fra forrige år" med korrekt nullstilling av felt
- CAT-modul i egen fane (slider 0–5, auto-sum)
  - lagring oppdaterer hovedskjema og lukker CAT-fane automatisk
- Spirometri utvidet med pre-/post-test
  - responstest (SABA/SAMA)
  - reversibilitet (ml og %)
  - FEV1/FVC vises i prosent
- GLI-2012 støtte (pre og post)
  - %pred, z-score, LLN og tydelig status (Under LLN / Innenfor normalområde)
- Utvidede kliniske felter:
  - røykestatus (ja/nei)
  - høyde/vekt/BMI (auto)
  - røntgen thorax måned + år
  - dato for spirometri
  - dato for utfylling
  - fysioterapi (ja/nei)
  - siste rehabiliteringsopphold (år)
  - plan/tiltak (fritekst)
- Automatisk klassifisering og behandlingsforslag
  - symptombelastning (CAT/mMRC)
  - risikonivå (eksaserbasjoner/innleggelser)
  - obstruksjonsgrad
  - forslag inkluderer også røykeslutt, fysioterapi/rehab, ernæring og vaksiner
- Eksport
  - strukturert journaltekst (copy/paste)
  - PDF med samme innhold
  - GLI-oppsummering med 2 desimaler

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

## API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/patients?patientCode=...`
- `GET /api/patients/search?q=...`
- `POST /api/patients`
- `POST /api/reviews`
- `POST /api/reviews/clone`
- `GET /api/reviews/:id`
- `PUT /api/reviews/:id`
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
pkill -f "next dev"
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
