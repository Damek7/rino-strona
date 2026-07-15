# RinoMove

Responsywna platforma do wyszukiwania trenerów, rezerwowania treningów i prowadzenia pracy trenera. Projekt działa od razu bez zewnętrznej konfiguracji w trwałym trybie demo, a po podaniu publicznych danych projektu automatycznie korzysta z Supabase.

## Uruchomienie

Wymagany jest Node.js 22 lub nowszy.

```powershell
npm install
npm start
```

Następnie otwórz `http://localhost:8787/panel.html`. Strona marketingowa jest dostępna pod `http://localhost:8787/`.

Testy:

```powershell
npm test
```

## Konta demonstracyjne

Tryb demo zapisuje zmiany w `localStorage`, więc rezerwacje, wiadomości, profil i ustawienia pozostają po odświeżeniu strony.

- Klient: `ania@demo.rinomove.pl` / `RinoDemo123`
- Trener: `marek@demo.rinomove.pl` / `RinoDemo123`

Te same konta można otworzyć przyciskami szybkiego dostępu w oknie logowania.

## Supabase

1. Skopiuj `.env.example` do `.env`.
2. Ustaw `SUPABASE_URL` oraz `SUPABASE_PUBLISHABLE_KEY`. Nie używaj w przeglądarce klucza `service_role`.
3. Zastosuj migrację `supabase/migrations/20260715015641_product_mvp.sql`, na przykład poleceniem:

```powershell
npx supabase db push
```

4. Uruchom serwer ponownie. `GET /api/config` zwróci wtedy tryb `supabase`; bez obu wartości bezpiecznie zwraca `demo`.

Migracja tworzy profile, dostępność, rezerwacje, rozmowy, wiadomości, opinie i ustawienia powiadomień. Każda tabela publiczna ma włączone RLS, a wiadomości są przygotowane do Supabase Realtime.

## Zakres produktu

- konta klienta i trenera, sesja i nawigacja według roli,
- wyszukiwarka oraz filtry trenerów,
- kalendarz tygodniowy, wolne godziny i blokady trenera,
- rezerwacje oraz dozwolone zmiany statusów,
- czat przypisany do rezerwacji i stan przeczytania,
- klienci, profil trenera, przychód, prowizja i kwota do wypłaty,
- przypomnienia i pojedyncza zweryfikowana opinia po opłaconym treningu,
- widoki desktopowe i mobilna nawigacja dolna.

Prawdziwe obciążenie karty/BLIK, wypłaty, wysyłka e-maili i SMS-ów wymagają osobnych operatorów. Tryb demo symuluje opłaconą rezerwację; Supabase zachowuje status oczekujący do czasu podłączenia operatora płatności.
