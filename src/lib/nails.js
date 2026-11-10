import { FEET_CONTACT_CM2, GEOMETRY, LEVELS, REFERENCE_WEIGHT_KG } from '../config/catalog'

/**
 * Rozmieszczenie gwoździ w układzie heksagonalnym.
 * Każdy gwóźdź ma 6 sąsiadów w odległości dokładnie `spacing` (8 / 10 / 12 mm):
 * rzędy co spacing·√3/2, co drugi rząd przesunięty o spacing/2.
 * Siatka jest wyśrodkowana na desce, a gwoździe trzymają się min. `margin` od krawędzi.
 *
 * Zwraca współrzędne w mm względem środka deski: x – w poprzek (szerokość), y – wzdłuż (długość).
 */
export function nailLayout(length, width, spacing, margin = GEOMETRY.margin) {
  const rowPitch = (spacing * Math.sqrt(3)) / 2
  const usableL = length - 2 * margin
  const usableW = width - 2 * margin
  const rows = Math.max(1, Math.floor(usableL / rowPitch + 1e-6) + 1)
  const colsEven = Math.max(1, Math.floor(usableW / spacing + 1e-6) + 1)
  // rząd przesunięty o pół rozstawu mieści się tylko wtedy, gdy jest na niego miejsce
  const colsOdd = Math.max(0, Math.floor((usableW - spacing / 2) / spacing + 1e-6) + 1)

  const spanL = (rows - 1) * rowPitch
  // szerokość zajmowana przez siatkę (z rzędami przesuniętymi)
  const spanW = colsOdd >= colsEven ? (colsEven - 1) * spacing + spacing / 2 : (colsEven - 1) * spacing
  const x0 = -spanW / 2
  const y0 = -spanL / 2

  const points = []
  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1
    const n = odd ? colsOdd : colsEven
    const xo = odd ? spacing / 2 : 0
    for (let c = 0; c < n; c++) points.push([x0 + xo + c * spacing, y0 + r * rowPitch])
  }
  return { points, rows, colsEven, colsOdd, rowPitch }
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
