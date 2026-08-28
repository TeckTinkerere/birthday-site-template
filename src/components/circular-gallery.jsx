"use client"

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl"
import { useEffect, useRef } from "react"
import styles from "./circular-gallery.module.css"

const DEFAULT_FONT = "bold 30px Figtree"
const DEFAULT_FONT_URL = "https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap"

function debounce(func, wait) {
  let timeout

  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

function lerp(start, end, amount) {
  return start + (end - start) * amount
}

function deriveFontFamilyFromUrl(url) {
  const fileName = (url.split("/").pop() || "custom-font").split("?")[0]
  const base = fileName.replace(/\.(woff2?|ttf|otf|eot)$/i, "")
  return base.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "CircularGalleryFont"
}

async function loadFontFromStylesheet(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch font stylesheet (${response.status})`)

  const cssText = await response.text()
  const faceBlocks = cssText.match(/@font-face\s*{[^}]*}/g) || []
  const fontFaces = []
  let family = null

  for (const block of faceBlocks) {
    const familyMatch = block.match(/font-family:\s*['\"]?([^;'\"]+)['\"]?/)
    const urlMatch = block.match(/url\(\s*['\"]?([^'\")]+)['\"]?\s*\)/)
    if (!familyMatch || !urlMatch) continue

    family = familyMatch[1].trim()
    const descriptors = {}
    const weightMatch = block.match(/font-weight:\s*([^;]+);/)
    const styleMatch = block.match(/font-style:\s*([^;]+);/)
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/)

    if (weightMatch) descriptors.weight = weightMatch[1].trim()
    if (styleMatch) descriptors.style = styleMatch[1].trim()
    if (rangeMatch) descriptors.unicodeRange = rangeMatch[1].trim()

    fontFaces.push(new FontFace(family, `url(${urlMatch[1]})`, descriptors))
  }

  if (!family) throw new Error("No @font-face rule found in the stylesheet")

  await Promise.allSettled(
    fontFaces.map(async (face) => {
      await face.load()
      document.fonts.add(face)
    }),
  )

  return family
}

async function loadFontFromFile(url) {
  const family = deriveFontFamilyFromUrl(url)
  const fontFace = new FontFace(family, `url(${url})`)
  await fontFace.load()
  document.fonts.add(fontFace)
  return family
}

async function resolveFont(font, fontUrl) {
  const effectiveUrl = fontUrl || (font === DEFAULT_FONT ? DEFAULT_FONT_URL : null)

  if (!effectiveUrl) {
    try {
      await document.fonts?.load?.(font)
      await document.fonts?.ready
    } catch {
      // Canvas will use the closest font available to the browser.
    }
    return font
  }

  try {
    const isStylesheet =
      effectiveUrl.includes("fonts.googleapis.com") || /\.css(\?.*)?$/i.test(effectiveUrl)
    const family = isStylesheet
      ? await loadFontFromStylesheet(effectiveUrl)
      : await loadFontFromFile(effectiveUrl)
    const prefix = font.match(/^\s*(.*?\d+px)/)?.[1]?.trim() || "bold 30px"
    const resolved = `${prefix} \"${family}\"`

    try {
      await document.fonts?.load?.(resolved)
    } catch {
      // Rendering can still continue with the requested family.
    }

    return resolved
  } catch (error) {
    console.error("CircularGallery: unable to load font", error)
    return font
  }
}

function getFontSize(font) {
  return Number(font.match(/(\d+)px/)?.[1] || 30)
}

function createTextTexture(gl, text, font, color) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  context.font = font

  const textWidth = Math.ceil(context.measureText(text).width)
  const textHeight = Math.ceil(getFontSize(font) * 1.2)
  canvas.width = textWidth + 20
  canvas.height = textHeight + 20

  context.font = font
  context.fillStyle = color
  context.textBaseline = "middle"
  context.textAlign = "center"
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new Texture(gl, { generateMipmaps: false })
  texture.image = canvas
  return { texture, width: canvas.width, height: canvas.height }
}

class Title {
  constructor({ gl, plane, text, textColor, font }) {
    this.gl = gl
    this.plane = plane
    this.text = text
    this.textColor = textColor
    this.font = font
    this.createMesh()
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor)
    const geometry = new Plane(this.gl)
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    })

    this.mesh = new Mesh(this.gl, { geometry, program })
    const textHeight = this.plane.scale.y * 0.15
    this.mesh.scale.set(textHeight * (width / height), textHeight, 1)
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05
    this.mesh.setParent(this.plane)
  }
}

