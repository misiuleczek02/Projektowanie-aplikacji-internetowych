# Habit Tracker

Aplikacja webowa do budowania i śledzenia codziennych nawyków. Użytkownik tworzy nawyki (np. „Wypij 2L wody", „Czytaj 30 minut"), przypisuje je do kategorii i odznacza ich wykonanie każdego dnia. Aplikacja pokazuje historię i streaki (dni z rzędu).

> Projekt zaliczeniowy z przedmiotu **Projektowanie aplikacji internetowych**

## Spis treści

- [Co aplikacja robi](#co-aplikacja-robi)
- [Architektura](#architektura)
- [Stos technologiczny](#stos-technologiczny)
- [Wymagania](#wymagania)
- [Uruchomienie](#uruchomienie)
- [Struktura repo](#struktura-repo)
- [ADR](#adr)

## Co aplikacja robi

- Rejestracja i logowanie użytkownika.
- Tworzenie nawyków przypisanych do kategorii (np. Zdrowie, Nauka, Produktywność).
- Codzienne odznaczanie wykonania nawyku.
- Widok historii — które dni były odhaczone.

## Architektura

```
┌──────────────┐    HTTP/JSON    ┌──────────────┐    SQL    ┌──────────────┐
│  Frontend    │ ──────────────► │  Backend     │ ────────► │  PostgreSQL  │
│  React+Vite  │ ◄────────────── │  Express+TS  │ ◄──────── │              │
└──────────────┘     JWT token    └──────────────┘            └──────────────┘
```

Trzy warstwy komunikujące się przez sieć kontenerową Dockera. Frontend to czysty SPA serwowany przez dev-server Vite, backend to REST API w Node.js, baza to PostgreSQL z migracjami zarządzanymi przez Prisma.

### Model danych

```
User ──< Habit >── Category
            │
            └──< Checkin
```

- `User` ma wiele `Habit`-ów.
- `Habit` należy do jednego `User`-a i jednej `Category`.
- `Habit` ma wiele `Checkin`-ów (po jednym na dzień, w którym nawyk został wykonany).

## Stos technologiczny

| Warstwa | Technologia | Dlaczego |
|---|---|---|
| Backend | Node.js + Express + TypeScript | Ten sam język po obu stronach (full-stack TS), niski narzut |
| ORM | Prisma | Type-safe, wbudowane migracje, dobra DX |
| Baza danych | PostgreSQL 16 | Sprawdzona relacyjna baza — model danych jest relacyjny |
| Auth | JWT (jsonwebtoken) | Bezstanowe, proste do skalowania, działa naturalnie z SPA |
| Walidacja | Zod | Walidacja na wejściu API + automatyczne typy TypeScript |
| Frontend | React 18 + Vite + TypeScript | Najpopularniejszy stack, szybki dev-server |
| Konteneryzacja | Docker Compose | Jedna komenda podnosi cały stos (R5) |

> Pełne uzasadnienie każdej decyzji znajduje się w [docs/ADR.md](docs/ADR.md).

## Wymagania

- **Docker Desktop** (z Docker Compose v2) — to wszystko czego potrzeba do uruchomienia.
- Opcjonalnie do dewelopowania bez kontenerów: Node.js 20+ i PostgreSQL 16.

## Uruchomienie

### 1. Sklonuj repozytorium

```bash
git clone <url-repo>
cd Projektowanie-aplikacji-internetowych
```

### 2. Skopiuj plik środowiskowy

```bash
cp .env.example .env
```

Domyślne wartości w `.env.example` wystarczą do uruchomienia lokalnie.

### 3. Podnieś cały stos

```bash
docker compose up --build
```

Pierwsze uruchomienie potrwa kilka minut (pobieranie obrazów + instalacja zależności). Kolejne będą szybsze.

Backend przy starcie automatycznie stosuje migracje (`prisma migrate deploy`) i wypełnia bazę danymi demo (`npm run seed`), więc ta jedna komenda podnosi w pełni działającą aplikację — nie trzeba żadnych dodatkowych kroków.

### 4. Otwórz aplikację

- Frontend: http://localhost:5173
- API: http://localhost:4000
- Health-check: http://localhost:4000/health

Konto demo (utworzone przez seed): `demo@example.com` / `demo1234`.

### Zatrzymanie

```bash
docker compose down
```

Żeby usunąć też dane bazy:

```bash
docker compose down -v
```

## Struktura repo

```
.
├── backend/          # API w Node.js + Express + TypeScript
│   ├── prisma/       # Schemat bazy + migracje
│   └── src/
│       ├── lib/      # Klient Prismy, helpery JWT
│       ├── middleware/  # Auth, obsługa błędów
│       ├── routes/   # Endpointy REST (auth, habits, categories, checkins)
│       └── schemas/  # Schematy walidacji Zod
├── frontend/         # SPA w React + Vite + TypeScript
│   └── src/
│       ├── api/      # Klient HTTP do backendu
│       ├── auth/     # Kontekst autentykacji
│       └── pages/    # Komponenty stron
├── docs/
│   └── ADR.md        # Architecture Decision Record
├── docker-compose.yml
├── .env.example
└── README.md
```

## ADR

Wszystkie istotne decyzje architektoniczne wraz z kontekstem, alternatywami i trade-offami: [docs/ADR.md](docs/ADR.md).
