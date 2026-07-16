# Spójna nawigacja publicznych podstron RinoMove

## Cel

Ujednolicić nawigację wszystkich publicznych podstron ze stroną główną. Podstrony mają używać tej samej wyśrodkowanej kapsuły liquid glass, tych samych etykiet, logo, CTA oraz zachowania mobilnego co `index.html`.

## Zakres

Zmiana obejmuje:

- `dla-trenerow.html`;
- `cookies.html`;
- `polityka-prywatnosci.html`;
- `regulamin.html`;
- `rodo.html`.

`panel.html` pozostaje bez zmian, ponieważ ma własną nawigację aplikacyjną zależną od roli użytkownika.

## Struktura i wygląd

Każda objęta podstrona otrzyma ten sam markup nawigacji i załaduje istniejący `navigation.css`. Nawigacja zachowuje:

- wyśrodkowaną kapsułę liquid glass;
- logo RinoMove;
- linki `Jak to działa` i `Dla trenerów`;
- przycisk `Zapisz się`;
- mobilny przycisk CTA widoczny poza rozwijanym menu;
- przycisk menu z poprawnymi atrybutami `aria-expanded` i `aria-controls`.

Nie zmieniamy projektu nawigacji ani treści pozostałych sekcji podstron.

## Adresy linków

Na podstronach linki prowadzą do:

- logo → `index.html#top`;
- `Jak to działa` → `index.html#jak-to-dziala`;
- `Dla trenerów` → `dla-trenerow.html`;
- `Zapisz się` → `index.html#zapisy`.

Na `dla-trenerow.html` link `Dla trenerów` otrzyma `aria-current="page"`. Pozostałe podstrony nie oznaczają żadnego linku jako bieżącego, ponieważ ich nazwy nie występują w głównej nawigacji.

## Zachowanie mobilne

Podstrony statyczne użyją małego współdzielonego skryptu do otwierania i zamykania menu. Skrypt:

- przełącza klasę `menu-open`;
- aktualizuje `aria-expanded`;
- zamyka menu po wybraniu linku;
- nie ingeruje w nawigację strony głównej obsługiwaną przez istniejący runtime.

Desktop pozostaje bez dodatkowej logiki JavaScript.

## Dopasowanie układu

Nawigacja zachowa charakter pływającego elementu. Na podstronach zostanie zapewniony odpowiedni górny odstęp treści, aby kapsuła nie zasłaniała nagłówka ani treści stron prawnych. Zmiany odstępów będą ograniczone wyłącznie do miejsc, w których wymaga tego nowa nawigacja.

## Dostępność i odporność

- Minimalny obszar interaktywny pozostaje zgodny z istniejącym `navigation.css`.
- Logo ma czytelną nazwę dostępną.
- Przycisk menu ma etykietę i poprawnie raportuje stan otwarcia.
- Link bieżącej strony używa `aria-current="page"`.
- Zachowane zostają istniejące fallbacki dla braku `backdrop-filter` i `prefers-reduced-motion`.
- Podstawowe linki pozostają dostępne bez JavaScript na desktopie.

## Implementacja

Najmniejsza wersja rozwiązania składa się z:

1. ponownego użycia `navigation.css`;
2. dodania identycznego markupu nawigacji do pięciu podstron;
3. dodania jednego niewielkiego skryptu obsługującego wyłącznie mobilne menu podstron;
4. usunięcia z `dla-trenerow.html` starego markupu i starego skryptu menu, które zostaną zastąpione nową nawigacją.

Nie wprowadzamy komponentów renderowanych przez JavaScript ani zmian po stronie serwera.

## Testowanie i kryteria akceptacji

Przed implementacją powstanie test, który potwierdzi, że wszystkie pięć podstron:

- ładują `navigation.css`;
- zawierają tę samą strukturę i oczekiwane linki;
- mają mobilny przycisk CTA i kontrolkę menu;
- ładują współdzielony skrypt mobilnego menu.

Osobny test skryptu potwierdzi zmianę stanu menu i zamknięcie go po wyborze linku. Po implementacji zostaną uruchomione pełne testy projektu oraz kontrola wizualna strony trenerów i reprezentatywnej strony prawnej w widoku desktopowym i mobilnym.

Zmiana jest gotowa, gdy wszystkie publiczne podstrony wizualnie odpowiadają nawigacji strony głównej, linki działają, menu mobilne działa i żaden istniejący test nie ulega regresji.
