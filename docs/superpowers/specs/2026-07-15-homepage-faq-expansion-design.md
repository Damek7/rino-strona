# Rozbudowa FAQ na stronie głównej

## Cel

Rozwinąć istniejącą sekcję „Częste pytania” na stronie głównej RinoMove tak, aby odpowiadała zarówno osobom szukającym treningu, jak i trenerom rozważającym dołączenie do platformy.

## Zakres

- Zachować aktualny akordeon, jego wygląd i zasadę jednego otwartego pytania naraz.
- Zastąpić obecną listę pięciu wpisów listą ośmiu pytań, bez etykiet grup docelowych.
- Nie zmieniać pozostałych sekcji ani zachowania formularza.

## Treść FAQ

1. Ile kosztuje trening?
2. Jak płacę za trening?
3. Czy mogę odwołać lub przełożyć trening?
4. Czy działacie tylko w Warszawie?
5. Szukam trenera dla dziecka. Pomożecie?
6. Jestem trenerem — ile to kosztuje?
7. Jak dołączam jako trener?
8. Kiedy otrzymam zgłoszenia od klientów?

Odpowiedzi będą zwięzłe, po polsku i spójne z aktualnymi deklaracjami strony: start w Warszawie, płatność online oraz bezpłatny program dla trenerów-założycieli.

## Implementacja i weryfikacja

Zmiana ograniczy się do danych FAQ w `index.html`. Test regresyjny potwierdzi, że renderowany zestaw zawiera dokładnie osiem zatwierdzonych pytań; następnie uruchomione zostaną testy projektu oraz ręczna kontrola w przeglądarce.
