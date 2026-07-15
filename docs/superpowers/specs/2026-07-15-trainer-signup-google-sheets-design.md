# Formularz trenera i zapis do Google Sheets — projekt

## Cel

Na etapie przedpremierowym RinoMove zbiera wyłącznie zgłoszenia trenerów. Ten sam prosty formularz będzie dostępny na stronie głównej i na podstronie `dla-trenerow.html`, a każde poprawne zgłoszenie trafi automatycznie do prywatnego arkusza „RinoMove — zgłoszenia trenerów”.

## Doświadczenie użytkownika

- Wszystkie główne CTA mają krótką etykietę „Zapisz się” i prowadzą do formularza.
- Nad formularzem widnieje wyłącznie „Start wkrótce” — bez nazwy miasta.
- Nie ma przełącznika klient/trener ani formularza dla klientów.
- Oba formularze zbierają tylko: imię i nazwisko, e-mail, dyscyplinę oraz zgodę na kontakt i przetwarzanie danych.
- Na tym etapie nie prosimy o doświadczenie, certyfikaty ani dokumenty. Poznamy je podczas późniejszej rozmowy.
- Po wysłaniu użytkownik otrzymuje jednoznaczny komunikat sukcesu. Przy błędzie dane pozostają w formularzu i pojawia się prośba o ponowienie próby.

## Przepływ danych

1. Formularz wysyła `POST /api/waitlist` z polami `name`, `email`, `discipline`, `source`, `consent` i ukrytym polem antyspamowym `website`.
2. `source` ma stałą wartość zależną od strony: `homepage` lub `trainer_page`; użytkownik nie może jej wybierać.
3. Serwer sprawdza długości pól, format e-maila, zgodę, dozwolone źródło i pole antyspamowe.
4. Serwer przekazuje poprawne zgłoszenie do Google Apps Script przez adres przechowywany w `GOOGLE_SHEETS_WEBHOOK_URL`. Sekret `GOOGLE_SHEETS_WEBHOOK_SECRET` pozostaje wyłącznie na serwerze.
5. Apps Script sprawdza sekret i dopisuje wiersz: data zgłoszenia, imię, e-mail, dyscyplina, źródło, status „Nowy”, pusta data kontaktu i puste notatki.
6. Arkusz pozostaje prywatny. Publiczny jest jedynie endpoint przyjmujący zgłoszenia, zabezpieczony walidacją, limitem żądań, polem-pułapką i sekretem między serwerem a Apps Script.

## Architektura i pliki

- `trainer-signup.js` — wspólna funkcja wysyłki i obsługi stanów formularza.
- `index.html` — trener-only formularz na stronie głównej, źródło `homepage`.
- `dla-trenerow.html` — ten sam zestaw pól, źródło `trainer_page`; usunięcie kopiowania zgłoszenia do Instagrama.
- `server.js` — endpoint `/api/waitlist`, walidacja i przekazanie zgłoszenia do webhooka.
- `integrations/google-sheets/Code.gs` — kod Apps Script dopisujący wiersz do arkusza o ID `1KSEgWsqJXN8c7ZVZ780WrI_RBt0ZHW8pvsoAczWTzdo`.
- testy Node — kontrakt obu formularzy oraz sukces, walidacja, brak konfiguracji, pułapka antyspamowa i błąd webhooka.

## Obsługa błędów i prywatność

- Brak konfiguracji webhooka zwraca `503`; błąd Google zwraca `502`; błędne dane zwracają `422`.
- Serwer nie zapisuje danych formularza do logów ani lokalnych plików.
- Formularz nie ujawnia adresu Apps Script ani sekretu.
- Nie wprowadzamy deduplikacji adresów e-mail. Powtórne zgłoszenie jest dozwolone, aby nie blokować osoby poprawiającej dane.

## Kryteria akceptacji

- Strona główna i podstrona trenerów pokazują wyłącznie formularz dla trenera z identycznym zestawem pól.
- Tekst „Warszawa” oraz wybór roli klient/trener znikają z formularza.
- Poprawne zgłoszenie z każdej strony tworzy dokładnie jeden wiersz w arkuszu z właściwym źródłem i statusem „Nowy”.
- Niepoprawny e-mail, brak zgody lub brak wymaganych danych nie tworzą wiersza.
- Bot wypełniający pole `website` nie tworzy wiersza, ale otrzymuje neutralną odpowiedź sukcesu.
- Pełny zestaw testów projektu przechodzi, a oba przepływy są sprawdzone w przeglądarce na komputerze i telefonie.

## Poza zakresem

- Formularz i konto klienta.
- Logowanie, katalog trenerów i wybór płatnego planu.
- Wysyłanie certyfikatów, umawianie rozmowy i automatyczne wiadomości e-mail.
- Panel do zarządzania zgłoszeniami poza istniejącym arkuszem Google.
