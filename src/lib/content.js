/**
 * Everything personal lives here so the name, the date and the photograph
 * can never drift out of sync between components.
 */

export const RECIPIENT = "Aneeqa"

/** 30 September 2026, local midnight. Month is zero-indexed. */
export const BIRTHDAY = new Date(2026, 8, 30, 0, 0, 0)

export const BIRTHDAY_LABEL = "30 September 2026"

/**
 * The photographs, front of the deck first. They render as a small stack of
 * prints; the first one is the one that was already here.
 *
 * To add the other three: drop the files into /public with these names, then
 * replace each `alt` below with a real description of what is actually in the
 * photo. Any file that is missing is quietly dropped from the deck rather than
 * showing a broken image, so the order here can run ahead of the files.
 */
export const MEMORY_PHOTOS = [
  {
    src: "/memory.jpg",
    alt: `An old photograph of ${RECIPIENT} and me, taken years ago when we were young`,
  },
  { src: "/memory-2.jpg", alt: `An old photograph of ${RECIPIENT} and me` },
  { src: "/memory-3.jpg", alt: `An old photograph of ${RECIPIENT} and me` },
  { src: "/memory-4.jpg", alt: `An old photograph of ${RECIPIENT} and me` },
]

export const MEMORY_PHOTO_CAPTION = "A long time ago."
