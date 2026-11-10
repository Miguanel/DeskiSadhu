import * as THREE from 'three'

/**
 * TOR RUCHU DESEK PRZY ZMIANIE WIDOKU (bez przenikania)
 * ---------------------------------------------------------------
 * Fazy w czasie t: 0 → 1
 *  1. deska leżąca na drugiej (złożony komplet) najpierw unosi się pionowo – gwoździe wychodzą z otworów,
 *  2. deski rozjeżdżają się na boki i do góry: odstęp i wysokość wynikają z promienia R kuli
 *     obejmującej deskę z gwoździami, więc obracająca się deska nie zahaczy o drugą ani o podłogę,
 *  3. obrót odbywa się tylko wtedy, gdy deski są rozsunięte,
 *  4. deski wracają do środka; jeśli kończą złożone, górna opada pionowo na samym końcu.
 * Czysta funkcja (bez Reacta) – sprawdzana testem kolizji.
 */
export const TRANSITION_S = 1.7

const smooth = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}
/** narasta w [a, b], trzyma, opada w [c, d] */
const bump = (t, a, b, c, d) => smooth(a, b, t) * (1 - smooth(c, d, t))

/** Która deska leży na drugiej (nachodzą na siebie w rzucie z góry i są na różnych wysokościach); -1 – żadna */
export function upperOf(a, b, L, W, T) {
  const overlap = Math.abs(a.x - b.x) < W * 0.9 && Math.abs(a.z - b.z) < L * 0.9
  if (!overlap || Math.abs(a.y - b.y) < T) return -1
  return a.y > b.y ? 0 : 1
}

// narożniki bryły deski z gwoździami w układzie deski (cm)
function localCorners({ W, L, T, H }) {
  const out = []
  for (const x of [-W / 2, W / 2]) for (const y of [0, T + H]) for (const z of [-L / 2, L / 2]) out.push(new THREE.Vector3(x, y, z))
  return out
}
const _v = new THREE.Vector3()
/** zasięg obróconej bryły: [min y, połowa szerokości w osi X] względem środka deski */
function extent(corners, q) {
  let minY = Infinity
  let minX = Infinity
  let maxX = -Infinity
  for (const c of corners) {
    _v.copy(c).applyQuaternion(q)
    minY = Math.min(minY, _v.y)
    minX = Math.min(minX, _v.x)
    maxX = Math.max(maxX, _v.x)
  }
  return { minY, left: -minX, right: maxX }
}

/**
 * Położenie obu desek w chwili t.
 * a = { start: [{p, q}×2], end: [{p, q}×2], upperStart, upperEnd }, dims = { W, L, T, H } (cm),
 * clear – uniesienie potrzebne do wysunięcia gwoździ z otworów (cm).
 *
 * Odsunięcie na boki jest minimalne: tyle, by rzuty desek na oś X się nie nakładały przy żadnym
 * kącie obrotu (oś X jest wtedy osią rozdzielającą – deski nie mogą się przeciąć).
 * Uniesienie też jest minimalne: najniższy narożnik / czubek gwoździa nie schodzi pod podłogę.
 */
export function transitionFrame(a, t, dims, clear) {
  const p = smooth(0.3, 0.7, t) // przesunięcie bazowe
  const r = smooth(0.35, 0.65, t) // obrót – tylko w środku toru
  const apart = bump(t, 0.18, 0.38, 0.62, 0.82) // rozsunięcie na boki
  const liftStart = bump(t, 0, 0.18, 0.55, 0.75)
  const liftEnd = bump(t, 0.25, 0.45, 0.82, 1)
  const margin = 1.2

  // największy zasięg w osi X każdej deski w trakcie całego obrotu (liczony raz na przejście)
  if (!a.reach) {
    const corners = localCorners(dims)
    a.corners = corners
    a.reach = [0, 1].map((i) => {
      let left = 0
      let right = 0
      for (let k = 0; k <= 32; k++) {
        const e = extent(corners, a.start[i].q.clone().slerp(a.end[i].q, k / 32))
        left = Math.max(left, e.left)
        right = Math.max(right, e.right)
      }
      return { left, right }
    })
  }

  const q = [0, 1].map((i) => a.start[i].q.clone().slerp(a.end[i].q, r))
  const pos = [0, 1].map((i) => a.start[i].p.clone().lerp(a.end[i].p, p))

  // deska 0 po lewej, 1 po prawej: wymagany odstęp środków w osi X
  const need = a.reach[0].right + a.reach[1].left + margin
  const push = Math.max(0, need - (pos[1].x - pos[0].x)) / 2
  pos[0].x -= push * apart
  pos[1].x += push * apart

  // wspólne uniesienie (zachowuje kolejność desek w pionie) – nic nie schodzi pod podłogę
  const rise = Math.max(0, ...[0, 1].map((i) => -(pos[i].y + extent(a.corners, q[i]).minY)))
  return [0, 1].map((i) => {
    pos[i].y += rise
    if (a.upperStart === i) pos[i].y += clear * liftStart
    if (a.upperEnd === i) pos[i].y += clear * liftEnd
    return { p: pos[i], q: q[i] }
  })
}
