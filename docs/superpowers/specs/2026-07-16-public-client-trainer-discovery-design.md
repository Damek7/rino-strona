# RinoMove — publiczne wyszukiwanie i profile trenerów

## Cel i kryteria ukończenia

Panel klienta ma pozwalać anonimowej osobie znaleźć i porównać trenerów bez zakładania konta. Użytkownik może wyszukiwać po mieście, dzielnicy, sporcie oraz imieniu lub nazwisku, a po wykonaniu wyszukiwania sortować wyniki. Karta prowadzi do pełnego publicznego profilu ze zdjęciami, opisem i opiniami. Konto klienta jest wymagane dopiero po kliknięciu „Zarezerwuj trening”. Po rejestracji lub logowaniu aplikacja wraca do wybranego trenera i kontynuuje rezerwację.

Ukończenie wymaga działania tych przepływów zarówno w trwałym trybie demo, jak i w kontrakcie Supabase, zachowania obecnego designu RinoMove, responsywności oraz testów automatycznych i przeglądarkowych.

## Jawne założenia

- Warszawa jest jedynym miastem startowym, ale pole miasta zachowuje strukturę gotową na przyszłe miasta.
- Dzielnica jest nieaktywna, dopóki użytkownik nie wybierze Warszawy.
- „Opinie” nie są filtrem głównego formularza. Są kryterium sortowania i treścią publicznego profilu.
- Sortowanie jest niewidoczne przed pierwszym wyszukiwaniem.
- Publiczny użytkownik może oglądać listę, profile, galerie i opinie. Wolne terminy oraz utworzenie rezerwacji są dostępne dopiero po uwierzytelnieniu konta klienta.
- Rejestracja wywołana z profilu tworzy konto klienta. Rejestracja trenera pozostaje w istniejącej, osobnej ścieżce.
- Płatność pozostaje zgodna z istniejącym MVP: demo symuluje opłacenie, a Supabase utrzymuje status oczekujący do podłączenia operatora.
- Projekt pozostaje w obecnej architekturze vanilla JS. Nie jest planowane przejście na framework ani przebudowa niezwiązanych widoków.

## Zatwierdzony przepływ klienta

1. Anonimowy użytkownik otwiera widok „Znajdź trenera”.
2. Wybiera miasto „Warszawa”; dopiero wtedy aktywuje się lista dzielnic.
3. Opcjonalnie wybiera dzielnicę i sport oraz wpisuje imię lub nazwisko trenera.
4. Klika „Znajdź trenera”. Dopiero wtedy pojawiają się liczba wyników i kontrolka „Sortuj”.
5. Sortuje po dopasowaniu, najniższej cenie, najwyższej cenie, najlepszej średniej opinii albo największej liczbie opinii.
6. Otwiera kartę i przechodzi do pełnego publicznego profilu.
7. Ogląda galerię, opis, doświadczenie, specjalizacje, cenę i zweryfikowane opinie.
8. Kliknięcie „Zarezerwuj trening” przez anonimowego użytkownika otwiera logowanie/rejestrację klienta.
9. Po uwierzytelnieniu aplikacja zachowuje trenera i wraca do wyboru wolnego terminu.
10. Klient wybiera termin, potwierdza rezerwację i widzi ją w „Moich rezerwacjach”.

Powrót z profilu do wyników zachowuje formularz, listę wyników i wybrane sortowanie. Konto trenera nie może wykonać rezerwacji klienta.

## Wyszukiwarka i sortowanie

Główny pasek zachowuje zwarty układ referencji przekazanej przez użytkownika: połączona biała powierzchnia, wyraźne segmenty pól i mocny przycisk końcowy. Nie kopiuje niebieskiego brandingu referencji; używa grafitu, malinowego CTA, ciepłego tła, promieni i cieni istniejącego `panel.css`.

Kolejność pól:

1. **Miasto** — placeholder „Wybierz miasto” i jedyna opcja „Warszawa”.
2. **Dzielnica** — placeholder „Najpierw wybierz miasto”; po wyborze Warszawy lista dzielnic Warszawy.
3. **Sport** — tenis, boks, padel, squash, golf i pływanie.
4. **Imię lub nazwisko** — wyszukiwanie bez rozróżniania wielkości liter i z polską lokalizacją.
5. **Znajdź trenera** — jedyna główna akcja formularza.

