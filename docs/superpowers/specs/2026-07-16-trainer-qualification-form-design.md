# Formularz kwalifikacyjny trenerów RinoMove — projekt

## Cel

Zastąpić obecny krótki zapis dla trenerów formularzem, który nadal zbiera kontakt,
ale przede wszystkim wskazuje osoby rzeczywiście gotowe korzystać z RinoMove.
Formularz ma odsiewać przypadkowe zgłoszenia, rozpoznawać potrzeby trenerów i dawać
zespołowi RinoMove informacje potrzebne do pierwszej rozmowy.

W komunikacji nie używamy słowa „pilotaż”. Mówimy wyłącznie o korzystaniu z
RinoMove, dołączeniu do RinoMove albo wcześniejszym dostępie.

## Doświadczenie użytkownika

- Formularz działa jako krótki proces krok po kroku, z jednym pytaniem na ekranie.
- Na początku widoczna jest informacja: siedem pytań, około trzy minuty i możliwość
  niezakwalifikowania się do wcześniejszego dostępu.
- Pasek postępu pokazuje numer bieżącego pytania.
- Odpowiedzi jednokrotnego wyboru automatycznie przechodzą dalej albo udostępniają
  przycisk „Dalej”; pytania otwarte wymagają świadomego przejścia dalej.
- Użytkownik może wrócić do poprzedniego pytania bez utraty odpowiedzi.
- Dane kontaktowe są zbierane dopiero po siedmiu pytaniach kwalifikacyjnych.
- Po wysłaniu trener otrzymuje jasny komunikat, że zespół sprawdzi zgłoszenie i
  skontaktuje się z wybranymi osobami.
- Formularz zastępuje obecny formularz na stronie głównej i na podstronie dla
  trenerów, zachowując spójne pytania i działanie w obu miejscach.

## Siedem pytań kwalifikacyjnych

### 1. Dyscyplina i miejsce prowadzenia treningów

„Jaką dyscyplinę trenujesz i gdzie prowadzisz treningi?”

Pola: dyscyplina, miasto, dzielnica oraz opcjonalnie nazwa klubu lub obiektu.

### 2. Model pracy

„W jakim modelu pracujesz?”

Odpowiedzi:

- pracuję niezależnie;
- pracuję w klubie lub akademii;
- łączę pracę niezależną z klubem lub akademią;
- prowadzę zespół trenerów.

### 3. Możliwość przyjęcia nowych klientów

„Ilu nowych klientów możesz obecnie przyjąć?”

Odpowiedzi:

- obecnie nie mam wolnych miejsc;
- 1–2 klientów miesięcznie;
- 3–5 klientów miesięcznie;
- więcej niż 5 klientów miesięcznie.

### 4. Problem i dotychczasowe próby

„Co najbardziej utrudnia Ci obecnie pozyskiwanie lub obsługę klientów i czego już
próbowałeś, żeby to zmienić?”

Odpowiedź otwarta, minimum 30 znaków.

### 5. Powód działania teraz

„Co sprawiło, że myślisz o nowym rozwiązaniu właśnie teraz?”

Odpowiedź otwarta, minimum 20 znaków.

### 6. Gotowość do korzystania z RinoMove

„Z czego jesteś gotowy korzystać w RinoMove?”

Wielokrotny wybór:

- przygotuję i uzupełnię swój profil;
- dodam dostępne terminy;
- będę przyjmować rezerwacje przez RinoMove;
- będę obsługiwać płatności za treningi przez RinoMove;
- będę przekazywać uwagi o działaniu RinoMove.

### 7. Oczekiwany rezultat

„Jaki rezultat sprawiłby, że uznasz korzystanie z RinoMove za wartościowe?”

Odpowiedzi:

- pozyskanie przynajmniej jednego nowego klienta;
- więcej regularnych rezerwacji;
- mniej czasu poświęcanego na ustalanie terminów;
- wygodniejsza obsługa rezerwacji i płatności;
- profesjonalny profil i większa widoczność;
- inny rezultat — pole tekstowe wyświetlane warunkowo.

