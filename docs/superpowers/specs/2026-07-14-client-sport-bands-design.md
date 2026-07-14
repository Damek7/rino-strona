# RinoMove Client Sport Bands — Design

## Cel

Przebudować istniejącą sekcję `#specjalizacje` w wizualny wybór sportu skierowany do klientów. Sekcja ma pokazywać sześć dyscyplin w ruchu, zachęcać do rozpoczęcia treningu i zachować lekki, pastelowy charakter hero.

## Źródła inspiracji

- ClickUp: czytelna hierarchia, duże nazwy i ujawnianie treści podczas przewijania.
- Craft: płynny ruch poziomy, dużo przestrzeni i proste powierzchnie.
- Fluz: pastelowe powierzchnie, duże obiekty oraz delikatny ruch zależny od przewijania.

Kierunek jest autorskim połączeniem tych zasad. Nie kopiujemy układu ani komponentów żadnej strony.

## Zatwierdzony układ

Sekcja składa się z dwóch kolejnych ekranów. Każdy ekran zawiera trzy szerokie, poziome pasy.

Ekran pierwszy:

1. Tenis;
2. Padel;
3. Squash.

Ekran drugi:

4. Golf;
5. Pływanie;
6. Boks.

Na desktopie trzy pasy z jednego ekranu mieszczą się razem w wysokości zbliżonej do jednego widoku przeglądarki. Pasy mają wspólne marginesy i niewielkie przerwy, ale nie są zamknięte w dodatkowej karcie sekcji.

## Budowa pasa

Każdy pas zawiera:

- nazwę dyscypliny;
- jednozdaniowy opis;
- mały numer od `01` do `06`;
- ilustrację Rino wykonującego czynność związaną ze sportem;
- dyskretną strzałkę wskazującą przejście do trenerów lub zapisów.

Układ naprzemienny:

- pasy `01`, `03` i `05`: Rino po lewej, treść po prawej;
- pasy `02`, `04` i `06`: treść po lewej, Rino po prawej.

## Treść

1. **Tenis** — `Od pierwszego odbicia do pewnej gry na korcie.`
2. **Padel** — `Poznaj zasady, złap rytm i wejdź do gry.`
3. **Squash** — `Technika i intensywność dopasowane do Twojego poziomu.`
4. **Golf** — `Spokojny start, lepszy swing i więcej pewności.`
5. **Pływanie** — `Technika, oddech i swoboda w wodzie.`
6. **Boks** — `Praca nóg, technika i kondycja bez chaosu.`

Tenis, Padel, Golf i Boks prowadzą do `#trenerzy`. Squash i Pływanie, które nie mają jeszcze trenerów w danych strony, prowadzą do `#zapisy` i otrzymują małą etykietę `Wkrótce`.

## Kolory

- Tenis: pastelowa mięta.
- Padel: pudrowy błękit.
- Squash: jasna lawenda z grafitowym tekstem.
- Golf: ciepły pastelowy żółty.
- Pływanie: jasny aqua.
- Boks: delikatny róż.

Tekst pozostaje grafitowy. Malinowy `#C72562` jest używany tylko w numerach, strzałkach i drobnych detalach.

## Ilustracje Rino

Istniejące zasoby Rino dla tenisa, padla, golfa i boksu zostają wykorzystane po sprawdzeniu ich jakości oraz krawędzi. Powstają dwa nowe spójne zasoby:

- `assets/Rino-squash.png` — Rino uderza rakietą squashową;
- `assets/Rino-plywanie.png` — Rino płynie w wodzie w sportowej pozie.

Ilustracje nie zawierają tekstu, dodatkowych logotypów ani prostokątnego tła.

## Animacja

Każdy pas uruchamia jednorazową animację po wejściu do widoku:

1. W pasach `01`, `03` i `05` Rino wjeżdża z lewej, a w pasach `02`, `04` i `06` z prawej, na odległości `60 px`; lekko się obraca i kończy małym przeskalowaniem.
2. Numer pojawia się przez zmianę opacity.
3. Nazwa oraz opis odsłaniają się z niewielkiego przesunięcia, rozmycia `4 px` i maski `clip-path`.
4. Strzałka pojawia się jako ostatnia.

Animacja jednego pasa trwa około `650 ms`. Elementy wewnątrz pasa mają opóźnienie `80–120 ms`. Pasy nie pływają w nieskończoność. Przy najechaniu Rino może przesunąć się o maksymalnie `8 px`, a strzałka o `4 px`.

Istniejący `IntersectionObserver` nadaje klasę `.is-visible`, więc nie dodajemy nowej biblioteki animacji ani osobnego systemu obserwacji.

`prefers-reduced-motion: reduce` pokazuje wszystkie elementy od razu i wyłącza transformacje.

## Responsywność

- Desktop: trzy pasy tworzą jeden ekran, a treść i Rino pozostają obok siebie.
- Tablet: pasy są niższe, ale nadal poziome.
- Telefon: każdy pas zachowuje proporcję podłużną; Rino zajmuje około `38–42%` szerokości, a treść pozostałą część.
- Tekst nie może nachodzić na ilustrację.
- Sekcja nie może powodować poziomego przewijania.

## Dostępność

- Każdy pas jest linkiem z czytelną nazwą dostępną.
- Ilustracje Rino mają pusty `alt`, ponieważ nazwę i opis przekazuje tekst pasa.
- Fokus klawiatury jest widoczny na całym pasie.
- Numery są dekoracyjne i mają `aria-hidden="true"`.
- Treść pozostaje widoczna bez JavaScriptu; animacja jest wyłącznie ulepszeniem.

## Zakres

Zmiana obejmuje wyłącznie sekcję `#specjalizacje`, jej dedykowany arkusz stylów, dwa nowe zasoby Rino oraz test kontraktu sekcji. Hero, nawigacja, trenerzy i dalsze sekcje pozostają bez zmian.

## Kryteria akceptacji

1. Sekcja zawiera dokładnie sześć pasów w dwóch grupach po trzy.
2. Kolejność to Tenis, Padel, Squash, Golf, Pływanie, Boks.
3. Każdy pas zawiera numer, nazwę, opis, Rino i strzałkę.
4. Rino oraz treść pojawiają się przy przewijaniu, bez zapętlonej animacji.
5. Squash i Pływanie mają własne ilustracje oraz etykietę `Wkrótce`.
6. Wszystkie pasy są dostępne klawiaturą i mają działające cele linków.
7. Sekcja działa przy `1440 × 1000` i `390 × 844` bez poziomego przewijania.
8. `prefers-reduced-motion` wyłącza ruch.
9. Testy projektu przechodzą bez błędów.
