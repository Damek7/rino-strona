# RinoMove — kompletne MVP produktu

## Cel i kryteria ukończenia

RinoMove ma działać jako responsywna platforma łącząca klientów z trenerami sportów premium w Warszawie. Ukończone MVP pozwala założyć konto klienta lub trenera, zalogować się, wyszukać trenera, wybrać termin, utworzyć i obsłużyć rezerwację, prowadzić rozmowę, zarządzać dostępnością oraz zobaczyć rozliczenia trenera. Aplikacja ma działać od razu bez zewnętrznej konfiguracji w trybie demonstracyjnym oraz przełączać się na Supabase po podaniu publicznych danych projektu.

Weryfikacja obejmuje testy jednostkowe warstwy domenowej i konfiguracji, pełny `npm test`, sprawdzenie uruchomienia serwera, odpowiedzi API/config oraz ręczne przejście kluczowych ścieżek klienta i trenera w przeglądarce na desktopie i mobile.

## Jawne założenia

- „Bez mojej integracji na razie” oznacza: pełny tryb demo z trwałością w `localStorage`, bez obowiązku podania kluczy, ale z gotową migracją, klientem i automatycznym przełączeniem na Supabase.
- Prawdziwe obciążenie karty/BLIK i wypłaty nie wchodzą do MVP bez operatora płatności. Interfejs i baza obsługują statusy płatności oraz rozliczenie, a demo symuluje opłacenie rezerwacji.
- Jedna aplikacja panelowa obsługuje obie role. Nawigacja, widoki i dozwolone akcje wynikają z profilu użytkownika.
- Opinie można dodać tylko do jednej zakończonej i opłaconej rezerwacji; jedna rezerwacja daje najwyżej jedną opinię.
- Projekt pozostaje bez frameworka i bundlera. To najmniejsza zmiana zgodna z istniejącym repozytorium.

## Rozważone podejścia

1. **Przepisanie do React/Next.js.** Najłatwiejsze do dalszego skalowania, ale wymagałoby wymiany niemal całej aplikacji, migracji stylów i nowego procesu budowania. Odrzucone jako zbyt duże i sprzeczne z chirurgicznym zakresem.
2. **Dalsza rozbudowa pojedynczego `panel.js`.** Najmniejsza liczba plików, ale miesza UI, stan, autoryzację i bazę, przez co kalendarz, czat i role szybko stałyby się trudne do testowania.
3. **Modularny vanilla JS z adapterem danych — wybrane.** Zachowuje obecne uruchomienie i landing, ale wydziela domenę, dane demo, Supabase oraz renderowanie. Pozwala testować reguły bez DOM i przełączać backend bez zmiany widoków.

## Kierunek wizualny — synteza inspiracji

Wszystkie 12 folderów zostało potraktowanych jako kategorie, a powtarzające się strony jako sygnał wagi, nie jako osobne projekty do kopiowania.

- **Craft:** ciepłe neutralne tło, spokojna typografia, lekko unosząca się nawigacja i powierzchnie z miękkim cieniem. Do RinoMove trafia spokój i porządek, nie serifowy charakter marketingowy.
- **Duolingo i Headspace:** prosty język, przyjazne ilustracje, duże cele dotykowe i wyraźny feedback. Do produktu trafia maskotka oraz komunikaty prowadzące początkującego bez infantylizacji.
- **Fluz i MindMarket:** odważna skala nagłówków, mocne kadrowanie i wyraźny rytm. W panelu skala zostaje ograniczona na rzecz użyteczności; wpływ widać w nagłówkach stron i kartach podsumowania.
- **Maze i ClickUp:** produkt pokazany jako system widocznych, realnych elementów UI. RinoMove pokazuje terminy, statusy, kwoty i rozmowy zamiast ogólnych obietnic.
- **Arc, Ctrl i Slush:** techniczna świeżość, charakterystyczne powierzchnie i motion wspierający narrację. W aplikacji ruch ma być krótki, przerywalny i respektować `prefers-reduced-motion`.
- **Raw Materials / Volta:** duża dyscyplina siatki i premium przez typografię oraz przestrzeń, nie przez złoto czy ciężkie efekty.