## Dane kontaktowe

Po pytaniu siódmym formularz zbiera:

- imię i nazwisko;
- adres e-mail;
- numer telefonu;
- opcjonalnie link do profilu na Instagramie lub własnej strony;
- zgodę na kontakt i przetwarzanie danych w sprawie dołączenia do RinoMove.

## Logika kwalifikacji

Formularz nie pokazuje użytkownikowi punktacji. Zapisuje status pomocniczy dla
zespołu:

- `qualified` — Warszawa, co najmniej jedno wolne miejsce i deklaracja korzystania
  z profilu, terminów oraz rezerwacji;
- `review` — odpowiedzi niepełne z biznesowego punktu widzenia, praca klubowa,
  brak wolnych miejsc albo brak jednej z kluczowych deklaracji;
- `waitlist` — działalność poza Warszawą.

Status służy wyłącznie do uporządkowania zgłoszeń. Trener nie otrzymuje automatycznej
odmowy. Po wysłaniu każdy widzi neutralny komunikat o sprawdzeniu zgłoszenia.

## Przepływ danych

1. Przeglądarka przechowuje odpowiedzi tylko na czas wypełniania formularza.
2. Po zatwierdzeniu zgody wysyła komplet danych do `POST /api/waitlist`.
3. Serwer waliduje wszystkie pola, oblicza status kwalifikacji i przekazuje dane do
   Google Apps Script.
4. Apps Script dopisuje jeden wiersz w arkuszu zgłoszeń trenerów.
5. Arkusz zachowuje dotychczasowe kolumny i dodaje kolumny dla siedmiu odpowiedzi,
   telefonu, linku oraz statusu kwalifikacji.

## Architektura i pliki

- `index.html` i `dla-trenerow.html` — wspólny kontrakt formularza krokowego;
- `trainer-signup.js` — stan kroków, walidacja interfejsu, nawigacja i wysłanie;
- `cta.css` oraz style podstrony trenera — widok pojedynczego pytania, pasek postępu
  i wersja mobilna;
- `server.js` — rozszerzona walidacja, normalizacja danych i status kwalifikacji;
- `integrations/google-sheets/Code.gs` — zapis nowych kolumn;
- testy formularza, endpointu i kontraktu Apps Script — pytania, walidacja, logika
  warunkowa, statusy oraz zgodność obu stron.

## Obsługa błędów i prywatność

- Błąd wysyłki nie usuwa odpowiedzi.
- Pola błędne lub niekompletne są wskazywane na odpowiednim kroku.
- Ukryte pole antyspamowe i limit żądań pozostają bez zmian.
- Formularz nie zapisuje danych kontaktowych w `localStorage`.
- Adres webhooka i sekret nadal pozostają wyłącznie na serwerze.
- Do arkusza nie trafiają dane przed końcowym wysłaniem formularza.

## Kryteria akceptacji

- Obie strony pokazują ten sam formularz siedmiu pytań i dane kontaktowe na końcu.
- Formularz nie zawiera słowa „pilotaż”.
- Można przejść w przód i wstecz bez utraty odpowiedzi.
- Pole „inny rezultat” pojawia się tylko po wybraniu odpowiedniej odpowiedzi.
- Zgłoszenia są poprawnie oznaczane jako `qualified`, `review` albo `waitlist`.
- Poprawne zgłoszenie tworzy dokładnie jeden pełny wiersz w Google Sheets.
- Błędne dane, brak zgody i bot wypełniający pole-pułapkę nie tworzą wiersza.
- Pełny zestaw testów przechodzi, a formularz jest sprawdzony w przeglądarce na
  komputerze i telefonie.

## Poza zakresem

- Automatyczne umawianie rozmowy po kwalifikacji.
- Automatyczne wiadomości e-mail, SMS lub odrzucenia.
- Publiczne pokazywanie wyniku punktowego.
- Panel CRM inny niż istniejący arkusz Google.