class Media {
  constructor({ geometry, gl, image, index, length, scene, screen, text, viewport, bend, textColor, borderRadius, font }) {
    this.geometry = geometry
    this.gl = gl
    this.image = image
    this.index = index
    this.length = length
    this.scene = scene
    this.screen = screen
    this.text = text
    this.viewport = viewport
    this.bend = bend
    this.textColor = textColor
    this.borderRadius = borderRadius
    this.font = font
    this.extra = 0
    this.createShader()
    this.createMesh()
    this.createTitle()
    this.onResize()
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true })
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          float distance = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float alpha = 1.0 - smoothstep(-0.002, 0.002, distance);
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [1, 1] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    })

    const image = new Image()
    image.src = this.image
    image.onload = () => {
      texture.image = image
      this.program.uniforms.uImageSizes.value = [image.naturalWidth, image.naturalHeight]
    }
  }

  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program })
    this.plane.setParent(this.scene)
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    })
  }

  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra
    const x = this.plane.position.x
    const halfViewport = this.viewport.width / 2

    if (this.bend === 0) {
      this.plane.position.y = 0
      this.plane.rotation.z = 0
    } else {
      const absoluteBend = Math.abs(this.bend)
      const radius = (halfViewport * halfViewport + absoluteBend * absoluteBend) / (2 * absoluteBend)
      const effectiveX = Math.min(Math.abs(x), halfViewport)
      const arc = radius - Math.sqrt(radius * radius - effectiveX * effectiveX)
      this.plane.position.y = this.bend > 0 ? -arc : arc
      this.plane.rotation.z = (this.bend > 0 ? -1 : 1) * Math.sign(x) * Math.asin(effectiveX / radius)
    }

    this.speed = scroll.current - scroll.last
    this.program.uniforms.uTime.value += 0.04
    this.program.uniforms.uSpeed.value = this.speed

    const planeOffset = this.plane.scale.x / 2
    const viewportOffset = this.viewport.width / 2
    const isBefore = this.plane.position.x + planeOffset < -viewportOffset
    const isAfter = this.plane.position.x - planeOffset > viewportOffset

    if (direction === "right" && isBefore) this.extra -= this.widthTotal
    if (direction === "left" && isAfter) this.extra += this.widthTotal
  }

  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen
    if (viewport) this.viewport = viewport

    const scale = this.screen.height / 1500
    this.plane.scale.y = (this.viewport.height * (900 * scale)) / this.screen.height
    this.plane.scale.x = (this.viewport.width * (700 * scale)) / this.screen.width
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]

    this.width = this.plane.scale.x + 2
    this.widthTotal = this.width * this.length
    this.x = this.width * this.index
  }
}

