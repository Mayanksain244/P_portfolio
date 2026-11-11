# CLAUDE.md — Portfolio of an Assistant Engineer, PWD Uttarakhand

Bilingual (English / Hindi) portfolio site with an admin-managed photo gallery and a contact form that sends email.

## Workflow rules (from the project owner — always follow)
1. **The main agent never writes application code.** Every code change goes to a subagent launched with `model: "sonnet"`. The subagent writes the code, runs `npm run lint && npm run build && npm test`, and reports back. The main agent decides on design and features, reviews the work, and updates the docs.
2. After **every** change, update `docs/TODO.md` (To Do / Doing / Done) and this file (the Status and Decisions sections).
3. When real images are needed, stop and ask the owner for them, giving a generation prompt for each image. Until then, keep placeholders in `public/images/placeholder/`.
4. Never commit secrets. Keep them in `.env.local` only and keep `.env.example` in sync.

## Stack
- Next.js 15 (App Router, TypeScript, server actions), Tailwind CSS v4, `next-intl` with locales `en` (default) and `hi`.
- Supabase: Postgres (`albums`, `images`, `messages`) and the Storage bucket `gallery` (public read). The service-role key is used **server-side only**.
- Admin auth uses fixed env credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` as a bcrypt hash). Login sets a signed HTTP-only JWT cookie (`jose`, 8h). `src/middleware.ts` guards `/admin/**`.
- Mail: `nodemailer` over Gmail SMTP (app password).
- Validation: `zod`. Tests: `vitest` (unit), `playwright` (smoke).
- Hosting: Vercel.

## Art direction: "Himalayan Blueprint"
| Token | Value | Use |
|---|---|---|
| `--navy` | `#0F2A44` | primary, headers, dark backgrounds |
| `--paper` | `#F4EFE6` | page background (stone paper) |
| `--marigold` | `#E0A526` | accent and CTAs only, used sparingly |
| `--pine` | `#3E6B5A` | secondary accent, success |
| `--ink` | `#1B1B1B` | body text |

- Fonts (via `next/font`): Fraunces for headings, Inter for body, Noto Sans Devanagari for Hindi.
- Motifs:
  - a faint blueprint grid on the hero
  - SVG topographic contour lines behind sections
  - "dimension-line" section dividers (`|◄── Title ──►|`)
  - project cards styled as drawing title-blocks
- Motion: subtle fade/slide on scroll, with `prefers-reduced-motion` honoured.
- Sections: Home (मुख्य पृष्ठ) `/[locale]`, Works (कार्य) `/[locale]/works`, Site Diary (साइट डायरी) `/[locale]/gallery`, Get in Touch (संपर्क करें) `/[locale]/contact`, Admin `/admin` (English only).

## Content
- `src/content/profile.ts` holds the name, designation, bio, stats, timeline and social links in both languages. **Placeholders are in use until the owner provides real details.**
- `src/content/works.ts` holds the projects, with bilingual fields.
- `messages/{en,hi}.json` holds the UI strings.

### Real profile facts (from the owner, 2026-11-11)
- Name: **Er. Sahab Singh Saini** (इं. साहब सिंह सैनी).
- Current designation: **Additional Assistant Engineer (AAE), PWD Uttarakhand** (अपर सहायक अभियंता, लोक निर्माण विभाग, उत्तराखंड). This is AAE, not AE.
- In service since **2004**.
- Postings:

| Place | District | Years |
|---|---|---|
| Ghansali | Tehri Garhwal | 2004–2011 |
| Roorkee | Haridwar | 2011–2018 |
| Srinagar | Pauri Garhwal | 2018–2020 |
| Narendra Nagar | Tehri Garhwal | 2020–2025 |
| Dugadda | Pauri Garhwal | 2025–present |

  Note: Srinagar here is the Garhwal town, **not** J&K.
- Portrait: provided by the owner on 2026-11-11 (blue suit, white background). The design decision is to cut out the background and place the portrait in the **hero**, standing in front of a navy blueprint/contour backdrop with a marigold arc. To avoid showing the same photo twice, the About section swaps the portrait frame for a "personal data sheet" title-block. Assets go in `public/images/portrait/`.
- Bio: drafted by the PM. It contains no invented achievements.
- Projects: still pending from the owner. Never invent projects.
- Social links: pending.

## Commands
```
npm run dev      # http://localhost:3000
npm run lint
npm run build
npm test         # vitest
```

## Supabase project
- Project ref: `iswrajohklrrptfvzbfi`, region `ap-northeast-2` (Seoul).
- The project uses the **new key format**:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` holds a `sb_publishable_…` key.
  - `SUPABASE_SERVICE_ROLE_KEY` holds a `sb_secret_…` key, server-only. The owner pastes it into `.env.local` themself.

## Env vars
See `.env.example`.

## Code map (Phase 1)
- `src/i18n/{routing,navigation,request}.ts` hold the next-intl config. `src/middleware.ts` excludes `/admin`, `/api`, `_next` and static files.
- `src/app/[locale]/layout.tsx` owns `<html>`, so there is no root layout. **`/admin` will need its own root layout (Phase 4).**
- `src/app/[locale]/[...rest]/page.tsx` is a catch-all that renders the localized "Road Closed" 404 page.
- Components in `src/components/`: Header (sticky, with a mobile focus-trapped menu), LanguageToggle, Footer, Monogram (bridge arch + peak), DimensionDivider, ContourBackground, BlueprintGrid, Reveal, PagePlaceholder.
- Tokens live in `src/app/globals.css`. These come from `@theme`: `navy`, `navy-700`, `navy-900`, `paper`, `paper-200`, `marigold`, `marigold-600`, `pine`, `ink`, `line`. These semantic tokens switch in dark mode: `background`, `foreground`, `muted`, `surface`, `rule`, `link`. Utility classes: `.bg-blueprint`, `.btn` / `.btn-primary` / `.btn-outline`, `.dim-title`, `.reveal`, `.barrier-stripes`.
- The name and designation are currently in `messages/*.json` → `site.*`. They move to `src/content/profile.ts` in Phase 2.
- Vitest config: `vitest.config.mts`. Tests: `src/__tests__/`.
- Dev preview config: `.claude/launch.json` (name `dev`, port 3000).

## Code map (Phase 2)
- **Content:**
  - `src/content/profile.ts`: name, designation, `designationShort`, bio, postings with lat/lng, `social` (empty), `portrait?`.
  - `src/content/works.ts`: `works = []` until the owner sends projects.
  - Test fixtures for both live only in `src/__tests__/fixtures/`.
- **Helpers:** `src/lib/{content,stats,journey,works}.ts`. Stats are computed from `profile`, and the home page is `force-dynamic` so years of service stays current.
- **Map:**
  - `scripts/build-map.mjs` (`npm run build:map`) generates `src/content/map-paths.ts` (about 54 KB). Raw data goes to `scripts/data/`, which is git-ignored.
  - Sources: India outline from DataMeet `india-composite` (CC0, follows the Survey of India boundary); Uttarakhand districts from Census 2011 via DataMeet (CC BY 2.5 IN).
  - The script refuses to write output unless Leh, Kargil, Srinagar (J&K), Muzaffarabad, Gilgit, Skardu, Aksai Chin and Siachen all fall inside the India outline. **Never weaken this check.**
- **Components:** `ServiceJourney` (map, India inset, curved arcs, linked `<ol>` timeline), `StatsStrip`, `PortraitFrame`, `WorkCard` with `StatusStamp`, `WorksBrowser` (filter chips and empty state), `WorkTypeIcon`, `CurrentYear`, `ThemeToggle`.
- **Theme:** `next-themes` with `data-theme` (light, dark or system). Dark styles use `:root[data-theme="dark"]` and the `@custom-variant dark`. **Don't use `prefers-color-scheme` media queries.**

## Status
- Phase 0 (docs): done.
- Phase 1 (scaffold): done and reviewed on 2026-11-11.
- Phase 2 (Home, Service Journey, Works, theme toggle, AAE): done and reviewed on 2026-11-11.
  - Lint, build and test (24) pass.
  - Checked visually: EN and HI, light and dark, map, timeline, Works empty state.
- Phase 3 (Site Diary code), hero portrait and About DataSheet: done and reviewed on 2026-11-11.
  - Lint, test (43) and build pass.
  - The DB migration is reviewed; the owner still has to run it in the SQL Editor. Run the smoke test after that.
- Phase 3 DB is live (the smoke test passed 22/22).
- Phase 4 (Admin) is built and pushed as 7697e9f. Still to do: a browser walkthrough of the client-side upload, and the owner running migration 0002.
- Next: Phase 5 (Contact form + Gmail), which reuses `src/lib/rateLimit.ts` `checkAndRecord`.

## Code map (Phase 4)
- **Auth:**
  - `src/lib/auth/token.ts` is edge-safe jose code, used by the middleware.
  - `src/lib/auth/session.ts` is server-only and exports `requireAdmin` and `getSession`.
  - `credentials.ts` does a constant-time compare plus bcrypt. The `DUMMY_HASH` in it is a deliberate timing decoy, not a secret.
  - `routing.ts` exports `adminRedirect` and `safeNext`.
- **Actions:** in `src/app/admin/actions/{auth,albums,images,messages}.ts`. **Every action except logout starts with `await requireAdmin()`.**
- **Pages:** `src/app/admin/layout.tsx` is the admin's own root layout (noindex). The pages live under `src/app/admin/(panel)/`, and the components under `src/components/admin/`.
- **Uploads:** `createUploadUrl` returns a signed URL. The client sends `processImage.ts` output (2400px WebP plus blur placeholder) with `uploadToSignedUrl`, then calls `addImage`. Storage paths are `albums/{albumId}/{uuid}.webp`.
- **Rate limiting:** `src/lib/rateLimit.ts` uses the `rate_limits` table and hashed IPs. If the table is missing it fails open.
- **Scripts:** `scripts/hash-password.mjs` and `scripts/smoke-admin.mjs`. The dev password lives in `.admin-dev-password.txt`, which git ignores.
- **Gotchas:**
  - In `.env.local`, every `$` in the bcrypt hash must be written as `\$`, because Next expands variables. On Vercel, paste the hash as-is.
  - Changes to env vars only reach the middleware after `src/middleware.ts` is recompiled.

## Code map (Phase 3 + hero)
- `supabase/migrations/0001_init.sql` creates the `albums`, `images` and `messages` tables (RLS: public may read only published albums and their images; `messages` has no public access) and the public `gallery` bucket.
- `src/lib/supabase/{server,types,gallery}.ts`:
  - `server-only`. `getPublicClient` uses the publishable key; `getAdminClient` uses the secret key.
  - If the DB is missing, these return empty results and log a warning rather than crash.
- `src/lib/diary.ts`: helpers plus `GALLERY_PATHS`, the paths to pass to `revalidatePath`.
- Components: `DiaryCard`, `DiaryEmpty`, `GalleryBrowser` (category chips in `?category=`), `AlbumGallery` (masonry), `Lightbox` (keyboard and swipe, `?photo=`).
- `scripts/check-db.mjs`: run with `node --env-file=.env.local scripts/check-db.mjs`.
- `Hero.tsx`: a cutout portrait with a paper glow, a marigold arc and a ridge line.
- `DataSheet.tsx`: the About title-block.
- Portrait webps are in `public/images/portrait/`. The source files are in `scripts/portrait/source/` and the pipeline is `scripts/portrait/process.mjs`.
- **Gotcha:** `npm run build` overwrites `.next`, which breaks a running `npm run dev`. Stop the dev server before building, or have subagents use `tsc --noEmit` instead.

## Decisions log
- 2026-11-11 (Phase 4 design):
  - **Admin is English-only at `/admin`, with its own root layout.** It uses a fixed username plus a bcrypt hash and a jose JWT cookie (8h, `sameSite` strict). The middleware guards the pages, and **every server action calls `requireAdmin()`**.
  - **Login rate limit:** stored in the Supabase `rate_limits` table (migration 0002), not in memory. It allows 5 failures per 15 minutes per hashed IP, and Phase 5 reuses it for the contact form.
  - **Uploads:** photos are resized on the client to a max of 2400px WebP and EXIF-rotated, then uploaded straight to Supabase through a signed upload URL. This avoids Vercel's 4.5MB body limit.
  - **Grouping:** category → album → tags. The UI is designed to be usable on a phone at a site (camera upload).
- 2026-11-11 (Phase 2): The Uttarakhand map is cropped to the western part of the state, where all the postings are. The India inset shows the whole state. In light mode the route uses a darker marigold (`#9c6a0b`) for contrast. The Hindi short designation uses "लोनिवि", the standard abbreviation, which the owner should confirm.
- 2026-11-11 (Phase 2 review): The DimensionDivider titles are too small in Hindi, because the small caps are dropped and the text shrinks; increase the size for `lang=hi`. The map attribution is still in English on `/hi`; translate it. Both are queued for Phase 3.
- 2026-11-11 (Phase 1 review): In dark mode the hero and the page body are both navy, so the sections blend together. Fix in Phase 2: use `navy-900` for the hero (or `surface` bands for alternate sections) and raise the contrast of the DimensionDivider title and lines in dark mode. Also add a navy inner ring to the marigold focus outline on paper, because marigold on paper is only about 2:1 contrast.
- 2026-11-11: Chose Vercel + Supabase, Gmail SMTP, EN+HI, and the Himalayan Blueprint style. Works live in a content file for now (moving them to the DB is a later follow-up).
