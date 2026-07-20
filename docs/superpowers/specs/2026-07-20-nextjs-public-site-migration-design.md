# Migracja strony publicznej do Next.js — projekt

## Cel

Przenieść publiczną część RinoMove z własnego serwera Node.js i plików HTML do Next.js, bez zmiany adresów publicznych ani kontraktów API. Panel klienta i trenera pozostaje tymczasowo dostępny jako istniejąca aplikacja pod `/panel.html`.

## Zakres

- Next.js z App Router obsługuje stronę główną, `/dla-trenerow` oraz strony prawne.
- Wspólne elementy publiczne (nawigacja i stopka) są komponentami React.
- Obecny HTML i CSS strony publicznej są przenoszone do komponentów React bez celowej zmiany wyglądu lub treści.
- Route handlery zachowują: `GET /api/health`, `GET /api/config`, `GET /api/trainers` i `POST /api/waitlist`.
- Istniejące moduły `lib/` do trybu demo i Supabase pozostają źródłem logiki domenowej.
- `panel.html`, jego JavaScript, CSS, zasoby i zależność od istniejących endpointów są udostępniane z katalogu statycznego Next.js do osobnej migracji.

## Poza zakresem

- Reactowa przebudowa panelu.
- Zmiana modelu danych, migracji Supabase, płatności lub integracji Google Sheets.
- Zmiana tekstów, identyfikacji wizualnej albo URL-i.

## Architektura

`app/` dostarcza strony publiczne i route handlery API. Elementy wymagające interakcji w przeglądarce — menu mobilne i formularz zapisu — są małymi komponentami klienckimi. Pozostałe części stron pozostają komponentami serwerowymi.

Zasoby graficzne trafiają do `public/assets`. Zachowany panel i jego wspierające pliki statyczne trafiają do `public/legacy`, ale pozostają dostępne pod dotychczasowymi adresami, w tym `/panel.html`. Route handlery wykorzystują wyodrębnioną, testowalną logikę z obecnego `server.js`; nie zmieniają formatów odpowiedzi ani kodów statusu.

## Przepływ danych

1. Przeglądarka renderuje trasę publiczną w Next.js.
2. Menu i formularz działają po hydracji tylko tam, gdzie potrzebna jest interakcja.
3. Formularz wysyła JSON do `/api/waitlist`.
4. Handler waliduje dane, ogranicza liczbę prób i przekazuje poprawne zgłoszenie do istniejącego webhooka Google Sheets.
5. Panel legacy nadal pobiera konfigurację i dane spod tych samych tras API.

## Błędy i zgodność

API zachowuje obecne komunikaty, statusy 400/413/422/429/502/503 i odpowiedź 404 dla nieznanych tras API. Brak wymaganych zmiennych środowiskowych nadal wyłącza zapisy, a konfiguracja Supabase nadal bezpiecznie wraca do trybu demo.

## Weryfikacja

- Testy jednostkowe obejmują przeniesioną logikę filtrowania trenerów, kwalifikacji i zapisu na listę oczekujących.
- Testy tras potwierdzają dotychczasowe kontrakty API.
- Testy sprawdzają obecność publicznych tras i kompatybilnego adresu panelu.
- `npm test` oraz produkcyjny `npm run build` przechodzą bez błędów.