Finalny system: białe i ciepłe neutralne tła, grafit `#1C1B20`, malinowy `#C72562` jako pojedynczy kolor akcji, błękit Rino `#A9D4EA` dla ilustracji i łagodnych akcentów, limonka wyłącznie jako mały status dodatni. Interfejs łączy spokojną przestrzeń marketingu z bardziej zwartą, zadaniową gęstością panelu. Karty mają koncentryczne promienie, lekkie wielowarstwowe cienie zamiast ciężkich ramek, liczby tabularne, minimum 40 px dla elementów interaktywnych i brak `transition: all`.

## Architektura aplikacji

- `panel.html` — semantyczny szkielet aplikacji, dialog autoryzacji, role i kontenery widoków.
- `panel.css` — osobny system wizualny aplikacji i responsywność.
- `lib/domain.js` — czyste reguły statusów, kwot, kalendarza i uprawnień.
- `lib/demo-store.js` — pełne źródło danych demo, seed i zapis w `localStorage`.
- `lib/supabase-store.js` — implementacja tego samego kontraktu na tabelach Supabase.
- `lib/app-store.js` — wybór trybu z `/api/config` i wspólny interfejs.
- `panel.js` — stan sesji, routing widoków, renderowanie i obsługa zdarzeń.
- `server.js` — statyczne pliki, bezpieczne udostępnienie klienta Supabase i publicznej konfiguracji; bez przechowywania haseł.
- `supabase/migrations/*_product_mvp.sql` — schemat, indeksy, RLS, triggery i bezpieczny widok rozliczeń.

## Model danych Supabase

- `profiles`: nazwa, rola, telefon opcjonalny, avatar, zaakceptowanie regulaminu.
- `trainer_profiles`: opis, dyscyplina, dzielnica, stawka, weryfikacja i publikacja.
- `availability_slots`: trener, początek/koniec, status dostępny/zarezerwowany/zablokowany.
- `bookings`: klient, trener, termin, status operacyjny, kwota, prowizja i status płatności.
- `conversations` i `conversation_members`: rozmowa powiązana z rezerwacją i jej uczestnicy.
- `messages`: autor, treść, czas i odczytanie; tylko członkowie rozmowy mają dostęp.
- `reviews`: unikalna rezerwacja, ocena i treść; trigger/polityka wymagają zakończonej opłaconej rezerwacji.
- `notification_preferences`: ustawienia przypomnień właściciela.

RLS jest włączone na każdej tabeli `public`. Klient widzi własne rezerwacje, trener własne; członkowie widzą rozmowę; profil trenera jest publicznie czytelny tylko po publikacji. Aktualizacje mają równocześnie `USING` i `WITH CHECK`. Kod przeglądarki otrzymuje wyłącznie URL i klucz publikowalny — nigdy `service_role`.

## Przepływy

### Klient

Rejestracja → wyszukiwarka → karta trenera → wybór wolnego terminu → podsumowanie ceny → rezerwacja opłacona w demo → lista rezerwacji → czat → po zakończeniu możliwość opinii.

### Trener

Rejestracja → ekran startowy z metrykami → dodanie/blokowanie dostępności → przyjęcie lub zmiana statusu rezerwacji → rozmowa z klientem → oznaczenie treningu jako odbytego → rozliczenia brutto/prowizja/do wypłaty → edycja profilu.

## Błędy i stany puste

Każdy widok ma stan ładowania, pusty i błędu. Błędy nie usuwają wprowadzonej treści formularza. Brak konfiguracji Supabase nie jest błędem — uruchamia oznaczony „Tryb demo”. Próba niedozwolonej zmiany statusu, podwójnej rezerwacji lub opinii jest blokowana w domenie i w bazie.

## Testy

- Czyste testy domeny: przejścia statusów, wyliczenia zarobków, filtrowanie, generowanie tygodnia, uprawnienie do opinii.
- Testy magazynu demo: rejestracja/logowanie, trwałość, rezerwacja terminu, wiadomości, dostępność, statusy i rozliczenia.
- Testy migracji jako kontrakt: wszystkie tabele mają RLS, polityki własności i ograniczenie jednej opinii.
- Testy treści/HTML: oba zestawy nawigacji ról, widoki, dostępność formularzy i brak ikon tekstowych/emoji w funkcjonalnym UI.
- Kontrola przeglądarkowa: rejestracja klienta, rezerwacja, wiadomość; przełączenie na trenera, dostępność, zakończenie rezerwacji, zarobki; desktop i mobile.
