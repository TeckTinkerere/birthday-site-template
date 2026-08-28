# Circular Memory Gallery Implementation Plan

> **For agentic workers:** Execute this plan inline task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the memory chapter's interactive stacked photographs with an auto-moving, circular OGL gallery of local placeholder images.

**Architecture:** `CircularGallery` owns WebGL rendering, looping, auto-scroll, pointer/wheel/keyboard input, font resolution, and cleanup. `MemoryTrust` continues to own the letter timing and only maps centralised memory data into gallery items. `MEMORY_PHOTOS` declares four valid local paths, with the two available images reused as placeholders.

**Tech Stack:** Next.js App Router, React 19, OGL 1.0.11, Framer Motion, CSS Modules.

## Global Constraints

- Use the OGL dependency at exact version `1.0.11`.
- Use only existing local images: `/memory.jpg` and `/memory-2.jpg`.
- Do not provide a download link or any image-download UI.
- Respect reduced-motion preferences by disabling automatic gallery movement.
- Retain the current memory chapter timing, caption, and continuation UI.
- This repository has no automated-test framework; validate with `npm run lint` and `npm run build`.

---

### Task 1: Add the reusable WebGL gallery

**Files:**
- Create: `src/components/circular-gallery.jsx`
- Create: `src/components/circular-gallery.module.css`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `items: Array<{ image: string, text: string }>`.
- Produces: `CircularGallery` with `bend`, `textColor`, `borderRadius`, `font`, `fontUrl`, `scrollSpeed`, `scrollEase`, and `autoScrollSpeed` props.

- [ ] Install `ogl@1.0.11` with `npm install ogl@1.0.11 --save-exact`.
- [ ] Render each image and text label as OGL media planes in a circular layout.
- [ ] Duplicate media planes internally for seamless wrapping, auto-advance when `autoScrollSpeed` is positive, and pause automatic movement during pointer drag.
- [ ] Support keyboard arrow keys, Home, drag, wheel, and cleanup every renderer/listener/animation frame on unmount.

### Task 2: Integrate it into the memory chapter

**Files:**
- Modify: `src/components/memory-trust.jsx`
- Modify: `src/lib/content.js`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `MEMORY_PHOTOS` as four local records including `src`, `alt`, and `text`.
- Produces: A timed memory gallery with no download action.

- [ ] Change the third and fourth photo records to reuse the two present local files as temporary placeholders.
- [ ] Replace the stacked card buttons with a fixed-height `CircularGallery` wrapper.
- [ ] Pass `autoScrollSpeed={0}` when reduced motion is requested.
- [ ] Keep the static caption and remove the old card-stack CSS and save-link logic.

### Task 3: Verify the application

**Files:**
- Verify: `src/components/circular-gallery.jsx`
- Verify: `src/components/memory-trust.jsx`

- [ ] Run `npm run lint`; expected result: no ESLint errors.
- [ ] Run `npm run build`; expected result: Next.js production build completes successfully.
- [ ] Manually check the memory chapter: it displays four local placeholders, scrolls in a continuous curved loop, supports drag/wheel/keyboard navigation, and has no download action.
