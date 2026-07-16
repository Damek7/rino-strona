# Stworek z dużą czapką w hero panelu klienta

## Cel

W hero wyszukiwarki trenerów należy zastąpić obecnego niebieskiego stworka z rakietą wariantem Rino trzymającym zbyt dużą bordową czapkę. Z czapki ma zniknąć wyłącznie biały napis „TRENER”.

## Asset i edycja

Punktem wyjścia jest `assets/Rino-trener-3d-blue.png`. Edycja obrazu ma:

- zachować tego samego stworka, pozę, mimikę, proporcje i sposób trzymania czapki;
- zachować bordowy kolor, szwy, daszek, światło i materiał czapki;
- usunąć wyłącznie napis „TRENER” i naturalnie odtworzyć pod nim fakturę materiału;
- zachować przezroczyste tło oraz czyste, miękkie krawędzie;
- nie dodawać żadnego nowego tekstu, logo ani przedmiotów.

Oryginalny plik pozostaje bez zmian. Wynik zostanie zapisany jako osobny, jasno nazwany asset produkcyjny.

## Integracja

W `panel.html` źródło `.heading-rino` zostanie podmienione na nowy asset, a tekst alternatywny opisze Rino z dużą czapką. `panel.css` zostanie zmieniony tylko wtedy, gdy będzie to konieczne do zachowania czytelnego kadru na desktopie i mobile.

Stworek nadal pozostaje dekoracją po prawej stronie niebieskiego hero. Nie może zasłaniać nagłówka, opisu ani formularza wyszukiwania. Na ekranie 390 px cała twarz i rozpoznawalna część czapki muszą pozostać widoczne bez przewijania poziomego.

## Weryfikacja

- kontrola obrazu: brak napisu i artefaktów, poprawna przezroczystość;
- testy DOM wskazują nowy asset i poprawny tekst alternatywny;
- zrzuty desktop 1440 px i mobile 390 px potwierdzają poprawne kadrowanie;
- pełny zestaw testów projektu pozostaje zielony.
