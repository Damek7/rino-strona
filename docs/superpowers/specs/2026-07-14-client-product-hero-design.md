# RinoMove Client Product Hero — Design

## Cel

Zastąpić trenerski hero na stronie głównej hero skierowanym do klienta. Pierwszy ekran ma w ciągu kilku sekund wyjaśniać, że RinoMove pozwala znaleźć trenera, sprawdzić termin i zarezerwować trening online.

## Zatwierdzony kierunek

Wariant C: produkt na pierwszym planie. Układ jest autorskim połączeniem prostoty i przestrzeni z inspiracji oraz wizualnego języka RinoMove; nie odwzorowuje bezpośrednio żadnej strony referencyjnej.

## Treść

- Eyebrow: „Bez wiadomości. Bez chaosu.”
- Nagłówek: „Trener i termin w kilku kliknięciach.”
- Opis: „Sprawdź doświadczenie, opinie i wolne terminy. Wybierz trening i zarezerwuj go online — bez pisania w kilku miejscach.”
- Główne CTA: „Znajdź trenera”, prowadzące do `#trenerzy`.
- Drugie CTA: „Załóż konto”, prowadzące do `panel.html#register`.
- Krótkie dowody użyteczności: zweryfikowane profile, aktualne terminy i rezerwacja online.

## Kompozycja desktopowa

Hero pozostaje wyśrodkowany względem zatwierdzonej nawigacji liquid glass. Lewa kolumna zawiera treść i CTA. Prawa kolumna pokazuje lekką, szklaną kompozycję produktu z trzema warstwami:

1. karta dostępnych terminów,
2. mała karta trenera,
3. mała karta oceny i liczby opinii.

Karty są demonstracją możliwości produktu, nie interaktywnym kalendarzem. Nie wymagają danych z bazy ani dodatkowego JavaScriptu.

## Kolory i motyw kropek

- Tło: ciepła biel z bardzo delikatnym przejściem w chłodny lawendowy odcień po prawej stronie.
- Tekst i główne CTA: istniejący grafit RinoMove.
- Akcent marki: malinowy `#C72562`.
- Akcent uzupełniający: przygaszony niebieski oparty na istniejącym `#A8BFE9`.
- Po lewej stronie ekranu znajduje się jedna duża, przygaszona różowa kropka.
- Po prawej stronie ekranu znajduje się jedna duża, przygaszona niebieska kropka.
- Kropki pozostają dekoracyjne, częściowo wychodzą poza ekran, mają niską nieprzezroczystość i nie konkurują z tekstem.

## Ruch i odczucie

Hero ma wyglądać spokojnie, premium i produktowo. Karty mogą mieć subtelne przesunięcie przy najechaniu, ale bez ciągłego pływania. Kropki nie animują się. Wszystkie przejścia dotyczą tylko konkretnych właściwości; nie używamy `transition: all`. Ustawienie `prefers-reduced-motion` wyłącza ruch dekoracyjny.

## Responsywność

- Desktop: dwie kolumny, produkt po prawej.
- Tablet i telefon: jedna kolumna, treść przed produktem.
- Na telefonie karty produktu układają się w zwartej kompozycji, bez poziomego przewijania.
- Kropki są mniejsze i bardziej przezroczyste na telefonie, aby nie ograniczać czytelności.
- CTA zachowują co najmniej 44 px wysokości; na wąskich ekranach mogą zajmować pełną szerokość.

## Dostępność

- Kropki mają `aria-hidden="true"`.
- Kompozycja produktu ma dostępny opis przez `aria-label`.
- Widoczne teksty kart nie są osadzone w obrazie.
- Kontrast tekstów i CTA pozostaje zgodny z istniejącą paletą strony.
- Fokus na CTA korzysta z istniejącego stylu globalnego.

## Zakres zmian

Zmiana obejmuje tylko hero i jego dedykowane style. Zatwierdzona nawigacja, kolejne sekcje, panel logowania, baza danych i podstrona trenerów pozostają bez zmian.

## Kryteria akceptacji

1. Hero używa zatwierdzonej treści klientowskiej i dwóch CTA.
2. Po prawej stronie widoczna jest kompozycja terminów, trenera i opinii.
3. Po bokach ekranu są dokładnie dwie dekoracyjne kropki: różowa po lewej i niebieska po prawej.
4. Kolory korzystają z istniejącej palety RinoMove i pozostają przygaszone.
5. Układ nie rozjeżdża się na szerokościach desktopowej i mobilnej.
6. Nawigacja oraz pozostałe sekcje nie zmieniają się.
7. Testy treści i struktury hero przechodzą, a widok jest sprawdzony w działającej przeglądarce.