class GalleryApp {
  constructor(container, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, autoScrollSpeed }) {
    this.container = container
    this.scrollSpeed = scrollSpeed
    this.autoScrollSpeed = autoScrollSpeed
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 }
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200)
    this.createRenderer()
    this.createCamera()
    this.createScene()
    this.onResize()
    this.createGeometry()
    this.createMedias(items, bend, textColor, borderRadius, font)
    this.addEventListeners()
    this.update()
  }

  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)
    this.container.appendChild(this.gl.canvas)
  }

  createCamera() {
    this.camera = new Camera(this.gl)
    this.camera.fov = 45
    this.camera.position.z = 20
  }

  createScene() {
    this.scene = new Transform()
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 })
  }

  createMedias(items, bend, textColor, borderRadius, font) {
    const galleryItems = items.length ? items : []
    this.mediasImages = galleryItems.concat(galleryItems)
    this.medias = this.mediasImages.map(
      (item, index) =>
        new Media({
          geometry: this.planeGeometry,
          gl: this.gl,
          image: item.image,
          index,
          length: this.mediasImages.length,
          scene: this.scene,
          screen: this.screen,
          text: item.text,
          viewport: this.viewport,
          bend,
          textColor,
          borderRadius,
          font,
        }),
    )
  }

  onPointerDown(event) {
    this.isDown = true
    this.scroll.position = this.scroll.current
    this.start = event.clientX
    this.container.setPointerCapture?.(event.pointerId)
  }

  onPointerMove(event) {
    if (!this.isDown) return
    this.scroll.target = this.scroll.position + (this.start - event.clientX) * (this.scrollSpeed * 0.025)
  }

  onPointerUp() {
    this.isDown = false
    this.onCheck()
  }

  onWheel(event) {
    event.preventDefault()
    this.scroll.target += (event.deltaY > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2
    this.onCheckDebounce()
  }

  onKeyDown(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      this.scroll.target += this.scrollSpeed * 5
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      this.scroll.target -= this.scrollSpeed * 5
    } else if (event.key === "Home") {
      event.preventDefault()
      this.scroll.target = 0
    } else {
      return
    }
    this.onCheckDebounce()
  }

  onCheck() {
    const width = this.medias?.[0]?.width
    if (!width) return
    const item = width * Math.round(Math.abs(this.scroll.target) / width)
    this.scroll.target = this.scroll.target < 0 ? -item : item
  }

  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight }
    this.renderer.setSize(this.screen.width, this.screen.height)
    this.camera.perspective({ aspect: this.screen.width / this.screen.height })

    const fov = (this.camera.fov * Math.PI) / 180
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    this.viewport = { width: height * this.camera.aspect, height }
    this.medias?.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }))
  }

  update() {
    if (!this.isDown && this.autoScrollSpeed > 0 && !document.hidden) {
      this.scroll.target += this.autoScrollSpeed
    }

    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)
    const direction = this.scroll.current > this.scroll.last ? "right" : "left"
    this.medias?.forEach((media) => media.update(this.scroll, direction))
    this.renderer.render({ scene: this.scene, camera: this.camera })
    this.scroll.last = this.scroll.current
    this.raf = window.requestAnimationFrame(this.update.bind(this))
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this)
    this.boundOnPointerDown = this.onPointerDown.bind(this)
    this.boundOnPointerMove = this.onPointerMove.bind(this)
    this.boundOnPointerUp = this.onPointerUp.bind(this)
    this.boundOnWheel = this.onWheel.bind(this)
    this.boundOnKeyDown = this.onKeyDown.bind(this)

    window.addEventListener("resize", this.boundOnResize)
    this.container.addEventListener("pointerdown", this.boundOnPointerDown)
    this.container.addEventListener("pointermove", this.boundOnPointerMove)
    this.container.addEventListener("pointerup", this.boundOnPointerUp)
    this.container.addEventListener("pointercancel", this.boundOnPointerUp)
    this.container.addEventListener("wheel", this.boundOnWheel, { passive: false })
    this.container.addEventListener("keydown", this.boundOnKeyDown)
  }

  destroy() {
    window.cancelAnimationFrame(this.raf)
    window.removeEventListener("resize", this.boundOnResize)
    this.container.removeEventListener("pointerdown", this.boundOnPointerDown)
    this.container.removeEventListener("pointermove", this.boundOnPointerMove)
    this.container.removeEventListener("pointerup", this.boundOnPointerUp)
    this.container.removeEventListener("pointercancel", this.boundOnPointerUp)
    this.container.removeEventListener("wheel", this.boundOnWheel)
    this.container.removeEventListener("keydown", this.boundOnKeyDown)
    this.renderer.gl.canvas.remove()
  }
}

export default function CircularGallery({
  items = [],
  bend = 3,
  textColor = "#ffffff",
  borderRadius = 0.05,
  font = DEFAULT_FONT,
  fontUrl,
  scrollSpeed = 2,
  scrollEase = 0.05,
  autoScrollSpeed = 0.018,
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !items.length) return undefined

    let app
    let mounted = true

    resolveFont(font, fontUrl).then((resolvedFont) => {
      if (!mounted || !containerRef.current) return
      app = new GalleryApp(containerRef.current, {
        items,
        bend,
        textColor,
        borderRadius,
        font: resolvedFont,
        scrollSpeed,
        scrollEase,
        autoScrollSpeed,
      })
    })

    return () => {
      mounted = false
      app?.destroy()
    }
  }, [items, bend, textColor, borderRadius, font, fontUrl, scrollSpeed, scrollEase, autoScrollSpeed])

  return (
    <div
      ref={containerRef}
      className={styles.gallery}
      tabIndex={0}
      role="region"
      aria-label="Circular image gallery. It moves automatically. Drag, scroll, or use the left and right arrow keys to browse."
    >
      <ul className={styles.screenReaderList} aria-label="Gallery image descriptions">
        {items.map((item, index) => (
          <li key={`${item.image}-${index}`}>{item.description || item.text}</li>
        ))}
      </ul>
    </div>
  )
}
