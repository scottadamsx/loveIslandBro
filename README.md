# VillaVision 🌴 — Love Island Scorecard

A two-player companion app for watching Love Island USA (Scott vs Maria). Make your
predictions when the show announces a vote, stamp them before the episode reveals the
answer, then score them against what actually happened.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

## Tabs

- **🏝️ Islanders** — every contestant as a card (photo, age, hometown, status). Add new
  bombshells, flip status when someone's dumped, and set photos three ways: 🔍 opens
  Google Images, 🔗 paste an image URL, ⬆️ upload a file.
- **💘 Couples** — the current couplings. Select any two islanders → "Couple up 💍";
  recoupling someone automatically splits their old couple.
- **🗳️ Scenes** — the main event. When the show says *"America will be choosing the two
  least compatible couples"*, create a scene (couples or individuals, pick 1–6). Each
  player makes their picks and **stamps** them 🔒 (your opponent's stamped picks stay
  sealed 🙈 until you stamp yours). After the episode, enter the show's real answer and
  it scores both of you — running points + wins show in the header scoreboard.
- **🏆 Tier List** — S/A/B/C/D tiers per player. Drag cards in (or use the hover
  buttons), and hit "Compare" to see both players' boards side by side.

Switch whose picks you're making with the **Scott / Maria** toggle in the header
(double-click a name to rename). Everything saves to localStorage automatically.

## Cast photos

Set photos in-app per card (🔍 Google Images / 🔗 paste URL / ⬆️ upload) — that's the
recommended way, because you see exactly what you're adding.

There is also a helper that downloads *candidate* photos from image search into a
`photo-review/` quarantine folder. **Nothing it downloads appears in the app.** Image
search results cannot be trusted unreviewed — you must open the folder, look at every
file, delete anything wrong, and only then publish:

```bash
npm run photos                                  # download candidates → photo-review/
open photo-review                               # LOOK AT EVERY IMAGE
node scripts/fetch-photos.mjs --publish --yes   # move reviewed files into the app
```

Cast data seeded from the Season 8 (Fiji, 2026) roster as of Day 25 / July 3, 2026.
