# RinoMove Client Feature Cards — Design

## Cel

Dodać po wyborze sportu, a przed listą trenerów, sekcję wyjaśniającą klientowi cztery najważniejsze korzyści RinoMove. Sekcja odpowiada na obawę osoby, która chce zacząć sport, ale nie chce dzwonić do klubów ani przeszukiwać wielu profili społecznościowych.

## Inspiracje

- ClickUp: funkcje pokazane jako czytelna siatka, każda karta ma jeden komunikat i prosty fragment interfejsu.
- Maze: duże typograficzne tezy i spokojne powierzchnie.
- MindMarket: przyjazna, ludzka ilustracyjność bez infantylności.
- Fluz: miękkie kolory i obiekty wychodzące poza typową kartę.

Kierunek RinoMove pozostaje autorski: czarno-biała baza, pastelowe akcenty marki, zaokrąglone karty i proste miniatury interfejsu wykonane w HTML/CSS.

## Układ

Sekcja `#korzysci` ma nagłówek `Wszystko, czego potrzebujesz, żeby po prostu zacząć.` oraz cztery karty w układzie 2 × 2 na desktopie i pojedynczej kolumnie na telefonie.

Karty:

1. `Sprawdzone profile` — certyfikaty, doświadczenie i opinie w jednym miejscu.
2. `Terminy bez telefonu` — dostępny kalendarz i samodzielna rezerwacja.
3. `Jasna cena przed rezerwacją` — cena widoczna przed wyborem terminu.
4. `Cały trening pod ręką` — wiadomości, płatność i szczegóły spotkania w jednym miejscu.

Pierwsza i czwarta karta są szersze wizualnie; druga i trzecia tworzą spokojniejszy środek siatki. Każda karta ma tekst oraz prostą, dekoracyjną miniaturę produktu bez zewnętrznych ikon.

## Styl i ruch

- Baza: biel, grafit `#1A191E`, subtelne linie.
- Akcenty kart: mięta, pudrowy błękit, jasny róż i lawenda.
- Jednorazowe wejście po przewinięciu: opacity, `translateY(24px)` i delikatny blur.
- Hover: podniesienie maksymalnie `6px`, zmiana obramowania i ruch elementu miniatury maksymalnie `4px`.
- `prefers-reduced-motion` usuwa transformacje i pokazuje treść natychmiast.

## Dostępność i responsywność

- Nagłówek i treść pozostają czytelne bez JavaScriptu.
- Karty są artykułami, nie udają linków.
- Dekoracyjne miniatury mają `aria-hidden="true"`.
- Desktop `1440 × 1000`: siatka 2 × 2 bez poziomego przewijania.
- Telefon `390 × 844`: jedna kolumna, pełny tekst, brak nakładania elementów.

## Kryteria akceptacji

1. Dokładnie cztery karty z zatwierdzonymi nazwami i opisami.
2. Sekcja znajduje się pomiędzy `#specjalizacje` i `#trenerzy`.
3. Miniatury produktu są zbudowane lokalnie, bez stockowych zdjęć i bez wyglądu AI.
4. Animacja jest jednorazowa i respektuje ograniczenie ruchu.
5. Cały zestaw testów projektu przechodzi.
