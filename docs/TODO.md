# TODO

## Doing
- [x] Phase 3 DB is live (2026-11-11). The owner ran 0001.
  - `scripts/smoke-gallery.mjs` passed 22/22: pages, bucket URLs, RLS (no public writes, `messages` hidden, unpublished albums hidden), and cleanup.
  - Lightbox focus trap and swipe still haven't been checked in a real browser; do that in Phase 7 QA.
- [ ] Owner: deploying the first draft to Vercel (publishable env vars only, no secret key yet)
- [ ] Phase 4: Admin panel (Sonnet subagent)
- [x] Hero portrait, About data sheet and OG image: reviewed in the browser on 2026-11-11 (desktop, 375px, EN and HI, light and dark)
- [x] Hydration and 500 check: the errors were stale (rounding was already in place, and the 500 was a one-off from a dev-server hot reload). Added a rounding test.
- [ ] Add a favicon/app icon built from the Monogram (`src/app/icon.svg`); /favicon.ico currently 404s
- [x] Portrait cutout done and reviewed (2026-11-11). It is clean on navy and on paper.
  - When the portrait goes into the hero, move `original.png`, `portrait-cutout.png` and `preview-*.png` out of `public/` (about 7.6 MB) into `scripts/portrait/source/`.
  - The blue suit on a navy hero needs separation: add a marigold rim-light arc and a soft paper glow behind the shoulders.
- [ ] Next: put the portrait in the hero, and turn the About portrait frame into a personal data sheet (after Phase 3, to avoid file conflicts)

## To Do
- [x] First push to GitHub (`origin` = github.com/Mayanksain244/P_portfolio, branch `main`), commit 4fda83a (2026-11-11). Phase 3 was still in progress at the time.
- [x] Pushed Phase 3 and the hero portrait (2026-11-11)
- [ ] **Owner: revoke the GitHub token that was pasted in chat on 2026-11-11.** Use `gh auth login` or Git Credential Manager from then on.
- [ ] **Before going live: rotate the Supabase secret key.** It was pasted in chat on 2026-11-11. Create a new secret key in the dashboard, update `.env.local` and Vercel, then delete the old key.
- [ ] Polish from the Phase 2 review: make the Hindi DimensionDivider titles larger, and translate the map attribution on `/hi`
- [ ] Owner: confirm the Hindi short designation "अपर सहायक अभियंता, लोनिवि उत्तराखंड"
- [ ] Owner: list of projects (name, location, year, type, what was built, photos)
- [ ] Owner: social media links
- [ ] Phase 3: Supabase schema + Site Diary public pages *(owner: create a Supabase project and share the keys)*
- [ ] Phase 4: Admin
  - its own root layout, plus login
  - album CRUD
  - image upload and grouping
  - messages inbox
- [ ] Phase 5: Contact form + Gmail mailer + anti-spam + social links *(owner: Gmail app password)*
- [ ] Phase 6: Ask the owner for images (with a generation prompt for each) and for the real profile content
- [ ] Phase 7: QA and launch
  - a11y, mobile, Lighthouse and Playwright checks
  - triage the `npm audit` results
  - Vercel deploy
- [ ] Later:
  - make the footer year dynamic (right now it is fixed at build time)
  - get a native speaker to review the Hindi copy
  - move Works into the DB so the admin can edit them

## Done
- [x] Phase 2 (2026-11-11), reviewed in the browser:
  - Home page: hero, stats, about, Service Journey, diary teaser, CTA
  - Service Journey: map with an India inset and animated arcs, linked to the timeline
  - Works: list with filters, detail page, empty state
  - AAE designation
  - light/dark toggle
  - Phase 1 review fixes
- [x] Phase 1: Scaffold (2026-11-11)
  - Next 15.5, next-intl 4, Tailwind 4, vitest
  - design tokens and fonts
  - Header, Footer, LanguageToggle, Monogram
  - DimensionDivider, Contour, Blueprint grid, Reveal
  - Road Closed 404 page
  - reviewed in the browser
- [x] Phase 0: Plan approved; CLAUDE.md, TODO.md and .env.example created (2026-11-11)
