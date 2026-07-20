# RinoMove trainer-lead mobile redesign

## Goal

Rework the public website so its only conversion goal is collecting qualified
trainer leads and validating trainer interest before launch. The homepage and
`dla-trenerow.html` must no longer suggest that a client can already search for
or book a trainer.

Success means:

- every primary CTA leads to the trainer application form;
- the message is immediately understandable on a 390 px-wide phone;
- the homepage introduces the brand and the opportunity for trainers;
- the trainer page explains the offer, terms, and next step in more detail;
- the form captures enough context for a useful follow-up without feeling like
  a long application;
- all published claims remain compatible with the current pre-launch stage.

## Design read

This is a pre-launch marketplace landing for independent sports trainers in
Warsaw. The tone is direct, calm, modern, and partner-like. The visual direction
is a targeted evolution of the existing RinoMove identity rather than a new
brand.

Design dials:

- `DESIGN_VARIANCE: 5` — recognizable layouts with a few asymmetric editorial
  moments;
- `MOTION_INTENSITY: 3` — tactile feedback and short entrance transitions only;
- `VISUAL_DENSITY: 3` — spacious enough for phones, without turning the page
  into an empty portfolio.

## Audience and promise

The only audience for the conversion path is a trainer who:

- offers individual sessions in Warsaw;
- initially specializes mainly in tennis or boxing;
- may be able to accept new clients;
- wants a professional profile and a simpler path from client interest to a
  confirmed session;
- understands that RinoMove is still being built and that participation helps
  validate the product.

The site must not promise a number of clients, income, guaranteed bookings, or
market leadership.

## Funnel architecture

### Homepage

The homepage is the short brand and interest-validation route:

1. State who RinoMove is for.
2. Name the value in one memorable line.
3. Show the planned path from profile to confirmed session.
4. Explain why the first trainer group matters.
5. Lead directly into the application form.
6. Answer the most important objections.

The existing homepage CTA placements remain: the navigation CTA, hero CTA, and
contextual CTA positions already present in the page flow. Their labels become
trainer-specific and they scroll to the homepage form. No new CTA is added at
the bottom of the page. The navigation may link to the trainer page as a
secondary route for people who want more detail.

### Trainer page

The trainer page is the detailed qualification route:

1. Lead with the trainer-specific promise.
2. Explain the marketplace category and pre-launch status.
3. Show planned benefits without presenting them as shipped facts.
4. Explain the founders programme and its current terms.
5. Explain what happens after submission.
6. Lead into the same form component and data contract as the homepage.

The two pages may share the form markup and JavaScript behavior, but each page
must retain its own source identifier.

## Copy system

### Homepage copy map

- Document title: `RinoMove. Tu trener jest marką`
- Hero H1: `RinoMove. Tu trener jest marką.`
- Hero body: `Budujemy marketplace, w którym Twój profil, doświadczenie i wolne
  terminy prowadzą klienta prostą drogą do rezerwacji. Zaczynamy w Warszawie.`
- Primary CTA: `Zgłoś się jako trener-założyciel`
- Secondary CTA: `Zobacz, jak to działa`
- Section: `Klient szuka. Twój profil odpowiada.`
- Section: `Od pierwszego kliknięcia do potwierdzonego treningu.`
- Section: `Mniej ustalania. Więcej trenowania.`
- Section: `Pierwsi trenerzy ustalają zasady gry.`
- Form section: `Sprawdźmy, czy RinoMove pasuje do Twojej pracy.`
- FAQ section: `Konkrety przed zgłoszeniem.`

Existing client-only headings and sport-selection CTAs are removed or rewritten.
There is no client waitlist and no client search CTA in this phase.

### Trainer page copy map

- Document title: `RinoMove dla trenerów. Twój profil pracuje`
- Hero H1: `Twój profil pracuje. Ty trenujesz.`
- Hero body: `RinoMove ma pokazać klientowi Twoją ofertę, doświadczenie i wolne
  terminy, zanim napisze pierwszą wiadomość.`
- Primary CTA: `Zgłoś się jako trener-założyciel`
- Section: `Nie kolejny katalog. Miejsce zbudowane wokół trenera.`
- Section: `Mniej wiadomości. Więcej jasnych ustaleń.`
- Section: `Od zainteresowania do potwierdzonego terminu.`
- Section: `Dołącz wcześniej. Pomóż ustawić dobry kierunek.`
- Form section: `Pokaż nam, jak pracujesz.`
- FAQ section: `Zanim dołączysz.`

