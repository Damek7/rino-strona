# Rino — strona

Prototyp strony platformy łączącej klientów z trenerami sportów premium.

## Zawartość

- `Home.dc.html` — strona główna,
- `Wybor specjalizacji.dc.html` — ekran wyboru specjalizacji,
- `assets/` — grafiki maskotki Rino,
- `support.js` — środowisko uruchomieniowe prototypu.
- `panel.html` + `panel.js` — interaktywny prototyp kalendarza, rezerwacji, czatu i przypomnień (dane lokalne w przeglądarce).

Projekt jest prototypem i przed wdrożeniem produkcyjnym wymaga podłączenia formularza, przygotowania polityki prywatności oraz dopracowania wersji mobilnej i dostępności.

## Uruchomienie pełnego prototypu

W katalogu `strona` uruchom `npm start`, a następnie otwórz `http://localhost:8787/panel.html`.

Backend udostępnia wyszukiwarkę trenerów (`GET /api/trainers`) oraz rejestrację, logowanie, sesję i wylogowanie (`/api/auth/*`). Lokalne dane kont są zapisywane w ignorowanym przez Git katalogu `data/`.
