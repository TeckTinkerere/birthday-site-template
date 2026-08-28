# A letter for Aneeqa

A single-page Next.js site: a birthday letter for **30 September 2026**.

It is deliberately quiet. It says thank you, admits that she'll be missed,
wishes her a good life and the right person beside her, and then ends
without asking for anything back.

## Structure

The letter runs as five chapters, one at a time, moving from past to present to future.
Each chapter shifts the background a little lighter than the last.

| Chapter | File | Beat |
| --- | --- | --- |
| Waiting | [`countdown.jsx`](src/components/countdown.jsx) | Counts down; unlocks on the day |
| Opening | [`opening.jsx`](src/components/opening.jsx) | The greeting |
| Memory | [`memory-trust.jsx`](src/components/memory-trust.jsx) | The photograph, the trust, missing her, acceptance |
| Wishes | [`wishes.jsx`](src/components/wishes.jsx) | Her happiness, her future, the right partner |
| Farewell | [`farewell.jsx`](src/components/farewell.jsx) | The parting gift and a choice to continue |
| Reels | [`reel-opener.jsx`](src/components/reel-opener.jsx) | Optional portrait video memories |

Everything personal, including the name, date, and photographs, lives in
[`src/lib/content.js`](src/lib/content.js) so it can never drift out of sync.

## Adding photos and reels

The memory gallery currently repeats `memory.jpg` and `memory-2.jpg` to create
four slides. Replace the final two `src` values in
[`src/lib/content.js`](src/lib/content.js) when new photos are ready.

For the optional reel chapter, add portrait H.264/AAC `.mp4` files or `.webm`
files to `/public/videos`. Use an ordered filename such as `01-first-reel.mp4`
to control the horizontal swipe order. New files need a rebuild and redeploy in
production.

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
