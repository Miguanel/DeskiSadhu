/**
 * GRAFIKA DESEK – okleina, sklejka i wzory graweru rysowane proceduralnie na <canvas>.
 * ---------------------------------------------------------------
 * Nowy wzór graweru = nowa funkcja w DESIGN_DRAW (rysuje wokół punktu (0,0) w promieniu r)
 * + wpis w DESIGNS w src/config/catalog.js.
 * Funkcje rysują na osobnej, przezroczystej warstwie w kolorze graweru – można więc używać
 * 'destination-out' do „wycinania” (np. wnętrza kół w Drzewie Życia).
 */

/** Deterministyczny generator liczb losowych – słoje drewna nie „skaczą” przy każdej zmianie */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TAU = Math.PI * 2
const polar = (a, d) => [Math.cos(a) * d, Math.sin(a) * d]

function circle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.stroke()
}
function line(ctx, [x1, y1], [x2, y2]) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}
function poly(ctx, pts, fill = false) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  fill ? ctx.fill() : ctx.stroke()
}

/** Słoje drewna (okleina / sklejka) */
export function drawWood(ctx, w, h, base, grain, { seed = 7, strength = 1 } = {}) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  const rand = rng(seed)
  // delikatne, szerokie pasma koloru
  for (let i = 0; i < 14; i++) {
    const x = rand() * w
    const bw = (0.04 + rand() * 0.12) * w
    const g = ctx.createLinearGradient(x - bw, 0, x + bw, 0)
    g.addColorStop(0, 'transparent')
    g.addColorStop(0.5, grain)
    g.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.08 * strength
    ctx.fillStyle = g
    ctx.fillRect(x - bw, 0, bw * 2, h)
  }
  // drobne, faliste słoje wzdłuż deski
  ctx.strokeStyle = grain
  for (let i = 0; i < 120; i++) {
    const x0 = rand() * w
    const amp = (0.002 + rand() * 0.01) * w
    const freq = 1 + rand() * 3
    const ph = rand() * TAU
    ctx.globalAlpha = (0.05 + rand() * 0.18) * strength
    ctx.lineWidth = 0.5 + rand() * w * 0.003
    ctx.beginPath()
    for (let y = 0; y <= h; y += h / 60) {
      const x = x0 + Math.sin((y / h) * TAU * freq + ph) * amp
      y ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// ---------------------------------------------------------------- wzory

function metatron(ctx, r) {
  const d = r / 2.5
  const pts = [[0, 0]]
  for (let k = 0; k < 6; k++) pts.push(polar(-Math.PI / 2 + (k * TAU) / 6, d))
  for (let k = 0; k < 6; k++) pts.push(polar(-Math.PI / 2 + (k * TAU) / 6, 2 * d))
  for (const [x, y] of pts) circle(ctx, x, y, d / 2)
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) line(ctx, pts[i], pts[j])
}

function flower(ctx, r) {
  const s = r / 3.1
  const pts = [[0, 0]]
  for (let k = 0; k < 6; k++) {
    pts.push(polar((k * TAU) / 6 + Math.PI / 6, s))
    pts.push(polar((k * TAU) / 6 + Math.PI / 6, 2 * s))
    pts.push(polar((k * TAU) / 6, s * Math.sqrt(3)))
  }
  // koła przycięte do okręgu 3s – klasyczny Kwiat Życia
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, 3 * s, 0, TAU)
  ctx.clip()
  for (const [x, y] of pts) circle(ctx, x, y, s)
  ctx.restore()
  circle(ctx, 0, 0, 3 * s)
  circle(ctx, 0, 0, 3 * s + ctx.lineWidth * 2.2)
}

function seed(ctx, r) {
  const s = r / 2.1
  circle(ctx, 0, 0, s)
  for (let k = 0; k < 6; k++) {
    const [x, y] = polar((k * TAU) / 6 + Math.PI / 6, s)
    circle(ctx, x, y, s)
  }
  circle(ctx, 0, 0, 2 * s)
  circle(ctx, 0, 0, 2 * s + ctx.lineWidth * 2.2)
}