Wyniki są filtrowane dopiero po wysłaniu formularza, nie przy każdym naciśnięciu klawisza. Nad wynikami pojawiają się licznik, „Wyczyść filtry” oraz select „Sortuj” z opcjami:

- Dopasowanie — domyślne; dokładne dopasowanie nazwy, sportu i dzielnicy przed oceną i ceną.
- Najniższa cena.
- Najwyższa cena.
- Najlepsza średnia opinii; remisy rozstrzyga liczba opinii.
- Najwięcej opinii; remisy rozstrzyga średnia opinii.

Na mobile pola układają się pionowo, CTA ma pełną szerokość, a sortowanie pozostaje nad wynikami. Zależność miasto–dzielnica jest dostępna z klawiatury i komunikowana właściwościami `disabled` oraz tekstem pomocniczym.

## Karty wyników

Karta pokazuje zdjęcie trenera, imię i nazwisko, oznaczenie weryfikacji, sport, dzielnicę, poziom, średnią i liczbę opinii oraz cenę za godzinę. Cała karta jest dostępna jako wejście do profilu, a osobny tekst akcji brzmi „Zobacz profil”. Karta nie uruchamia rezerwacji i nie otwiera logowania.

Wyniki korzystają z obecnej siatki dwóch kolumn na szerokim ekranie i jednej na węższym. Zdjęcie ma 88 × 88 px na desktopie oraz 72 × 72 px na mobile, z kadrowaniem `object-fit: cover`. Karta zachowuje białą powierzchnię, lekki wielowarstwowy cień, promienie i krótkie przesunięcie hover z istniejącego systemu.

## Publiczny profil trenera

Profil jest osobnym widokiem panelu i ma adres `#trainer/<id>`, dzięki czemu odświeżenie oraz bezpośrednie wejście zachowują wybranego trenera. Widok zawiera:

- nawigację powrotną do zachowanych wyników;
- zdjęcie główne i galerię z miniaturami;
- imię i nazwisko, weryfikację, sport, dzielnicę i poziom;
- cenę za godzinę oraz stale widoczne CTA „Zarezerwuj trening”;
- opis współpracy, doświadczenie i specjalizacje;
- podsumowanie oceny i liczbę opinii;
- publiczną listę opinii: ocena, treść, bezpieczna publiczna nazwa autora i data;
- stan braku galerii, opisu lub opinii bez pustych, zepsutych powierzchni.

Na desktopie treść i galeria zajmują główną kolumnę, a podsumowanie z ceną i CTA jest przyklejone w prawej kolumnie. Na mobile CTA jest łatwo dostępne, ale nie zasłania treści ani dolnej nawigacji.

## Kierunek wizualny z folderu `Startup/inspiracje`

Projekt utrzymuje obecny język wizualny RinoMove. Folder inspiracji zawiera odnośniki, a nie lokalne makiety. Każdy serwis jest używany wyłącznie dla elementu wskazanego nazwą folderu; ten sam serwis może wpływać na kilka elementów tylko wtedy, gdy występuje w kilku folderach. Nie są kopiowane branding, treści ani kompletne sekcje 1:1 — kopiowany jest wzorzec kompozycyjny lub interakcyjny, przetłumaczony na tokeny RinoMove.

