# Maskotka 3D w hero strony dla trenerów

## Cel

Zastąpić trzy rakiety w hero podstrony `dla-trenerow.html` nową maskotką Rino 3D skierowaną do trenerów, bez zmiany tekstów, kart informacyjnych ani pozostałych sekcji strony.

## Rozważone warianty

1. Render całego prawego panelu razem z kartami. Zapewnia pełną kontrolę kompozycji, ale zamienia czytelne elementy HTML w obraz i pogarsza responsywność.
2. Pełna podmiana prawego panelu na samą maskotkę. Jest najprostsza, lecz usuwa kontekst kalendarza, oceny i profilu trenera.
3. Transparentna maskotka osadzona jako osobna warstwa w istniejącym hero. Zachowuje działający układ, dostępność i karty, a jednocześnie realizuje podmianę rakiet.

Wybrany jest wariant 3.

## Kierunek wizualny

- Jedna pełna postać Rino w miękkim, przyjaznym stylu 3D zgodnym z istniejącymi plikami `Rino-*-3d-blue.png`.
- Kanoniczna sylwetka: jasnoniebieskie ciało, dwie antenki zakończone kulkami, krótkie kończyny, dwa grafitowe oczy i prosty uśmiech; bez symbolu na tułowiu.
- Postać stoi frontem w swobodnej, pewnej pozie.
- Na głowie ma celowo zdecydowanie za dużą bordową czapkę z daszkiem. Czapka jest szeroka, nisko osadzona i lekko zsunięta, aby przesadna skala była jednoznacznie zamierzona.
- Lewa ręka postaci podtrzymuje daszek czapki. Prawa ręka pozostaje w naturalnej, prostej pozie.
- Na przednim panelu czapki znajduje się tylko napis `TRENER`, zapisany dokładnie w tej formie, jasnymi czytelnymi literami.
- Brak rakiet, piłek, dodatkowych postaci, podłoża, ramek, znaków wodnych i dodatkowych napisów.
- Asset końcowy ma przezroczyste tło, pełną sylwetkę i bezpieczny margines.

## Integracja

- Nowy plik: `assets/Rino-trener-3d-blue.png`.
- W `dla-trenerow.html` element `.hero-racket-stage` i trzy obrazy rakiet zostaną zastąpione pojedynczym elementem `.hero-mascot-stage` z obrazem `.hero-trainer-mascot`.
- Karty `.availability-card`, `.rating-card` i `.trainer-card` pozostaną bez zmian.
- Style maskotki zostaną dodane w istniejącym lokalnym arkuszu strony, ze skalą i pozycją dopasowaną osobno dla desktopu, tabletu i telefonu.
- Wejście maskotki będzie krótkie i subtelne; `prefers-reduced-motion: reduce` wyłączy animację.

## Dostępność i zachowanie

- Kontener grafiki otrzyma `role="img"` oraz opis maskotki trenerskiej.
- Sam obraz będzie dekoracyjny względem opisu kontenera (`alt=""`, `aria-hidden="true"`).
- Postać nie może powodować poziomego przewijania ani zasłaniać tekstu hero.
- Na mobile tekst pozostaje przed grafiką, a napis na czapce musi pozostać czytelny.

## Weryfikacja

- Test kontraktowy potwierdzi obecność nowego assetu i klas oraz brak trzech odwołań do rakiet na podstronie trenerów.
- Plik PNG musi mieć kanał alfa, przezroczyste narożniki i niezerowy obszar postaci.
- Pełny zestaw testów projektu ma przechodzić.
- Widok zostanie sprawdzony w przeglądarce przy 1440 × 1000 i 390 × 844 pod kątem kompozycji, czytelności napisu, poprawnej lewej ręki i braku overflow.

## Kryteria akceptacji

- Rakiety zniknęły wyłącznie z hero podstrony dla trenerów.
- W ich miejscu widoczna jest jedna spójna z marką maskotka Rino 3D.
- Czapka jest bordowa, wyraźnie za duża i znajduje się na głowie.
- Napis `TRENER` jest poprawny i czytelny.
- Lewa ręka maskotki podtrzymuje daszek.
- Karty kalendarza, oceny i profilu oraz reszta strony pozostają bez zmian.
- Desktop i mobile nie mają poziomego przewijania ani istotnego kadrowania postaci.
