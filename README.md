# A letter for Aneeqa

A single-page Next.js site: a birthday letter for **30 September 2026**.

It is deliberately quiet. It says thank you, admits that she'll be missed,
wishes her a good life and the right person beside her, and then ends —
without asking for anything back.

## Structure

The letter runs as four chapters, one at a time, moving past → present → future.
Each chapter shifts the background a little lighter than the last.

| Chapter | File | Beat |
| --- | --- | --- |
| Waiting | [`countdown.jsx`](src/components/countdown.jsx) | Counts down; unlocks on the day |
| Opening | [`opening.jsx`](src/components/opening.jsx) | The greeting |
| Memory | [`memory-trust.jsx`](src/components/memory-trust.jsx) | The photograph, the trust, missing her, acceptance |
| Wishes | [`wishes.jsx`](src/components/wishes.jsx) | Her happiness, her future, the right partner |
| Farewell | [`farewell.jsx`](src/components/farewell.jsx) | The parting gift, then goodbye |

Everything personal — the name, the date, the photographs — lives in
[`src/lib/content.js`](src/lib/content.js) so it can never drift out of sync.

## Adding the other three photos

The memory chapter shows the photos as a small stack of prints. Click the front
one to look through them; the link underneath saves whichever is on top.

`memory.jpg` is already in `/public`. To add the rest, drop them in as
`memory-2.jpg`, `memory-3.jpg` and `memory-4.jpg` — no code change needed, they
appear in the deck on their own. Then open
[`src/lib/content.js`](src/lib/content.js) and replace the placeholder `alt`
text for each with a real description of what is in that photo.

Until those files exist the deck quietly runs with one card, and the browser
console logs a failed request for each missing file. That is the mechanism that
prunes them, and it stops once the files are added.

## Running it

```bash
npm install
npm run dev
```

The letter is sealed until 30 September 2026. To proof-read it beforehand,
open `http://localhost:3000/?preview=1`.

## Notes

- Motion respects `prefers-reduced-motion`: the ambient drift stops and the
  paced memory chapter renders all at once instead of timing itself out.
- The memory chapter also has a "Show it all at once" escape hatch for anyone
  who would rather not wait through the pacing.
- The page is marked `noindex`. It is not meant to be found.

The pink bubbles drifting in the background are the
[tsparticles](https://particles.js.org/) `bubbles` preset, toned right down and
switched off entirely under reduced motion.

Built with Next.js, Tailwind CSS, framer-motion, tsparticles and Lucide.