| Folder | Przejrzane źródła | Wzorzec zastosowany w panelu klienta |
|---|---|---|
| `01_Nawigacja` | Craft, Duolingo, Fluz, MindMarket | Lekki sticky topbar, wyraźne rozdzielenie odkrywania od konta, prosty stan aktywny i jeden dominujący punkt wejścia do konta. Bez kopiowania kolorów źródeł. |
| `02_Hero` | Headspace, Duolingo, MindMarket, Maze, ClickUp | Krótkie objaśnienie wartości, przyjazny ton i mocna hierarchia nagłówka nad wyszukiwarką. Rino pozostaje wsparciem narracji, a nie konkurencją dla zdjęć trenerów. |
| `03_Sekcje_oferty` | Craft, Fluz, ClickUp | Profil dzieli informacje na wyraźne bloki: „O mnie”, „Doświadczenie”, „Specjalizacje” i „Opinie”, zamiast jednej ściany tekstu. |
| `04_Karty_i_lista_funkcji` | Fluz, MindMarket, Maze, ClickUp | Karty mają mocne kadrowanie zdjęcia, skanowalne metadane i realne dane: sport, lokalizacja, ocena, liczba opinii i cena. Jedna akcja „Zobacz profil”. |
| `05_Cenniki` | brak linków | Brak zapożyczeń. Cena korzysta wyłącznie z istniejącego komponentu i typografii liczbowej RinoMove. |
| `06_Opinie_i_zaufanie` | brak linków | Brak zapożyczeń. Opinie wynikają z reguł produktu: tylko zweryfikowane rezerwacje, średnia, liczba opinii i publiczna lista. |
| `07_Formularze_i_CTA` | Craft | Wyszukiwarka jest jedną spokojną, połączoną powierzchnią z czytelnymi segmentami, jednoznacznymi etykietami i pojedynczym malinowym CTA. |
| `08_Dashboardy` | brak linków | Brak zmian wynikających z inspiracji; istniejące dashboardy pozostają poza zakresem. |
| `09_Mobile` | brak linków | Mobile wynika z istniejącego systemu RinoMove: pionowe pola, pełnoszerokie CTA, duże cele dotykowe i brak poziomego przepełnienia. |
| `10_Animacje` | Ctrl, Headspace, Duolingo, MindMarket, Arc, ClickUp | Krótkie wejście profilu, lekki hover kart, feedback naciśnięcia i płynna zmiana głównego zdjęcia galerii. Bez efektów blokujących scroll; pełne wsparcie `prefers-reduced-motion`. |
| `11_Typografia_i_kolory` | Ctrl, Headspace, Slush, Duolingo, Raw Materials / Volta, MindMarket, Arc, Maze, ClickUp | Duża, zwarta hierarchia nagłówków, czytelne liczby i premium przez przestrzeń. Paleta nie jest kopiowana: pozostają grafit, malina, błękit Rino, ciepłe tło i Nunito Sans. |
| `12_Layout_i_uklad` | Craft, Headspace, Slush, Duolingo, Fluz, MindMarket, Arc, Maze, ClickUp | Dyscyplina szerokości, rytm sekcji i responsywna siatka. Profil używa szerokiej kolumny treści oraz węższej sticky karty rezerwacyjnej; wyniki zachowują siatkę 2→1. |

Przejrzane adresy są dokładnie tymi zapisanymi w `inspiracje/*/linki.txt`: `craft.do`, `duolingo.com`, `fluz.app`, `mindmarket.com`, `headspace.com`, `maze.co`, `clickup.com`, `ctrl.xyz`, `slush.app`, `arc.net` i `therawmaterials.com/work/volta`.

Obowiązują istniejące tokeny: grafit `#1C1B20`, malinowy `#C72562`, niebiesko-lawendowy akcent Rino, ciepłe tło `#F6F3F0`, białe powierzchnie, Nunito Sans, koncentryczne promienie i cienie z `panel.css`. Nie powstaje nowy design system.

## Architektura aplikacji

- `panel.html` — segmentowany formularz wyszukiwania, kontrolki wyników i semantyczny publiczny widok profilu.
- `panel.css` — rozszerzenie istniejących komponentów o pasek segmentowany, większe karty zdjęciowe, galerię, układ profilu i responsywność.
- `lib/panel-helpers.js` — czyste funkcje zależności miasto–dzielnica, normalizacji filtrów, dopasowania i sortowania.
- `lib/demo-store.js` — kompletne publiczne profile demo, galerie, doświadczenie, specjalizacje i publiczne opinie.
- `lib/supabase-store.js` — ten sam kontrakt publicznego katalogu i profilu na Supabase.
- `panel.js` — stan formularza roboczego i zatwierdzonego, routing profilu, renderowanie galerii i opinii oraz wznowienie rezerwacji po auth.
- nowa migracja Supabase — bezpieczny publiczny odczyt danych katalogowych, media profilu i indeksy.

Widoki nie odczytują bezpośrednio szczegółów implementacji store. Oba adaptery udostępniają co najmniej `listTrainers(filters, sort)`, `getPublicTrainer(id)`, `listTrainerReviews(id)` i dotychczasowe `listAvailability(trainerId, range)`.

## Dane i bezpieczeństwo Supabase

Publiczny katalog nie może wystawiać prywatnych kolumn z `profiles`, takich jak e-mail lub telefon. Bezpieczna nazwa publiczna i avatar są kopiowane do `trainer_profiles` przez triggery, a bezpieczna nazwa autora opinii jest zapisywana w `reviews`. Przeglądarka odczytuje te tabele bezpośrednio przez Supabase Data API z minimalnymi grantami i RLS; nie używa widoków ani funkcji `SECURITY DEFINER`. Publiczny kontrakt obejmuje wyłącznie: identyfikator, nazwę publiczną, avatar, miasto, dzielnicę, sport, poziom, opis, doświadczenie, specjalizacje, cenę, weryfikację, publikację, galerię oraz bezpieczne dane opinii.

