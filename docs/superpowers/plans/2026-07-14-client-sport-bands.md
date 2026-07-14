# Client Sport Bands Implementation Plan

**Goal:** Zastąpić obecną sekcję dyscyplin dwoma ekranami po trzy pastelowe pasy sportowe, dodać brakujące ilustracje Rino oraz wdrożyć wordmark obok maskotki w nawigacji.

**Architecture:** Sekcja pozostaje statycznym HTML-em z osobnym arkuszem `sports.css`. Istniejący `IntersectionObserver` nadaje klasę `.is-visible`; CSS animuje wyłącznie dzieci pasa. Bez JavaScriptu treść pozostaje widoczna. Wordmark jest wycinany z dostarczonego obrazu do przezroczystego PNG i używany jako osobny obraz obok istniejącej maskotki.

**Tech Stack:** HTML, CSS, istniejący JavaScript, Node test runner, ImageGen/Pillow do zasobów PNG.

## Task 1: Test kontraktu

**Files:**
- Create: `test/sport-bands.test.js`

- [ ] Dodać test dwóch ekranów i sześciu sportów w zatwierdzonej kolejności.
- [ ] Sprawdzić opisy, linki, dwie etykiety `Wkrótce`, nowe pliki grafik oraz arkusz `sports.css`.
- [ ] Sprawdzić użycie wordmarku w nawigacji.
- [ ] Uruchomić test i potwierdzić oczekiwaną porażkę przed implementacją.

## Task 2: Zasoby graficzne

**Files:**
- Create: `assets/rino-move-wordmark.png`
- Create: `assets/Rino-squash.png`
- Create: `assets/Rino-plywanie.png`

- [ ] Usunąć zielone tło z dostarczonego wordmarku, przyciąć przezroczyste marginesy i zachować grafitowe litery.
- [ ] Sprawdzić istniejące ilustracje Rino dla tenisa, padla, golfa i boksu.
- [ ] Wygenerować spójne ilustracje Rino dla squasha i pływania bez prostokątnego tła.
- [ ] Zweryfikować kanał alfa, krawędzie oraz brak tekstu w nowych grafikach.

## Task 3: Nawigacja i sekcja sportów

**Files:**
- Modify: `index.html`
- Modify: `navigation.css`
- Create: `sports.css`

- [ ] Umieścić wordmark obok maskotki w logo nawigacji.
- [ ] Zastąpić obecną sekcję `#specjalizacje` dwoma grupami po trzy pasy.
- [ ] Dodać zatwierdzone nazwy, opisy, numery, cele linków i etykiety `Wkrótce`.
- [ ] Zbudować naprzemienny układ Rino/tekst i pastelową paletę.
- [ ] Dodać jednorazowe animacje wejścia, hover, fokus i `prefers-reduced-motion`.
- [ ] Zachować widoczność treści bez JavaScriptu.

## Task 4: Weryfikacja

**Files:**
- Verify: `index.html`
- Verify: `sports.css`
- Verify: `navigation.css`
- Verify: `test/sport-bands.test.js`

- [ ] Uruchomić nowy test, a następnie cały zestaw `npm test`.
- [ ] Sprawdzić widok `1440 × 1000` i `390 × 844` bez poziomego przewijania.
- [ ] Sprawdzić kolejność animacji, fokus klawiatury i ograniczenie ruchu.
- [ ] Po ukończeniu przejść do następnego folderu inspiracji bez dodatkowego pytania.
