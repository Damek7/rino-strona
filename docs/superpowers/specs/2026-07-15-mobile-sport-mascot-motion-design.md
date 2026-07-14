# Ruch stworka w kafelkach sportów na telefonie

## Cel

Zatrzymać animację obrazka stworka po dotknięciu kafelka sportu na urządzeniach dotykowych, bez zmiany efektu na komputerze.

## Zakres

- Animacja obrazka przy najechaniu pozostaje dostępna wyłącznie dla urządzeń z precyzyjnym wskaźnikiem i obsługą hover.
- Na telefonach i innych urządzeniach dotykowych obrazek nie przesuwa się ani nie obraca po dotknięciu kafelka.
- Efekt strzałki, linki oraz układ kafelków pozostają bez zmian.

## Implementacja i weryfikacja

Reguły ruchu obrazka w `sports.css` zostaną objęte zapytaniem mediów `hover: hover` oraz `pointer: fine`. Test regresyjny potwierdzi to ograniczenie; po zmianie zostaną uruchomione testy projektu i sprawdzony widok mobilny.
