# Nawigacja strony klienckiej RinoMove — liquid glass

## Cel

Zbudować pierwszą część nowej strony głównej RinoMove skierowanej do klientów: zwartą, wyśrodkowaną nawigację typu liquid glass. Nawigacja ma jasno prowadzić do znalezienia trenera, wyjaśnienia działania platformy, osobnej podstrony dla trenerów oraz rejestracji i logowania.

## Zatwierdzony kierunek

Wybrany został wariant klient-first z jednym wejściem do rejestracji. Cała nawigacja tworzy jedną kompaktową kapsułę wyśrodkowaną nad hero. Jej szerokość wynika z treści, zamiast rozciągać elementy do bocznych krawędzi strony.

Warstwa wizualna nawiązuje do nawigacji Craft:

- mleczne, półprzezroczyste tło;
- rozmycie i lekkie nasycenie kolorów znajdujących się pod kapsułą;
- jasny wewnętrzny refleks i bardzo subtelna szklana krawędź;
- dwa miękkie cienie budujące głębię;
- pełny, kapsułowy promień zaokrąglenia;
- czarny, kapsułowy przycisk główny.

Kolor tła widoczny przez szkło pozostaje własny dla RinoMove: malinowy `#C72562`, lawendowy `#A8BFE9`, grafit `#1C1B20` i jasne neutralne powierzchnie.

## Treść i kolejność

Nawigacja desktopowa zawiera, od lewej:

1. logo RinoMove;
2. link `Znajdź trenera`;
3. link `Jak to działa`;
4. link `Dla trenerów`;
5. link `Zaloguj się`;
6. przycisk główny `Załóż konto`.

Adresy są jednoznaczne:

- `Znajdź trenera` → `#trenerzy`;
- `Jak to działa` → `#jak-to-dziala`;
- `Dla trenerów` → `dla-trenerow.html`;
- `Zaloguj się` → `panel.html#login`;
- `Załóż konto` → `panel.html#register`.

Istniejący panel ma otworzyć dialog konta w trybie wskazanym przez hash `#login` albo `#register`. Zmiana w panelu ogranicza się do odczytania tego hasha przy wejściu; nie przebudowujemy formularza ani mechanizmu uwierzytelniania.

Nie dodajemy osobnych przycisków rejestracji dla klienta i trenera w nawigacji. `Załóż konto` prowadzi do jednego ekranu wyboru roli. Dopiero tam użytkownik wybiera konto klienta albo trenera. Wymóg dodawania certyfikatów przez trenera należy do późniejszego przepływu rejestracji, a nie do samej nawigacji.

## Podstrona dla trenerów

Link `Dla trenerów` prowadzi do podstrony `/dla-trenerow.html`. Źródłem jej treści jest istniejący landing z katalogu `Strona dla trenerów`. Integracja ma zachować jego treść i styl; na tym etapie nie projektujemy go ponownie.

Założenie: określenie „strona, którą zbudowaliśmy dla trenerów” odnosi się do osobnego projektu `Strona dla trenerów/index.html`, a nie do niezacommitowanych zmian w głównym `strona/index.html`. Jeżeli to założenie jest niepoprawne, należy zatrzymać integrację podstrony przed kopiowaniem treści.

## Zachowanie desktopowe

- Kapsuła jest przyklejona do górnej części widoku i wyśrodkowana poziomo.
- Ma niewielki odstęp od górnej krawędzi, aby wyglądała jak pływający element.
- Grupy treści pozostają blisko siebie; nie używamy rozciągającego `space-between` na pełną szerokość strony.
- Podczas przewijania szkło może stać się minimalnie bardziej kryjące, aby zachować czytelność nad zdjęciami.
- Linki dostają subtelną zmianę koloru przy najechaniu i wyraźny stan focus.
- Przycisk `Załóż konto` skaluje się do `0.96` podczas naciśnięcia.

## Zachowanie mobilne

W jednej wyśrodkowanej kapsule pozostają:

- logo RinoMove;
- `Załóż konto`;
- przycisk menu.

Menu rozwija linki `Znajdź trenera`, `Jak to działa`, `Dla trenerów` i `Zaloguj się`. Panel menu musi być obsługiwany klawiaturą, zamykać się po wyborze linku i prawidłowo aktualizować `aria-expanded`.

## Dostępność i odporność

- Minimalny obszar interaktywny każdego elementu wynosi 40 × 40 px.
- Logo ma czytelną nazwę dostępną dla czytników ekranu.
- Menu ma prawidłowe etykiety i relację `aria-controls`.
- Fokus klawiatury jest widoczny na każdym linku i przycisku.
- Przy `prefers-reduced-motion: reduce` nie wykonujemy animacji przesuwania ani skali.
- Gdy `backdrop-filter` nie jest obsługiwany, kapsuła otrzymuje bardziej kryjące jasne tło; czytelność nie może zależeć od rozmycia.

## Granice etapu

Ten etap obejmuje wyłącznie nawigację oraz działający link do zachowanej podstrony trenerów. Nie obejmuje:

- projektu hero;
- generowania zdjęć ani nowych póz Rino;
- pełnego ekranu rejestracji i logowania;
- uploadu i weryfikacji certyfikatów;
- wyszukiwarki trenerów;
- zmian w pozostałych sekcjach strony.

## Weryfikacja

Etap jest gotowy, gdy:

1. wszystkie etykiety i adresy linków są poprawne;
2. `Dla trenerów` otwiera zachowaną podstronę trenerów;
3. nawigacja jest zwarta i wyśrodkowana na desktopie;
4. przy szerokości telefonu pozostają logo, CTA i menu bez nachodzenia elementów;
5. menu mobilne działa myszą i klawiaturą oraz aktualizuje `aria-expanded`;
6. focus jest widoczny, a obszary interakcji mają minimum 40 × 40 px;
7. wygląd pozostaje czytelny także bez `backdrop-filter` i przy ograniczonym ruchu;
8. istniejące testy projektu nadal przechodzą.