function sriyantra(ctx, r) {
  const u = r / 1.95
  ctx.save()
  ctx.scale(u, u)
  ctx.lineWidth /= u
  const tri = (apex, base, up) => {
    const hw = Math.sqrt(Math.max(0.02, 1 - base * base)) * 0.98
    // y rośnie w dół na canvasie – "up" = wierzchołek u góry
    const a = up ? -apex : apex
    const b = up ? -base : base
    poly(ctx, [[0, a], [-hw, b], [hw, b]])
  }
  // 4 trójkąty skierowane w górę (Śiwa) i 5 w dół (Śakti) – przybliżenie geometrii jantry
  ;[[0.98, -0.52], [0.62, -0.3], [0.36, -0.66], [0.16, -0.14]].forEach(([a, b]) => tri(a, b, true))
  ;[[0.98, -0.6], [0.7, -0.36], [0.5, -0.78], [0.3, -0.12], [0.08, -0.44]].forEach(([a, b]) => tri(a, b, false))
  ctx.beginPath()
  ctx.arc(0, 0, 0.035, 0, TAU)
  ctx.fill()
  circle(ctx, 0, 0, 1.04)
  const petals = (n, r0, r1, rot = 0) => {
    for (let k = 0; k < n; k++) {
      const a = rot + (k * TAU) / n
      const half = Math.PI / n
      const p0 = polar(a - half, r0)
      const p1 = polar(a + half, r0)
      const tip = polar(a, r1)
      const c0 = polar(a - half * 0.55, r1 * 0.96)
      const c1 = polar(a + half * 0.55, r1 * 0.96)
      ctx.beginPath()
      ctx.moveTo(...p0)
      ctx.quadraticCurveTo(...c0, ...tip)
      ctx.quadraticCurveTo(...c1, ...p1)
      ctx.stroke()
    }
  }
  petals(8, 1.04, 1.34, -Math.PI / 2)
  circle(ctx, 0, 0, 1.38)
  petals(16, 1.38, 1.62, -Math.PI / 2)
  ;[1.66, 1.71, 1.76].forEach((rr) => circle(ctx, 0, 0, rr))
  // bhupura – kwadratowe obramowanie z czterema bramami
  const s = 1.92
  const g = 0.36
  const gd = 0.14
  for (let k = 0; k < 4; k++) {
    ctx.save()
    ctx.rotate((k * TAU) / 4)
    ctx.beginPath()
    ctx.moveTo(-s, -s)
    ctx.lineTo(-g, -s)
    ctx.lineTo(-g, -s - gd)
    ctx.lineTo(g, -s - gd)
    ctx.lineTo(g, -s)
    ctx.lineTo(s, -s)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function merkaba(ctx, r) {
  const R = r * 0.92
  const up = [0, 1, 2].map((k) => polar(-Math.PI / 2 + (k * TAU) / 3, R))
  const dn = [0, 1, 2].map((k) => polar(Math.PI / 2 + (k * TAU) / 3, R))
  poly(ctx, up)
  poly(ctx, dn)
  // krawędzie "w głąb" – trójwymiarowy charakter gwiazdy czworościennej
  for (const p of [...up, ...dn]) line(ctx, p, [0, 0])
  const hex = [0, 1, 2, 3, 4, 5].map((k) => polar(-Math.PI / 2 + (k * TAU) / 6 + Math.PI / 6, R / Math.sqrt(3)))
  poly(ctx, hex)
  circle(ctx, 0, 0, R * 1.06)
}

function tree(ctx, r) {
  const u = r / 2.45
  const P = {
    k: [0, 0], ch: [1, 0.6], b: [-1, 0.6], che: [1, 1.8], g: [-1, 1.8],
    t: [0, 2.4], n: [1, 3], h: [-1, 3], y: [0, 3.6], m: [0, 4.75],
  }
  const at = (id) => [P[id][0] * u * 1.05, (P[id][1] - 2.38) * u]
  const paths = 'k-ch k-b k-t ch-b ch-t ch-che b-t b-g che-g che-t che-n g-t g-h t-n t-h t-y n-h n-y n-m h-y h-m y-m'
  for (const p of paths.split(' ')) {
    const [a, b] = p.split('-')
    line(ctx, at(a), at(b))
  }
  const sr = u * 0.3
  for (const id of Object.keys(P)) {
    const [x, y] = at(id)
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, sr, 0, TAU)
    ctx.fill()
    ctx.restore()
    circle(ctx, x, y, sr)
  }
}

function lotus(ctx, r) {
  const petal = (a, len, wid, y0 = 0) => {
    ctx.save()
    ctx.translate(0, y0)
    ctx.rotate(a)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(wid, -len * 0.3, wid * 0.7, -len * 0.8, 0, -len)
    ctx.bezierCurveTo(-wid * 0.7, -len * 0.8, -wid, -len * 0.3, 0, 0)
    ctx.stroke()
    ctx.restore()
  }
  const base = r * 0.38
  // płatki od zewnątrz do środka
  ;[-1.25, -0.82, 0.82, 1.25].forEach((a) => petal(a, r * 0.8, r * 0.2, base))
  ;[-0.42, 0.42].forEach((a) => petal(a, r * 0.95, r * 0.24, base))
  petal(0, r * 1.18, r * 0.27, base)
  // woda / podstawa
  for (let i = 0; i < 3; i++) {
    const y = base + r * (0.12 + i * 0.13)
    const w = r * (0.95 - i * 0.18)
    ctx.beginPath()
    ctx.moveTo(-w, y)
    for (let x = -w; x <= w; x += w / 8) ctx.lineTo(x, y + Math.sin((x / w) * Math.PI * 4) * r * 0.025)
    ctx.stroke()
  }
  circle(ctx, 0, -r * 0.88, r * 0.1)
}

function sun(ctx, r) {
  circle(ctx, 0, 0, r * 0.42)
  circle(ctx, 0, 0, r * 0.32)
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.08, 0, TAU)
  ctx.fill()
  const n = 24
  for (let k = 0; k < n; k++) {
    const a = (k * TAU) / n
    const long = k % 2 === 0
    const r0 = r * 0.5
    const r1 = r * (long ? 1 : 0.78)
    const hw = (Math.PI / n) * 0.55
    poly(ctx, [polar(a - hw, r0), polar(a, r1), polar(a + hw, r0)])
  }
  for (let k = 0; k < 12; k++) {
    const [x, y] = polar((k * TAU) / 12 + Math.PI / 12, r * 0.37)
    ctx.beginPath()
    ctx.arc(x, y, r * 0.018, 0, TAU)
    ctx.fill()
  }
}

