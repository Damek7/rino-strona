# Supabase Auth i chroniony panel RinoMove

## Cel

Zastąpić lokalne konta, tokeny i pliki `data/*.json` usługą Supabase Auth
w istniejącym projekcie `gbsvphzastgcsjvqiqwd`. Panel RinoMove ma być dostępny
tylko dla zalogowanych użytkowników.

## Zakres

- Rejestracja oraz logowanie e-mailem i hasłem przez Supabase Auth.
- Profil użytkownika z rolą `client` albo `trainer`.
- Automatyczne utworzenie profilu przy rejestracji.
- Ochrona `panel.html`: brak aktywnej sesji kieruje użytkownika do logowania.
- Wylogowanie oraz odtworzenie sesji po odświeżeniu strony.
- Usunięcie lokalnego magazynu kont i sesji z serwera Node.js.

## Architektura

Przeglądarka będzie korzystać z klienta Supabase wyłącznie z adresem projektu
i kluczem publicznym. Klucz uprzywilejowany nie trafi do kodu ani do
przeglądarki. Supabase Auth przechowuje hasła i sesje, a tabela `profiles`
przechowuje nazwę użytkownika oraz rolę.

Migracja SQL utworzy tabelę `profiles`, włączy RLS i doda polityki pozwalające
zalogowanej osobie odczytać i zmienić tylko własny profil. Trigger po dodaniu
użytkownika do `auth.users` utworzy odpowiedni profil.

## Przepływ

1. Użytkownik wybiera rolę, podaje dane i rejestruje konto.
2. Supabase tworzy konto, a trigger tworzy profil z wybraną rolą.
3. Po zalogowaniu klient pobiera bezpośrednio zweryfikowanego użytkownika i
   jego profil.
4. Ochrona strony dopuszcza panel wyłącznie przy aktywnej sesji; w przeciwnym
   razie wyświetla logowanie.
5. Wylogowanie usuwa sesję przez Supabase i przywraca widok dla gościa.

## Błędy i bezpieczeństwo

- Interfejs pokazuje komunikaty zwracane przez Auth bez ujawniania sekretów.
- Klient używa `getUser()` do sprawdzania tożsamości; nie ufa wyłącznie
  lokalnemu stanowi.
- RLS ogranicza profile do ich właścicieli.
- Rola pozostaje w profilu i nie jest używana jako niezabezpieczona decyzja
  autoryzacyjna oparta wyłącznie na edytowalnych metadanych użytkownika.

## Weryfikacja

- Test rejestracji, logowania, odtworzenia sesji i wylogowania.
- Test odmowy dostępu do panelu bez sesji.
- Test RLS: użytkownik nie odczyta ani nie zmieni cudzego profilu.
- Kontrola doradcy bezpieczeństwa Supabase po utworzeniu schematu.
