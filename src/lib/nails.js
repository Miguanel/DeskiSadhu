import { FEET_CONTACT_CM2, GEOMETRY, LEVELS, REFERENCE_WEIGHT_KG } from '../config/catalog'

/**
 * Rozmieszczenie gwoździ i otworów (mm, względem środka deski: x – w poprzek, y – wzdłuż).
 *
 * Gwoździe tworzą siatkę heksagonalną: każdy ma 6 sąsiadów w odległości `spacing` (8 / 10 / 12 mm),
 * rzędy co spacing·√3/2, co drugi przesunięty o spacing/2.
 *
 * Otwory na gwoździe drugiej deski leżą w środkach trójkątów siatki – każdy otwór jest przesunięty
 * względem „swojego” gwoździa o spacing/√3 wzdłuż deski. Komplet składa się gwoździami do środka,
 * obracając jedną deskę „końcem na koniec” (oś obrotu – szerokość deski). To odbicie y → −y, więc
 * siatka jest ułożona symetrycznie: nieparzysta liczba rzędów (N + 1, N parzyste) i środek całego
 * wzoru (gwoździe + otwory) w środku deski. Dzięki temu gwoździe jednej deski trafiają dokładnie
 * w otwory drugiej i deski zachodzą na siebie, zamiast stykać się czubkami.
 */
export function nailLayout(length, width, spacing, margin = GEOMETRY.margin) {
  const rowPitch = (spacing * Math.sqrt(3)) / 2
  const shift = spacing / Math.sqrt(3) // gwóźdź → jego otwór
  const usableL = length - 2 * margin
  const usableW = width - 2 * margin
  const N = Math.max(0, 2 * Math.floor((usableL - shift) / (2 * rowPitch) + 1e-6))
  const rows = N + 1
  // Pole symetryczne w poprzek deski (jak na płycie z produkcji): pełne rzędy po `colsFull`
  // gwoździ, rzędy przesunięte o pół rozstawu – o jeden gwóźdź krótsze. Skrajne rzędy (na obu
  // końcach) to rzędy krótsze.
  const colsFull = Math.max(2, Math.floor(usableW / spacing + 1e-6) + 1)
  const colsShort = colsFull - 1
  const spanW = (colsFull - 1) * spacing
  const x0 = -spanW / 2
  const y0 = -(N * rowPitch + shift) / 2

  const all = []
  for (let r = 0; r < rows; r++) {
    const short = r % 2 === 0
    const n = short ? colsShort : colsFull
    const xo = short ? spacing / 2 : 0
    for (let c = 0; c < n; c++) all.push([x0 + xo + c * spacing, y0 + r * rowPitch])
  }

  // Narożniki pola ścięte „schodkowo” wzdłuż linii siatki (60°): skrajny rząd traci po jednym
  // gwoździu z każdej strony, następny też, kolejne są pełne (przy fieldCornerCut = 1 rozstaw).
  const cut = GEOMETRY.fieldCornerCut * spacing
  const yMin = y0
  const yMax = y0 + N * rowPitch
  const points = cut > 0
    ? all.filter(([x, y]) => {
        const dx = Math.min(x - x0, x0 + spanW - x)
        const dy = Math.min(y - yMin, yMax - y)
        return dx >= cut - dy / Math.sqrt(3) - 0.05 * spacing
      })
    : all

  // Otwory = odbicie gwoździ (x, y) → (x, −y): dokładnie tam trafią gwoździe drugiej deski
  // po złożeniu „końcem na koniec”. Dla pełnej siatki to to samo co gwóźdź + spacing/√3.
  const holes = points.map(([x, y]) => [x, -y])
  return { points, holes, rows, colsFull, colsShort, rowPitch, shift }
}

/** Statystyki kompletu (2 deski) */
export function nailStats(config) {
  const level = LEVELS.find((l) => l.id === config.level)
  const { points, rows } = nailLayout(config.length, config.width, level.spacing)
  const perBoard = points.length
  const areaCm2 = (config.length * config.width) / 100
  const density = perBoard / areaCm2 // gwoździ / cm²
  const underFeet = density * FEET_CONTACT_CM2
  const gramsPerNail = (REFERENCE_WEIGHT_KG * 1000) / underFeet
  return {
    spacing: level.spacing,
    perBoard,
    total: perBoard * 2,
    rows,
    density,
    gramsPerNail,
    level,
  }
}