function yinyang(ctx, r) {
  const R = r * 0.9
  ctx.beginPath()
  ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2)
  ctx.arc(0, R / 2, R / 2, Math.PI / 2, -Math.PI / 2, true)
  ctx.arc(0, -R / 2, R / 2, Math.PI / 2, -Math.PI / 2)
  ctx.closePath()
  ctx.fill()
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(0, -R / 2, R * 0.13, 0, TAU)
  ctx.fill()
  ctx.restore()
  ctx.beginPath()
  ctx.arc(0, R / 2, R * 0.13, 0, TAU)
  ctx.fill()
  circle(ctx, 0, 0, R)
  circle(ctx, 0, 0, R + ctx.lineWidth * 2.4)
}

export const DESIGN_DRAW = { metatron, flower, seed, sriyantra, merkaba, tree, lotus, sun, yinyang }

/** Rysuje wzór (bez tła) w kolorze `color`, wyśrodkowany w (cx, cy) */
export function drawDesign(ctx, id, cx, cy, r, color, lineScale = 1) {
  const fn = DESIGN_DRAW[id]
  if (!fn) return
  ctx.save()
  ctx.translate(cx, cy)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(1, r * 0.018 * lineScale)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  fn(ctx, r)
  ctx.restore()
}

/**
 * Własny plik klienta → maska graweru. Obraz z przezroczystością: kształt = kanał alfa.
 * Obraz bez przezroczystości: ciemne piksele = grawer (np. czarne logo na białym tle).
 */
export function drawCustomImage(ctx, img, cx, cy, r, color, invert = false) {
  if (!img?.width) return
  const size = Math.round(r * 2)
  const off = document.createElement('canvas')
  off.width = off.height = size
  const o = off.getContext('2d')
  const k = Math.min(size / img.width, size / img.height)
  const w = img.width * k
  const h = img.height * k
  o.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
  const data = o.getImageData(0, 0, size, size)
  const px = data.data
  let transparent = 0
  for (let i = 3; i < px.length; i += 16) if (px[i] < 200) transparent++
  const useAlpha = transparent > px.length / 16 / 20 // >5% przezroczystych pikseli
  const [cr, cg, cb] = hexToRgb(color)
  for (let i = 0; i < px.length; i += 4) {
    const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255
    let a = useAlpha ? px[i + 3] / 255 : 1 - lum
    if (invert) a = useAlpha ? (px[i + 3] / 255) * lum : lum
    a = Math.min(1, Math.max(0, (a - 0.12) / 0.6)) // podbicie kontrastu – grawer jest jednobarwny
    px[i] = cr
    px[i + 1] = cg
    px[i + 2] = cb
    px[i + 3] = Math.round(a * 255)
  }
  o.putImageData(data, 0, 0)
  ctx.drawImage(off, cx - size / 2, cy - size / 2)
}

