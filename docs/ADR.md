# Architecture Decision Record (ADR)

Dokument opisuje kluczowe decyzje architektoniczne projektu **Habit Tracker**. Każdy wpis zawiera: kontekst (jaki problem rozwiązujemy), alternatywy (co rozważaliśmy), uzasadnienie (dlaczego ten wybór) i trade-offy (czego się wyrzekamy).

---

## ADR-001: PostgreSQL jako baza danych

| Pole | Treść |
|---|---|
| **Decyzja** | PostgreSQL 16 jako podstawowa baza danych. |
| **Kontekst** | Domena aplikacji jest jawnie relacyjna: użytkownik ma wiele nawyków, każdy nawyk należy do kategorii i ma wiele wpisów (check-inów). Pojawia się też ograniczenie unikalności (jeden check-in dziennie na nawyk) — naturalnie wspierane przez `UNIQUE` constraint. |
| **Alternatywy** | **MongoDB** — elastyczny schemat, ale tu dane są ściśle ustrukturyzowane, więc giętkość schemy nie jest atutem, a transakcje i constrainty są ważne. **SQLite** — prostsza konfiguracja, ale słabsze dla aplikacji wielokontenerowej (problemy z współdzieleniem pliku przez kontenery). |
| **Uzasadnienie** | Dane są relacyjne. PostgreSQL daje nam transakcje, integralność referencyjną, constrainty (`UNIQUE(habit_id, date)`), oraz dojrzały tooling (Prisma działa z Postgresem natywnie). Aplikacja będzie skalowalna w przyszłości bez wymiany silnika. |
| **Trade-offy** | Wymaga osobnego kontenera i konfiguracji w `docker-compose`. Przy bardzo dużym wzroście danych analitycznych (statystyki nawyków za lata) zapytania agregujące mogą wymagać optymalizacji (indeksy, ewentualnie warstwa OLAP). |

---

## ADR-002: REST + JSON jako styl API

| Pole | Treść |
|---|---|
| **Decyzja** | REST z JSON jako format wymiany danych. |
| **Kontekst** | Frontend (React SPA) potrzebuje prostego sposobu komunikacji z backendem. Liczba różnych widoków jest mała (logowanie, lista nawyków, kalendarz, kategorie), zapytania są przewidywalne i nie wymagają złożonego kompozytowania pól. |
| **Alternatywy** | **GraphQL** — daje elastyczność doboru pól, ale dla 4 prostych widoków to over-engineering i dodatkowy bundle (Apollo). **tRPC** — świetna DX w monorepo TS, ale uzależnia frontend od backendu (importy typów), co utrudnia zmianę języka backendu w przyszłości. |
| **Uzasadnienie** | REST jest zrozumiały dla każdego, ma pełne wsparcie w narzędziach (Postman, curl, DevTools), a dla naszej skali nie ma problemu over-fetchingu. Łatwo go udokumentować przez OpenAPI/Swagger. |
| **Trade-offy** | Klient czasem dostanie więcej pól niż potrzebuje (over-fetching). Kilka widoków może wymagać kilku zapytań (np. lista nawyków + check-iny dla dzisiaj = 2 calle), co rozwiążemy przez agregację po stronie backendu. |

---

## ADR-003: Prisma jako ORM i narzędzie migracji

| Pole | Treść |
|---|---|
| **Decyzja** | Prisma jako ORM oraz narzędzie do zarządzania migracjami. |
| **Kontekst** | Wymaganie R2 narzuca zarządzanie migracjami przez narzędzie. Pisząc backend w TypeScript, chcemy uniknąć ręcznego mapowania wierszy bazy na typy. |
| **Alternatywy** | **TypeORM** — popularny, ale używa dekoratorów i bywa bardziej magiczny; gorsza inferencja typów. **Knex + ręczne typy** — więcej kontroli, ale dużo boilerplate'u i ryzyko rozjechania się typów ze schematem. **Drizzle** — nowszy, świetna inferencja, ale mniej dojrzały ekosystem dla początkujących. |
| **Uzasadnienie** | Prisma generuje typy bezpośrednio ze schematu, więc IDE autocomplete'uje pola tabel. Komendy `prisma migrate dev` i `prisma studio` są intuicyjne. Schema-as-code (`schema.prisma`) jest jednym, czytelnym źródłem prawdy o modelu danych. |
| **Trade-offy** | Wymaga osobnego kroku generacji klienta (`prisma generate`). Skomplikowane zapytania (rekursywne CTE) wymagają „escape hatch" do raw SQL. Migracje są generowane z diffów schematu — trzeba je przeglądać, a nie ślepo akceptować. |

