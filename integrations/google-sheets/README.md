# Google Sheets webhook dla zgłoszeń trenerów

Arkusz: [RinoMove — zgłoszenia trenerów](https://docs.google.com/spreadsheets/d/1KSEgWsqJXN8c7ZVZ780WrI_RBt0ZHW8pvsoAczWTzdo)

Pierwszy wiersz arkusza powinien zawierać kolumny w tej kolejności:

Data zgłoszenia | Imię i nazwisko | E-mail | Telefon | Profil | Dyscyplina | Miasto | Dzielnica | Model pracy | Przyjmuje klientów | Główna potrzeba | Blokada | Status kwalifikacji | Źródło | Status kontaktu | Notatki | Właściciel

1. Utwórz projekt na [script.google.com](https://script.google.com) i wklej zawartość `Code.gs`.
2. W ustawieniach projektu dodaj właściwość skryptu `WEBHOOK_SECRET` z losową, długą wartością.
3. Wybierz „Wdróż” → „Nowe wdrożenie” → „Aplikacja internetowa”.
4. Ustaw wykonywanie jako właściciel projektu i dostęp „Każdy”.
5. Uruchom serwer z dwiema zmiennymi środowiskowymi:

```powershell
$env:GOOGLE_SHEETS_WEBHOOK_URL='https://script.google.com/macros/s/IDENTYFIKATOR/exec'
$env:GOOGLE_SHEETS_WEBHOOK_SECRET='ta-sama-wartosc-co-WEBHOOK_SECRET'
npm start
```

Adres webhooka i sekret są konfiguracją serwera. Nie wolno umieszczać ich w `index.html`, `dla-trenerow.html` ani `trainer-signup.js`.
