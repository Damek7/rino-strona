# RinoMove — prowadzona ścieżka strony głównej

## Cel

Uporządkować stronę główną wokół jednej ścieżki klienta: wybór sportu, zrozumienie procesu, zbudowanie zaufania i przejście do wyszukiwarki trenerów. Strona ma być oryginalnym połączeniem wniosków ze wszystkich folderów `inspiracje/`, bez kopiowania układu lub komponentów konkretnej marki.

## Założenie produktowe

Strona główna jest skierowana przede wszystkim do osoby szukającej trenera. Trener pozostaje ważnym odbiorcą, ale jego wejście ma postać krótkiej, wyraźnie oddzielonej sekcji prowadzącej do `dla-trenerow.html`. Główne CTA klienta prowadzi do `panel.html`.

## Synteza inspiracji

- Nawigacja: mała liczba decyzji, jedno dominujące CTA i spokojna powierzchnia inspirowana przejrzystością Craft i Duolingo.
- Hero: jedna obietnica, wyrazisty obiekt marki i szybkie przejście do działania; wnioski z Headspace, Maze, MindMarket i ClickUp.
- Oferta i funkcje: duże, modularne bloki o czytelnej hierarchii zamiast siatki jednakowych kart; wnioski z Craft, Fluz, Maze i ClickUp.
- Ruch: krótkie, jednorazowe wejścia oraz subtelna reakcja na hover, bez ukrywania treści; wnioski z Ctrl, Arc, Headspace i Slush.
- Typografia i kolor: grafitowa typografia, ciepła biel, malinowy jako sygnał działania, lawenda i pastele do kodowania sportów; zgodne z marką RinoMove i inspirowane rytmem stron z folderu `11_Typografia_i_kolory`.
- Layout: narracja od problemu do rozwiązania i działania, z naprzemiennym rytmem jasnych i ciemnych powierzchni; synteza folderu `12_Layout_i_uklad`.
- Foldery cen, opinii, dashboardów i mobile są puste. Ich rolę pokrywają istniejący kontekst produktu, panel, zasady marki oraz projekt responsywny opisany poniżej; nie są wymyślane osobne sekcje bez materiału i potrzeby.

## Architektura strony

1. **Nawigacja** — logo, „Znajdź trenera”, „Jak to działa”, „Dla trenerów”, logowanie i jedno główne „Załóż konto”.
2. **Hero** — istniejąca obietnica i scena trzech rakiet. Główne CTA prowadzi do panelu; drugie przewija do procesu.
3. **Wybór sportu** — sześć pastelowych pasów z Rino, zachowanych jako szybkie wejścia do konkretnej intencji.
4. **Jak to działa** — centralna przebudowa: trzy kolejne etapy połączone linią procesu. Każdy etap zawiera krótką korzyść i własny miniaturowy podgląd interfejsu: profil, kalendarz oraz potwierdzona płatność.
5. **Dowody zaufania** — jeden szeroki moduł pokazujący, że profil jest zweryfikowany, cena jawna, a opinia pochodzi po odbytym treningu. Ma zastąpić rozproszone deklaracje i nie używa fikcyjnych logotypów klientów.
6. **Produkt w praktyce** — istniejące korzyści (profil, kalendarz, płatność, kontakt) zostają zebrane w dwa większe bloki o różnym ciężarze, aby skrócić stronę i usunąć puste odcinki.
7. **Dla trenerów** — ciemny, drugorzędny moduł z czterema korzyściami i CTA do osobnej podstrony.
8. **Konto i lista oczekujących** — konto klienta/trenera pozostaje wejściem do działającego prototypu. Lista oczekujących służy przede wszystkim sportom oznaczonym „Wkrótce”, nie konkuruje z głównym CTA w hero.
9. **FAQ i stopka** — zwięzłe domknięcie bez ponownego opowiadania całej oferty.

## Projekt sekcji „Jak to działa”

Sekcja ma jasne tło i szeroki kontener. Nagłówek po lewej mówi „Od wyboru do treningu w trzech prostych krokach”, a po prawej znajduje się krótka obietnica „Bez telefonów, przeklejania linków i niejasnych cen”.

