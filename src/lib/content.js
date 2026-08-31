/**
 * Everything personal lives here so the name, the date and the photograph
 * can never drift out of sync between components.
 */

export const RECIPIENT = "Aneeqa"

/** 30 September 2026, local midnight. Month is zero-indexed. */
export const BIRTHDAY = new Date(2026, 8, 30, 0, 0, 0)

export const BIRTHDAY_LABEL = "30 September 2026"

/** Used to build absolute URLs for link previews (og:image, canonical, etc). */
export const SITE_URL = "https://aneeqaweds.mohdaslam.dev"

/**
 * The gallery uses four entries now. The last two intentionally reuse the
 * present photos until you replace their `src` values with new local files.
 */
export const MEMORY_PHOTOS = [
  {
    src: "/memory.jpg",
    alt: `An old photograph of ${RECIPIENT} and me, taken years ago when we were young`,
    text: "Memory 01",
  },
  { src: "/memory-2.jpg", alt: `An old photograph of ${RECIPIENT} and me`, text: "Memory 02" },
  { src: "/memory.jpg", alt: `An old photograph of ${RECIPIENT} and me`, text: "Memory 03" },
  { src: "/memory-2.jpg", alt: `An old photograph of ${RECIPIENT} and me`, text: "Memory 04" },
]

export const MEMORY_PHOTO_CAPTION = "A long time ago."