export function hexToRgb(hex) {
  const v = hex.replace('#', '')
  const n = parseInt(v.length === 3 ? v.replace(/./g, '$&$&') : v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Pełna grafika zewnętrznej strony deski: okleina + warstwa graweru (wzór, napis, plik).
 * `opts.engrave` – kolor graweru, `opts.board` – { design, text, font, textPos },
 * `opts.scale` (0.4–0.95) i `opts.offset` (-0.3…0.3) – rozmiar i położenie wzoru.
 */
export function paintOuterFace(canvas, opts) {
  const { wood, engrave, board, scale, offset, fontFamily, fontWeight, customImage, invert, seed: woodSeed } = opts
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext('2d')
  drawWood(ctx, W, H, wood.base, wood.grain, { seed: woodSeed })

  const layer = document.createElement('canvas')
  layer.width = W
  layer.height = H
  const l = layer.getContext('2d')
  const r = (W / 2) * scale
  const hasDesign = board.design !== 'none'
  const text = board.text?.trim()
  let cy = H / 2 + offset * H
  // napis nad / pod wzorem przesuwa kompozycję, by całość była wyśrodkowana
  const fontPx = W * (fontFamily === 'Great Vibes' ? 0.13 : 0.088)
  const textGap = r * 0.18 + fontPx * 0.6
  if (hasDesign && text && board.textPos !== 'center') cy += (board.textPos === 'below' ? -1 : 1) * (textGap / 2)

  if (board.design === 'custom') drawCustomImage(l, customImage, W / 2, cy, r, engrave.color, invert)
  else if (hasDesign) drawDesign(l, board.design, W / 2, cy, r, engrave.color, W / 700)

  if (text) {
    l.fillStyle = engrave.color
    l.textAlign = 'center'
    l.textBaseline = 'middle'
    let size = fontPx
    l.font = `${fontWeight} ${size}px "${fontFamily}", Georgia, serif`
    const maxW = W * 0.86
    const m = l.measureText(text).width
    if (m > maxW) {
      size *= maxW / m
      l.font = `${fontWeight} ${size}px "${fontFamily}", Georgia, serif`
    }
    let ty = cy
    if (hasDesign && board.textPos === 'below') ty = cy + r + textGap
    if (hasDesign && board.textPos === 'above') ty = cy - r - textGap
    if (hasDesign && board.textPos === 'center') {
      // tło pod napisem na środku wzoru – czytelność
      l.save()
      l.globalCompositeOperation = 'destination-out'
      const tw = Math.min(maxW, l.measureText(text).width) + size * 0.8
      l.fillRect(W / 2 - tw / 2, ty - size * 0.62, tw, size * 1.24)
      l.restore()
    }
    l.fillText(text, W / 2, ty)
  }

  // grawer wypalany jest lekko półprzezroczysty i "wtapia się" w drewno
  ctx.globalAlpha = engrave.id === 'burn' ? 0.82 : 0.96
  ctx.drawImage(layer, 0, 0)
  ctx.globalAlpha = 1
  return canvas
}

/** Strona wewnętrzna – sklejka z ciemniejszymi „gniazdami” u podstawy gwoździ */
export function paintInnerFace(canvas, { plywood, points, length, width, nailDiameter }) {
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext('2d')
  drawWood(ctx, W, H, plywood.base, plywood.grain, { seed: 21, strength: 0.7 })
  const k = W / width
  const rr = (nailDiameter / 2) * k
  for (const [x, y] of points) {
    const px = W / 2 + x * k
    const py = H / 2 - y * k
    const g = ctx.createRadialGradient(px, py, rr * 0.4, px, py, rr * 2.6)
    g.addColorStop(0, 'rgba(60,35,15,0.55)')
    g.addColorStop(1, 'rgba(60,35,15,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(px, py, rr * 2.6, 0, TAU)
    ctx.fill()
  }
  return canvas
}
