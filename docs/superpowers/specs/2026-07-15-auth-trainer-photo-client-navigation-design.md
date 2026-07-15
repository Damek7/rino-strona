# Uproszczenie konta i nawigacji klienta

## Cel

Uprościć wejście do RinoMove, zwiększyć wiarygodność profili trenerów i usunąć z głównej nawigacji klienta osobny kalendarz.

## Logowanie i rejestracja

- Okno konta domyślnie otwiera się w trybie logowania.
- Logowanie zawiera wyłącznie adres e-mail i hasło.
- Imię i nazwisko, typ konta oraz akceptacja regulaminu są widoczne wyłącznie podczas rejestracji.
- Po otwarciu okna konta całe tło za formularzem jest białe. Strona produktu nie prześwituje przez backdrop.
- Przyciski szybkiego logowania do kont demo pozostają dostępne i nie zmieniają danych logowania.

## Zdjęcie trenera

- Po wybraniu roli trenera podczas rejestracji pojawia się obowiązkowe pole przesłania zdjęcia.
- Pole akceptuje pliki JPEG, PNG i WebP, pokazuje podgląd oraz czytelny błąd dla braku lub nieprawidłowego pliku.
- Dla klienta pole zdjęcia pozostaje ukryte i niewymagane.
- Tryb demo zapisuje zdjęcie jako dane lokalne razem z profilem, dzięki czemu pozostaje po odświeżeniu.
- Integracja Supabase zapisuje zdjęcie w publicznym bucketcie `trainer-avatars`, a adres pliku w `profiles.avatar_url`. Jeśli rejestracja wymaga potwierdzenia e-mail, zdjęcie jest przesyłane po pierwszym uwierzytelnieniu, zanim profil może zostać opublikowany.
- Zdjęcie jest wykorzystywane w awatarze konta oraz podglądzie profilu. Brak zdjęcia pozostaje dozwolony dla istniejących kont demo i starszych kont, ale nie dla nowej rejestracji trenera.

## Nawigacja klienta

- Pozycja „Kalendarz” znika z nawigacji klienta.
- Główne pozycje klienta to: Trenerzy, Rezerwacje, Wiadomości i Ustawienia.
- Widok dostępnych terminów pozostaje wewnętrznym krokiem rezerwacji uruchamianym przez „Zobacz terminy” na karcie trenera.
- Bezpośrednie wejście klienta na `#calendar` przekierowuje do wyszukiwarki trenerów, chyba że klient właśnie wybiera termin wskazanego trenera.
- Kalendarz trenera i zarządzanie dostępnością pozostają bez zmian.

## Dane i bezpieczeństwo

- Pliki zdjęć mają limit 5 MB przed przetworzeniem.
- Ścieżka w Supabase jest przypisana do identyfikatora użytkownika; polityki Storage pozwalają trenerowi zarządzać wyłącznie własnym zdjęciem.
- Publiczny odczyt zdjęć trenerów jest dozwolony, ponieważ są elementem publicznego profilu.
- Dane demo oraz istniejące loginy demonstracyjne nie są usuwane ani zmieniane.

## Obsługa błędów

- Brak zdjęcia trenera blokuje wysłanie formularza i wskazuje pole.
- Nieobsługiwany format lub plik ponad limit pokazuje komunikat bez zamykania formularza.
- Błąd zapisu zdjęcia w Supabase nie publikuje profilu trenera i pozostawia możliwość ponowienia po zalogowaniu.

## Weryfikacja

- Testy formularza potwierdzają, że imię nie jest widoczne ani wysyłane podczas logowania.
- Testy rejestracji potwierdzają obowiązkowe zdjęcie tylko dla trenera.
- Test kontraktu demo potwierdza trwałość zdjęcia profilu.
- Test schematu potwierdza bucket i polityki Storage.
- Test nawigacji potwierdza brak kalendarza klienta oraz zachowanie kalendarza trenera.
- Test przeglądarkowy sprawdza biały ekran logowania, konta demo i rejestrację trenera z podglądem zdjęcia.