Trzy etapy tworzą jeden proces:

1. **Porównaj właściwe osoby** — sport, dzielnica, doświadczenie, certyfikaty i opinie.
2. **Wybierz wolny termin** — kalendarz pokazuje dostępność bez wymiany wiadomości.
3. **Zapłać i przyjdź na trening** — jasna cena, płatność online i potwierdzenie w jednym miejscu.

Na desktopie kroki są trzema kolumnami połączonymi cienką linią, ale różnią się pozycją miniaturowego UI, dzięki czemu nie wyglądają jak trzy identyczne kafelki. Na telefonie tworzą pionową oś z linią po lewej, numerami oraz treścią po prawej. Elementy UI są semantycznie dekoracyjne; pełna treść pozostaje tekstem HTML.

## Zachowanie i animacja

- Treść jest widoczna domyślnie. JavaScript dodaje ruch jako ulepszenie, nigdy jako warunek wyświetlenia.
- Element może wejść z `opacity: 0`, `translateY(12px)` i `blur(4px)` tylko wtedy, gdy skrypt potwierdzi aktywnego obserwatora; stan awaryjny po krótkim czasie pokazuje wszystko.
- Hover używa przerwań CSS i przesunięć maksymalnie `4–8px`.
- Przyciski reagują skalą `0.96` podczas naciśnięcia.
- `prefers-reduced-motion: reduce` wyłącza przesunięcia, rozmycie i płynne przewijanie.
- Nie używamy `transition: all` ani zapętlonych animacji sekcji treściowych.

## Styl wizualny

- Tło: ciepła biel i bardzo jasne powierzchnie różowo-lawendowe.
- Tekst: grafit `#1C1B20`.
- Główne działanie: malinowy `#C72562` lub grafit, zależnie od powierzchni.
- Akcent chłodny: Rino blue `#A8BFE9`.
- Karty mają koncentryczne promienie i subtelne, warstwowe cienie zamiast ciężkich obramowań.
- Nagłówki używają `text-wrap: balance`, teksty opisowe `text-wrap: pretty`, a liczby `font-variant-numeric: tabular-nums`.

## Responsywność i dostępność

- Widoki referencyjne: `1440 × 1000` i `390 × 844`.
- Brak poziomego przewijania przy szerokości `320px` i większej.
- Minimalny obszar dotyku elementów interaktywnych: `44 × 44px`.
- Zachowana poprawna kolejność nagłówków, jeden `h1`, widoczny fokus i działanie klawiaturą.
- Dekoracyjne miniatury procesu są ukryte przed czytnikami; komunikat procesu nie zależy od koloru.
- Strona pozostaje czytelna bez JavaScriptu i przy niedostępnych obrazach.

## Zakres plików

- `index.html` — kolejność i markup sekcji procesu oraz zaufania, bez zmiany działania panelu i formularza.
- `journey.css` — dedykowane style nowego procesu i modułu zaufania.
- `features.css` — ograniczona korekta istniejących bloków produktu i bezpieczny fallback animacji.
- `test/homepage-journey.test.js` — kontrakt struktury, treści, linków i progressive enhancement.

Nie zmieniamy backendu, panelu, danych trenerów, autoryzacji ani podstrony trenerów.

## Kryteria akceptacji

1. Strona prowadzi klienta logicznie od wyboru sportu przez proces i zaufanie do wyszukiwarki.
2. „Jak to działa” zawiera dokładnie trzy zatwierdzone kroki i trzy czytelne miniatury produktu.
3. Moduł zaufania komunikuje weryfikację profilu, jawną cenę i opinię po treningu.
4. Trenerzy mają jedno drugorzędne wejście do `dla-trenerow.html`.
5. Lista oczekujących nie jest głównym CTA hero.
6. Treść sekcji nie znika bez przewijania, bez JavaScriptu ani przy niespełnieniu warunku animacji.
7. Widoki desktop i mobile nie mają pustych odcinków powodowanych ukrytym contentem ani poziomego overflow.
8. Ruch respektuje `prefers-reduced-motion` i nie używa `transition: all`.
9. Wszystkie istniejące i nowe testy przechodzą.
