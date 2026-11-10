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
  const colsEven = Math.max(1, Math.floor(usableW / spacing + 1e-6) + 1)
  // rząd przesunięty o pół rozstawu mieści się tylko wtedy, gdy jest na niego miejsce
  const colsOdd = Math.max(0, Math.floor((usableW - spacing / 2) / spacing + 1e-6) + 1)

  // szerokość zajmowana przez siatkę (z rzędami przesuniętymi)
  const spanW = colsOdd >= colsEven ? (colsEven - 1) * spacing + spacing / 2 : (colsEven - 1) * spacing
  const x0 = -spanW / 2
  const y0 = -(N * rowPitch + shift) / 2

  const points = []
  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1
    const n = odd ? colsOdd : colsEven
    const xo = odd ? spacing / 2 : 0
    for (let c = 0; c < n; c++) points.push([x0 + xo + c * spacing, y0 + r * rowPitch])
  }
  const holes = points.map(([x, y]) => [x, y + shift])
  return { points, holes, rows, colsEven, colsOdd, rowPitch, shift }
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