Headings are short and benefit-led. Body copy carries qualifications such as
“budujemy”, “planujemy”, and “ma”, so the headline can stay memorable without
misrepresenting the product stage.

## Form design

The existing seven-step wizard becomes a three-step mobile-first form.

### Step 1: fit

- discipline, required;
- city, required;
- district or area, optional;
- work model: independent, club/academy, mixed, required.

### Step 2: intent

- whether the trainer can currently accept new clients, required;
- primary need: reaching suitable clients, reducing message-based scheduling,
  presenting the offer professionally, organizing bookings and payments, or
  another need;
- one optional short free-text answer: `Co dziś najbardziej utrudnia Ci pracę
  z klientami?`

### Step 3: contact

- first and last name, required;
- email, required;
- phone, optional;
- Instagram or profile link, optional;
- privacy consent, required.

The form preserves values when navigating backwards. Validation appears next to
the relevant field and focuses the first invalid control. Submission uses the
existing waitlist API with an updated, explicit trainer-lead payload.

Success copy:

`Dziękujemy. Przejrzymy zgłoszenie i wrócimy z informacją o kolejnym kroku.`

Failure copy:

`Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub napisz do nas.`

## Mobile-first layout

The 390 × 844 px viewport is the primary design target.

- The headline fits within three lines at common phone widths.
- The hero CTA is visible without requiring a scroll.
- Primary buttons use the full content width on phones and are at least 48 px
  high.
- Navigation keeps one visible application CTA and a separate menu control.
- There is no sticky or fixed CTA bar at the bottom of the viewport.
- The redesign does not add another CTA after the final homepage section.
- Content uses a 16 px page gutter and no horizontal overflow at 320 px.
- Sections stack in a single column until there is enough width for a true
  two-column layout.
- Form controls use at least 16 px text to avoid iOS input zoom.
- The form is one column on phones and uses native input types and autocomplete.
- Safe-area padding is included where controls sit near the bottom edge.
- Desktop expands the same hierarchy instead of introducing a different
  information order.

## Visual system

- Preserve the approved RinoMove logo, wordmark, mascot, and existing trainer
  imagery.
- Use graphite as the text and structural color.
- Use raspberry as the only interactive accent.
- Use blue-lavender for supporting surfaces and illustrations, not competing
  CTAs.
- Keep backgrounds light and mostly flat; avoid gradients, heavy shadows,
  glass-card stacks, and decorative badges.
- Keep one consistent radius system: 10–12 px controls, 20–24 px major
  containers, full radius only for the floating navigation.
- Continue with Manrope for display text and DM Sans for body text.
- Avoid emoji and generic icon-only controls without accessible labels.

## Motion and interaction

- Press feedback starts immediately through a subtle `scale(.98)`.
- Section entrances use at most 12 px vertical movement and opacity over
  200–300 ms.
- No infinite floating cards or decorative looping movement.
- Only `transform` and `opacity` animate.
- `prefers-reduced-motion: reduce` removes movement while retaining state
  feedback.
- Focus rings remain visible and meet contrast requirements.
- Hover is supplemental; every action works through touch and keyboard.

## Technical scope

The implementation remains in the existing static HTML/CSS/JavaScript
architecture. Changes are limited to:

- `index.html`;
- `dla-trenerow.html`;
- the existing public stylesheets used by those pages;
- `trainer-signup.js`;
- the waitlist endpoint and validation only where needed for the reduced form;
- focused tests covering copy, CTA routing, form behavior, mobile layout, and
  API payloads.

No framework migration, new component library, analytics platform, client
waitlist, or unrelated panel redesign is included.

## Verification

Before delivery:

- run the focused tests first, then the full `npm test` suite;
- exercise both forms in Chromium;
- verify 320, 390, 768, and 1440 px widths;
- confirm no horizontal scrolling;
- confirm all primary CTAs end at a trainer form;
- confirm keyboard navigation and visible focus;
- confirm reduced-motion behavior;
- check contrast and minimum touch-target sizes;
- capture mobile and desktop screenshots of both pages;
- start the local server and provide its URL.
