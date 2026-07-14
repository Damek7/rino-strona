# Client Feature Cards Implementation Plan

**Goal:** Dodać cztery klientowe karty korzyści między wyborem sportu a listą trenerów.

**Architecture:** Statyczny HTML i osobny `features.css`. Istniejący observer `.reveal` uruchamia wejście kart; treść pozostaje widoczna bez JS. Miniatury funkcji są prostymi elementami HTML/CSS.

## Task 1: Test kontraktu

- [ ] Utworzyć `test/feature-cards.test.js`.
- [ ] Sprawdzić pozycję sekcji, cztery karty, zatwierdzone nagłówki i arkusz CSS.
- [ ] Uruchomić test i potwierdzić oczekiwaną porażkę.

## Task 2: Sekcja i styl

- [ ] Dodać `features.css` po `sports.css`.
- [ ] Dodać `#korzysci` między sportami i trenerami.
- [ ] Zbudować cztery różne miniatury produktu bez zewnętrznych ikon.
- [ ] Dodać responsywną siatkę, fokus tekstu i jednorazowe wejście.

## Task 3: Weryfikacja

- [ ] Uruchomić nowy test i pełne `npm test`.
- [ ] Sprawdzić `1440 × 1000` i `390 × 844` bez poziomego przewijania.
- [ ] Po weryfikacji przejść bez pytania do folderu `05_Cenniki`.