---

## ADR-004: JWT (Bearer token) jako mechanizm autentykacji

| Pole | Treść |
|---|---|
| **Decyzja** | Autentykacja oparta o JWT przekazywany w nagłówku `Authorization: Bearer <token>`. |
| **Kontekst** | Wymaganie R4 — rozróżnienie zalogowany/niezalogowany. Frontend jest SPA na innej domenie/porcie niż backend (cross-origin), więc cookies wymagałyby konfiguracji `SameSite` i CSRF. |
| **Alternatywy** | **Sesje w cookies** — prostsze pod kątem CSRF (z `SameSite=Lax`), ale wymagają stanu po stronie serwera (lub osobnego store'a jak Redis). **OAuth (Google/GitHub)** — eliminuje hasła, ale dorzuca zewnętrzną zależność i komplikuje demo. |
| **Uzasadnienie** | JWT jest bezstanowy — backend może być w pełni horizontal scalable bez współdzielonego store'a sesji. Dobrze pasuje do SPA, gdzie token można trzymać w pamięci aplikacji. Łatwo wytłumaczyć: token to „pieczątka" — backend sprawdza podpis zamiast trzymać listę zalogowanych. |
| **Trade-offy** | Brak natywnej rewokacji tokenu (raz wystawiony jest ważny do `exp`). W razie kompromitacji jedyny szybki ratunek to rotacja sekretu (unieważnia wszystkie tokeny). Token w pamięci JS jest podatny na XSS — dlatego walidacja danych wejściowych i sanityzacja są kluczowe. |

---

## ADR-005: React + Vite jako stack frontendowy

| Pole | Treść |
|---|---|
| **Decyzja** | React 18 jako biblioteka UI, Vite jako bundler i dev-server. |
| **Kontekst** | Frontend ma być SPA komunikującym się z REST API (R3). Potrzebny jest komponentowy model UI, routing i obsługa stanu autentykacji. |
| **Alternatywy** | **Next.js** — daje SSR i routing out-of-the-box, ale dla aplikacji bez SEO i z prywatnymi danymi (cała aplikacja po zalogowaniu) SSR niewiele daje, a komplikuje deploy i mental model. **Vue/Svelte** — równie dobre, ale React ma największy ekosystem materiałów do nauki. **HTMX** — możliwy, ale wymaga renderowania HTML po stronie serwera, co zmieniłoby architekturę backendu. |
| **Uzasadnienie** | React jest najpopularniejszy, więc materiały do nauki są wszędzie. Vite jest dramatycznie szybszy niż Webpack/CRA — HMR działa w ułamku sekundy. TypeScript działa out-of-the-box. |
| **Trade-offy** | Brak SSR oznacza, że pierwszy render jest „pusty" do czasu pobrania bundle'a. Dla aplikacji z autentykacją to bez znaczenia (i tak nic nie pokazujemy niezalogowanym), ale wykluczamy SEO. |

---

## ADR-006: Zod do walidacji danych wejściowych API

| Pole | Treść |
|---|---|
| **Decyzja** | Zod jako biblioteka walidacji payloadów wchodzących do backendu. |
| **Kontekst** | API musi odrzucać niepoprawne dane (R4 → ochrona endpointów, ale też podstawowa higiena: walidacja typów, długości, formatów email). Bez walidacji błędy ujawniałyby się dopiero w bazie albo, gorzej, prowadziły do niespójności danych. |
| **Alternatywy** | **Joi** — dojrzały, ale bez automatycznych typów TS (trzeba je pisać równolegle). **class-validator** — wymaga dekoratorów i klas, dorzuca styl OOP, który nie pasuje do reszty kodu. **Ręczne `if`-y** — najbardziej elastyczne, ale błędogenne i nieczytelne. |
| **Uzasadnienie** | Zod wyprowadza typ TypeScript ze schematu (`z.infer<...>`), więc walidacja i typ to to samo źródło prawdy. Łatwo go potem przetransformować do OpenAPI. Działa też po stronie frontendu (formularze) — jedno API do nauki. |
| **Trade-offy** | Komunikaty błędów Zod są strukturalne (lista issues), więc trzeba je sformatować przed zwróceniem klientowi. Dorzuca ~50KB do bundle'a (akceptowalne). |

---
