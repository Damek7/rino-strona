# Maskotka trenera poniżej hero

## Cel

Usunąć maskotkę Rino z hero podstrony `dla-trenerow.html` i umieścić ją niżej, przy sekcji „Czym jest RinoMove?”. Hero ma prezentować wyłącznie tekst oraz karty kalendarza, oceny i profilu trenera.

## Rozważone warianty

1. Osobny pas z samą maskotką między hero a następną sekcją. Zapewnia pełne oddzielenie, ale tworzy pustą przestrzeń bez treści.
2. Maskotka obok istniejącej karty „Czym jest RinoMove?”. Łączy postać z realną treścią i jednoznacznie przenosi ją poza hero bez dodawania nowej sekcji informacyjnej.
3. Maskotka zachodząca na granicę hero i kolejnej sekcji. Jest dynamiczna, ale może nadal wyglądać jak część hero.

Wybrany jest wariant 2.

## Układ

- Z `.hero-visual` zostaje usunięty kontener `.hero-mascot-stage` wraz z obrazem.
- Kalendarz wykorzystuje odzyskaną szerokość prawej kolumny, a hero nie zachowuje wysokości potrzebnej wcześniej dla maskotki.
- Sekcja `.manifesto` otrzymuje wewnętrzny układ z kartą tekstową po lewej i osobnym kontenerem `.trainer-mascot-showcase` po prawej.
- Kontener niższej maskotki używa assetu `assets/Rino-trener-3d-blue.png`, ma własny opis dostępności i nie zachodzi na kartę tekstową.
- Przy szerokości do 900 px układ przechodzi do jednej kolumny: karta manifesto znajduje się pierwsza, a maskotka pod nią.
- Przy szerokości do 620 px maskotka jest zmniejszona, ale zachowuje pełną sylwetkę i czytelny napis `TRENER`.

## Zachowanie hero po usunięciu maskotki

- Desktop: `.hero-visual` ma zwartą wysokość wystarczającą na kalendarz, ocenę i kartę Marka.
- Tablet: karty zachowują ten sam porządek i nie wychodzą poza prawą kolumnę.
- Mobile: wysokość `.hero-visual` zostaje zmniejszona z wartości przeznaczonej dla maskotki do wartości potrzebnej wyłącznie kartom.
- Wszystkie karty pozostają widoczne i nie powodują poziomego przewijania.

## Kryteria akceptacji

- W `.trainer-home-hero` nie ma maskotki ani elementów o klasach `.hero-mascot-stage` i `.hero-trainer-mascot`.
- Asset maskotki występuje dokładnie raz poniżej zamknięcia hero, w `.trainer-mascot-showcase` wewnątrz sekcji `.manifesto`.
- Kalendarz, ocena i karta `Marek Kowalski` pozostają w hero.
- Na desktopie maskotka stoi obok karty „Czym jest RinoMove?”.
- Na tablecie i telefonie maskotka znajduje się pod kartą manifesto.
- Widoki 1440 × 1000, 768 × 900 i 390 × 844 nie mają poziomego przewijania.

## Weryfikacja

- Test kontraktowy sprawdza położenie markupu maskotki poza hero i wewnątrz manifesto.
- Test kontraktowy sprawdza usunięcie styli hero maskotki oraz obecność styli nowego kontenera.
- Pełny zestaw testów projektu przechodzi.
- Desktop, tablet i mobile zostają sprawdzone w prawdziwej przeglądarce.
