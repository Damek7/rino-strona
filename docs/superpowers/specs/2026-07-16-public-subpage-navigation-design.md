# Kontekstowa nawigacja publicznych podstron RinoMove

## Cel

Ujednolicić warstwę wizualną nawigacji publicznych podstron ze stroną główną, jednocześnie dopasowując etykiety i linki do kontekstu każdej strony. Wszystkie objęte strony używają tej samej wyśrodkowanej kapsuły liquid glass, logo i typografii, ale nie muszą zawierać tych samych pozycji menu.

## Zakres

Zmiana obejmuje:

- `dla-trenerow.html`;
- `cookies.html`;
- `polityka-prywatnosci.html`;
- `regulamin.html`;
- `rodo.html`.

`panel.html` pozostaje bez zmian, ponieważ ma własną nawigację aplikacyjną zależną od roli użytkownika.

## Podstrona dla trenerów

`dla-trenerow.html` zachowuje pełną, responsywną kapsułę i otrzymuje menu dopasowane do trenerskiego landing page'a.

Kolejność i adresy linków na desktopie:

1. logo RinoMove → `index.html#top`;
2. `Strona główna` → `index.html#top`;
3. `Korzyści` → `#korzysci`;
4. `Program` → `#program`;
5. `Jak dołączyć` → `#jak`;
6. przycisk `Zapisz się` → `#kontakt`.

Nie pokazujemy linków `Jak to działa` ani `Dla trenerów`, ponieważ nie pomagają użytkownikowi poruszać się po tej podstronie.

## Strony prawne

`cookies.html`, `polityka-prywatnosci.html`, `regulamin.html` i `rodo.html` używają uproszczonej kapsuły zawierającej:

- logo RinoMove prowadzące do `index.html#top`;
- jeden link `Wróć na stronę główną` prowadzący do `index.html#top`.

Strony prawne nie pokazują CTA `Zapisz się`, menu sekcyjnego ani przycisku menu mobilnego. Ich nawigacja nie wymaga JavaScriptu.

## Zachowanie mobilne

Na podstronie trenerów w kapsule pozostają logo, przycisk `Zapisz się` i przycisk menu. Rozwijany panel zawiera:

- `Strona główna`;
- `Korzyści`;
- `Program`;
- `Jak dołączyć`.

Współdzielony skrypt:

- przełącza klasę `menu-open`;
- aktualizuje `aria-expanded`;
- zamyka menu po wybraniu linku;
- nie ingeruje w nawigację strony głównej.

Na stronach prawnych logo i link powrotny pozostają widoczne bez rozwijanego menu.

## Dopasowanie układu

Nawigacja zachowuje charakter pływającego elementu. Na podstronach pozostaje górny odstęp treści, dzięki któremu kapsuła nie zasłania hero ani kart dokumentów prawnych. Uproszczona kapsuła stron prawnych może być węższa, ponieważ jej szerokość nadal wynika z zawartości.

## Dostępność i odporność

- Minimalny obszar interaktywny pozostaje zgodny z istniejącym `navigation.css`.
- Logo ma czytelną nazwę dostępną.
- Przycisk menu strony trenerów ma etykietę i poprawnie raportuje stan otwarcia.
- Zachowane zostają istniejące fallbacki dla braku `backdrop-filter` i `prefers-reduced-motion`.
- Wszystkie linki desktopowe oraz uproszczona nawigacja stron prawnych działają bez JavaScriptu.

## Implementacja

Najmniejsza wersja rozwiązania:

1. zachowuje wspólny `navigation.css`;
2. zmienia wyłącznie linki w istniejącej kapsule `dla-trenerow.html`;
3. upraszcza markup czterech stron prawnych do logo i jednego linku;
4. usuwa `public-navigation.js` ze stron prawnych, pozostawiając go tylko na stronie trenerów.

Nie wprowadzamy komponentów renderowanych przez JavaScript ani zmian po stronie serwera.

## Testowanie i kryteria akceptacji

Testy potwierdzają, że:

- podstrona trenerów zawiera dokładnie menu `Strona główna`, `Korzyści`, `Program`, `Jak dołączyć` i CTA `Zapisz się`;
- linki trenerskie prowadzą do właściwych sekcji lub strony głównej;
- cztery strony prawne zawierają `Wróć na stronę główną` i nie zawierają CTA ani kontrolki menu;
- tylko podstrona trenerów ładuje `public-navigation.js`;
- układ zachowuje właściwy odstęp nad hero i kartami prawnymi.

Po implementacji zostaną uruchomione pełne testy projektu oraz kontrola wizualna strony trenerów i reprezentatywnej strony prawnej na desktopie i mobile.

Zmiana jest gotowa, gdy kapsuły są wizualnie spójne ze stroną główną, etykiety odpowiadają kontekstowi strony, menu mobilne trenerów działa, strony prawne mają prosty powrót i żaden istniejący test nie ulega regresji.
