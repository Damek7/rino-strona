# RinoMove Client Animated Racket Hero — Design

## Cel

Pierwszy ekran strony głównej jest przeznaczony wyłącznie dla klientów. Ma jasno pokazać, że RinoMove pomaga znaleźć zweryfikowanego trenera i zarezerwować trening bez telefonów oraz przeszukiwania internetu.

## Zatwierdzony kierunek

Hero ma dwie strefy. Po lewej znajduje się spokojny, czytelny przekaz marketingowy. Po prawej trzy osobne rakiety 3D bez tła: czarna squashowa, pastelowo błękitna padlowa oraz pastelowo zielona tenisowa na pierwszym planie. Rakiety zajmują prawie całą prawą połowę ekranu i nie są zamknięte w karcie, ramce ani prostokątnym obrazie.

Nie pokazujemy kalendarza, panelu trenera ani korzyści administracyjnych na stronie głównej. Te elementy należą do `dla-trenerow.html`.

## Treść

- Eyebrow: `Ruch zaczyna się od właściwej osoby`.
- Nagłówek: `Znajdź trenera, z którym naprawdę zaczniesz.`
- Opis: `Wybierz sport, porównaj zweryfikowane profile i zarezerwuj pierwszy trening — bez telefonów i szukania po całym internecie.`
- Główne CTA: `Znajdź trenera` → `#trenerzy`.
- Drugie CTA: `Zobacz, jak to działa` → `#jak-to-dziala`.
- Dowody użyteczności: `Zweryfikowane profile`, `Jasna cena`, `Rezerwacja online`.

## Typografia

Kierunek korzysta z prostoty widocznej w inspiracjach Maze i Craft, bez kopiowania ich układów.

- Nagłówek pozostaje w Manrope, ale używa wagi `700` zamiast ciężkiego `800`.
- Rozmiar nagłówka jest mniejszy niż w poprzedniej wersji, a interlinia wynosi około `1.02`.
- Maksymalna szerokość nagłówka wymusza spokojne, trzy- lub czterowierszowe łamanie zamiast wysokiego bloku pojedynczych słów.
- Opis używa DM Sans, większej interlinii i szerokości ułatwiającej szybkie czytanie.
- Eyebrow pozostaje mały i malinowy, ale ma mniej agresywny rozstrzał liter.

## Kompozycja i kolory

- Tło hero: ciepła biel z bardzo delikatnym przejściem w chłodny błękit.
- Tekst: grafit `#1C1B20`.
- Główny akcent: malinowy `#C72562`.
- Akcent chłodny: błękit Rino `#A9D4EA`.
- Po lewej krawędzi: jedna częściowo ucięta, przygaszona różowa kropka.
- Po prawej krawędzi: jedna częściowo ucięta, przygaszona niebieska kropka.
- Rakiety mają transparentne tło i miękki cień CSS, który oddziela je od tła strony.
- Zielona rakieta tenisowa jest największa i przykrywa częściowo dwie pozostałe.

## Animacja wejścia

Rakiety pojawiają się osobno tylko przy wejściu na stronę:

1. squashowa wpada z lewej strony prawej kolumny, lekko obracając się do przodu;
2. padlowa wpada z prawej z krótkim opóźnieniem;
3. tenisowa wyskakuje na końcu ze środka, ma największą skalę i kończy na pierwszym planie.

Cała sekwencja trwa około `0.9 s`. Odstęp pomiędzy startami wynosi około `120–150 ms`. Ruch używa miękkiego sprężystego wyhamowania z niewielkim, jednorazowym przeskalowaniem ponad rozmiar końcowy. Po zakończeniu rakiety pozostają nieruchome. Nie dodajemy ciągłego pływania ani zapętlonej animacji.

`prefers-reduced-motion: reduce` wyłącza transformacje i pokazuje wszystkie trzy rakiety od razu.

## Zachowanie responsywne

- Desktop: tekst zajmuje około `45%`, a scena rakiet około `55%` szerokości hero.
- Rakiety mogą zbliżyć się do prawej krawędzi ekranu, ale nie mogą powodować poziomego przewijania.
- Tablet i telefon: tekst jest pierwszy, a scena rakiet znajduje się pod CTA.
- Na telefonie zachowujemy nakładanie i kolejność głębi, ale scena jest niższa i mieści całe główki oraz uchwyty rakiet.
- CTA mają minimum `44 px` wysokości; na wąskim ekranie główne CTA wypełnia szerokość.

## Zasoby graficzne

Powstają trzy osobne pliki PNG z kanałem alfa:

- `assets/hero-racket-squash.png`;
- `assets/hero-racket-padel.png`;
- `assets/hero-racket-tennis.png`.

Każdy plik przedstawia jedną rakietę w uzgodnionym stylu 3D. Nie zawiera tła, tekstu, znaku wodnego, dodatkowych piłek ani innych przedmiotów.

## Dostępność

- Cała scena ma jeden opis alternatywny wskazujący trzy rodzaje rakiet; pozostałe obrazy są dekoracyjne.
- Kropki są dekoracyjne i mają `aria-hidden="true"`.
- Hierarchia zaczyna się od jednego `h1`.
- Fokus CTA korzysta z istniejących, widocznych stylów.
- Tekst nie jest osadzony w obrazie.

## Zakres

Zmiana obejmuje markup hero w `index.html`, arkusz `hero.css`, trzy przezroczyste zasoby rakiet oraz test kontraktu hero. Nawigacja, kolejne sekcje, logowanie, baza danych i podstrona trenerów pozostają bez zmian.

Po zatwierdzeniu hero kolejne foldery inspiracji `03`–`12` będą realizowane osobno, po kolei i z osobnym podglądem do zatwierdzenia.

## Kryteria akceptacji

1. Rakiety nie mają widocznego prostokątnego tła, karty, obramowania ani ramki.
2. Trzy rakiety są osobnymi elementami i pojawiają się kolejno: squash, padel, tenis.
3. Zielona rakieta tenisowa jest największa i znajduje się na pierwszym planie.
4. Scena zajmuje prawą część hero bez poziomego przewijania.
5. Typografia jest lżejsza, spokojniej łamana i czytelna na desktopie oraz telefonie.
6. Dokładnie dwie przygaszone kropki pozostają przy krawędziach ekranu.
7. `prefers-reduced-motion` pokazuje rakiety bez animacji.
8. Nawigacja i dalsze sekcje pozostają bez zmian.
9. Testy projektu przechodzą bez błędów.
