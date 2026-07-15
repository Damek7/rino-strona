# Pełna wysokość tła hero

## Cel

Usunąć biały pasek widoczny przy dolnej krawędzi pierwszego ekranu strony głównej.

## Zakres

- Tło kontenera `#top.client-hero` ma pokrywać co najmniej pełną wysokość widocznego ekranu.
- Wewnętrzny układ hero ma zachować obecną kompozycję, tekst, nawigację i położenie rakiet.
- Zmiana nie może dodawać białych pasów u góry, po bokach ani na dole.
- Na urządzeniach mobilnych treść dłuższa niż ekran nadal naturalnie zwiększa wysokość hero.

## Implementacja

Zastąpić wysokość pomniejszoną o nawigację pełną wysokością dynamicznego viewportu dla kontenera hero i jego bezpośredniego układu. Nawigacja pozostaje nakładana na tło i nie rezerwuje osobnego białego obszaru.

## Weryfikacja

- Test regresji sprawdza pełną wysokość tła hero.
- Widok w przeglądarce jest mierzony na desktopie i telefonie.
- Pełny zestaw testów projektu musi przejść.
