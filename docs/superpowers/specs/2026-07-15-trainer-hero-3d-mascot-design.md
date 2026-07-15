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
- Na głowie ma bordową czapkę z daszkiem, umiarkowanie za dużą — jak czapka ojca założona przez dziecko. Czapka jest około 20–30% za szeroka względem głowy, jest nasunięta nisko na czoło i fizycznie spoczywa na głowie bez szczeliny ani efektu lewitacji, ale nie dominuje nad całą postacią oraz nie zasłania oczu.
- Otwarta, rozluźniona lewa ręka postaci jedynie lekko dotyka daszka opuszkami. Nie chwyta, nie podtrzymuje ani nie unosi czapki. Prawa ręka pozostaje w naturalnej, prostej pozie.
- Na przednim panelu czapki znajduje się tylko napis `TRENER`, zapisany dokładnie w tej formie, jasnymi czytelnymi literami.
- Brak rakiet, piłek, dodatkowych postaci, podłoża, ramek, znaków wodnych i dodatkowych napisów.
- Asset końcowy ma przezroczyste tło, pełną sylwetkę i bezpieczny margines.

## Integracja

- Nowy plik: `assets/Rino-trener-3d-blue.png`.
- W `dla-trenerow.html` element `.hero-racket-stage` i trzy obrazy rakiet zostaną zastąpione pojedynczym elementem `.hero-mascot-stage` z obrazem `.hero-trainer-mascot`.
- Karty `.availability-card`, `.rating-card` i `.trainer-card` pozostaną widoczne i bez zmian treści. Maskotka zajmie dokładnie warstwę dawnych rakiet pod tymi kartami.
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
- Czapka jest bordowa, umiarkowanie za duża w efekcie „czapki ojca na dziecku”, spoczywa na głowie bez widocznej szczeliny i wyraźnie nachodzi na górną część czoła bez zasłaniania oczu.
- Napis `TRENER` jest poprawny i czytelny.
- Otwarta lewa ręka maskotki tylko lekko dotyka daszka opuszkami; nie chwyta, nie podtrzymuje ani nie unosi czapki.
- Karty kalendarza, oceny i profilu są widoczne, zachowują dotychczasową treść, a reszta strony pozostaje bez zmian.
- Desktop i mobile nie mają poziomego przewijania ani istotnego kadrowania postaci.
