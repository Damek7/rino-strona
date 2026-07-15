# Zwarty kalendarz w hero strony dla trenerów

## Cel

Usunąć nadmiar białej przestrzeni między wierszem `Czwartek` a kartą `Marek Kowalski` w desktopowym i tabletowym hero podstrony `dla-trenerow.html`, aby maskotka była lepiej widoczna. Zachować treść, kolejność kart, grafikę maskotki i obecny układ mobilny.

## Wybrany kierunek

- Karta `.availability-card` na desktopie i tablecie ma wysokość wynikającą z treści zamiast rozciągać się prawie do dołu `.hero-visual`.
- Karta `.trainer-card` zostaje ustawiona około 18–24 px pod dolną krawędzią kalendarza.
- `.rating-card` i `.hero-mascot-stage` zachowują obecną pozycję oraz warstwy. Skrócenie kalendarza odsłania większą część maskotki bez zmiany samej grafiki.
- Przy szerokości do 620 px pozostaje obecny układ mobilny, ponieważ karta kalendarza ma tam już jawnie określoną zwartą wysokość.

## Kryteria akceptacji

- Na desktopie i tablecie biała karta kończy się krótko po wierszu `Czwartek`.
- Karta `Marek Kowalski` znajduje się bezpośrednio pod kalendarzem z niewielkim, czytelnym odstępem.
- Maskotka jest bardziej widoczna w prawej części hero i nadal nie zasłania treści kalendarza.
- Kalendarz, ocena, karta trenera i maskotka pozostają widoczne.
- Układ mobilny nie ulega regresji.
- Strona nie ma poziomego przewijania przy 1440 × 1000, 768 × 900 i 390 × 844.

## Weryfikacja

- Test kontraktowy sprawdza zwarte pozycjonowanie `.availability-card` i `.trainer-card` w regułach `.trainer-home-hero`.
- Pełny zestaw testów projektu przechodzi.
- Widoki desktopowy, tabletowy i mobilny zostają sprawdzone w prawdziwej przeglądarce.