Galeria używa osobnej tabeli powiązanej z trenerem: URL, tekst alternatywny, kolejność i znacznik zdjęcia głównego. Publiczny odczyt obejmuje tylko media opublikowanego profilu. Zapis i usuwanie należą wyłącznie do właściciela profilu. Pliki trafiają do osobnego publicznego bucketu z limitem rozmiaru, typami JPEG/PNG/WebP oraz ścieżką rozpoczynającą się od identyfikatora trenera.

Opinie pozostają publicznie czytelne, ale odpowiedź katalogowa nie ujawnia danych kontaktowych klienta. Publiczna nazwa autora jest ograniczona do bezpiecznej formy, np. imienia i inicjału nazwiska. Reguła jednej opinii na zakończoną i opłaconą rezerwację pozostaje bez zmian.

## Bramkowanie konta i wznowienie rezerwacji

Lista i profil nie wywołują `requireSession`. CTA „Zarezerwuj trening” sprawdza rolę:

- anonimowy użytkownik — otwarcie auth w trybie klienta i zapis zamiaru rezerwacji z `trainerId`;
- klient — przejście do publicznej dostępności wybranego trenera;
- trener — komunikat, że rezerwacja wymaga konta klienta, bez przełączania roli.

Po sukcesie auth aplikacja odczytuje zapisany zamiar, ponownie pobiera publiczny profil, usuwa zamiar jeśli profil zniknął, a jeśli jest aktualny — przechodzi do kalendarza tego trenera. Nie otwiera automatycznie podsumowania bez wyboru konkretnego terminu.

## Błędy i stany puste

- Brak miasta: dzielnica wyłączona, brak niejawnego ustawienia Warszawy.
- Brak wyników: komunikat zależny od filtrów oraz „Wyczyść filtry”.
- Nieistniejący lub ukryty profil: stan „Profil niedostępny” i powrót do wyników.
- Brak zdjęć: estetyczny placeholder z inicjałami lub Rino; brak uszkodzonego `img`.
- Brak opinii: „Ten trener nie ma jeszcze opinii”, bez fałszywej oceny `0,0`.
- Błąd pobrania: zachowane filtry i przycisk „Spróbuj ponownie”.
- Termin zajęty w międzyczasie: komunikat i odświeżenie dostępności bez utraty profilu.
- Błąd auth: zachowany zamiar rezerwacji i zawartość formularza zgodnie z istniejącym zachowaniem.

## Testy i dowody ukończenia

- Testy helperów: aktywacja dzielnicy, normalizacja nazwiska, dopasowanie i wszystkie pięć wariantów sortowania wraz z remisami.
- Testy demo store: publiczna lista i profil bez sesji, galerie, publiczne opinie, brak prywatnych danych, filtrowanie miasta/dzielnicy/sportu/nazwy.
- Testy kontraktu Supabase: nowe metody store, bezpośrednie zapytania wyłącznie do bezpiecznych kolumn, media tylko opublikowanych trenerów, minimalne granty, RLS zapisu i zachowanie opinii.
- Testy treści/DOM: kolejność pól, wyłączona dzielnica, sortowanie ukryte przed wyszukiwaniem, publiczny profil i CTA.
- Testy przepływu: anonimowe oglądanie listy/profilu/opinii; auth dopiero po CTA; wznowienie właściwego trenera po logowaniu; blokada roli trenera.
- Pełny `npm test`.
- Kontrola w prawdziwej przeglądarce na desktopie i mobile: wyszukiwanie, sortowanie, galeria, profil, rejestracja/logowanie i rezerwacja.
- Kontrola dostępności: klawiatura, focus, etykiety, tekst alternatywny, kontrast oraz `prefers-reduced-motion`.

## Poza zakresem

- Dodawanie miast innych niż Warszawa.
- Nowy design system lub przebudowa całego panelu.
- Moderacja opinii, ulubieni trenerzy i porównywarka profili.
- Edytor zarządzania galerią po stronie trenera. W tym zakresie powstają model danych, zasady zapisu, kompletne dane demo i publiczny odczyt; interfejs dodawania zdjęć będzie osobnym zadaniem.
- Prawdziwe obciążenie karty/BLIK oraz wypłaty.
