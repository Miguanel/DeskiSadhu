import { ACCESSORIES, COLORS, DESIGNS, ENGRAVE_COLORS, FONTS, LEVELS, NAILS, SIZE, TEXT_POSITIONS } from '../config/catalog'
import { ACCESSORY_PRICES, BOARD_SET, CURRENCY, NAIL_PRICE, ROUND_TO, SURCHARGES } from '../config/pricing'
import { nailStats } from './nails'

export const nf = (v, digits = 0) =>
  Number(v).toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits })
export const money = (v) => (v == null ? 'do wyceny' : `${nf(v)} ${CURRENCY}`)

const roundUp = (v) => Math.ceil(v / ROUND_TO - 1e-9) * ROUND_TO

export const isStandardSize = (c) => c.length === SIZE.standard.length && c.width === SIZE.standard.width
export const cm = (mm) => nf(mm / 10, mm % 10 ? 1 : 0)

/** Grawer na i-tej desce, z uwzględnieniem trybu „ten sam na obu” */
export function boardEngraving(config, i) {
  return config.sameEngraving ? config.boards[0] : config.boards[i]
}

/**
 * Raport cenowy: pozycje kompletu, dodatki, ilość i suma.
 * Pozycja z `amount: null` jest do indywidualnej wyceny – suma oznaczana jest wtedy jako „od”.
 */
export function buildQuote(config) {
  const stats = nailStats(config)
  const level = stats.level
  const nail = NAILS.find((n) => n.id === config.nail)
  const color = COLORS.find((c) => c.id === config.color)
  const standardSize = isStandardSize(config)
  const areaFactor = (config.length * config.width) / (SIZE.standard.length * SIZE.standard.width)

  const lines = []
  const boardsCost = BOARD_SET * areaFactor
  const nailsCost = stats.total * NAIL_PRICE[config.nail]
  lines.push({
    id: 'set',
    label: `Komplet desek Sadhu ${level.name} ${level.label}`,
    detail: `2 deski ${cm(config.length)} × ${cm(config.width)} cm, sklejka, ${stats.total} gwoździ (${nail.name.toLowerCase()})`,
    amount: roundUp(boardsCost + nailsCost),
  })
  if (!standardSize) {
    lines.push({ id: 'size', label: 'Wymiar niestandardowy', detail: 'Docięcie i rozplanowanie siatki na zamówienie', amount: SURCHARGES.customSize })
  }
  if (!color.standard) {
    lines.push({ id: 'color', label: `Kolor okleiny: ${color.name}`, detail: 'Kolor na zamówienie', amount: SURCHARGES.customColor })
  }

  const ec = ENGRAVE_COLORS.find((c) => c.id === config.engraveColor)
  // przy wspólnym grawerze jedna pozycja „obie deski” (napis liczony ×2)
  const groups = config.sameEngraving ? [[config.boards[0], 'obie deski', 2]] : [[config.boards[0], 'lewa deska', 1], [config.boards[1], 'prawa deska', 1]]
  groups.forEach(([b, side, n], i) => {
    if (b.design === 'custom') {
      lines.push({ id: `file${i}`, label: `Grawer z własnego pliku (${side})`, detail: config.customFileName || 'plik do przesłania', amount: SURCHARGES.customFile })
    } else if (b.design !== 'none') {
      const d = DESIGNS.find((x) => x.id === b.design)
      const amount = SURCHARGES.designPerBoard * n
      lines.push({ id: `design${i}`, label: `Grawer: ${d.name} (${side})`, detail: `Kolor: ${ec.name.toLowerCase()}`, amount })
    }
    if (b.text?.trim()) {
      const f = FONTS.find((x) => x.id === b.font)
      lines.push({
        id: `text${i}`,
        label: `Napis „${b.text.trim()}” (${side})`,
        detail: `Krój: ${f.name.toLowerCase()}${n > 1 ? ` · ${n} × ${SURCHARGES.text} ${CURRENCY}` : ''}`,
        amount: SURCHARGES.text * n,
      })
    }
  })

  for (const a of ACCESSORIES) {
    if (config.accessories[a.id]) lines.push({ id: `acc-${a.id}`, label: a.name, detail: 'Dodatek', amount: ACCESSORY_PRICES[a.id] })
  }

  const priced = lines.filter((l) => l.amount != null)
  const perSet = priced.reduce((s, l) => s + l.amount, 0)
  const hasIndividual = lines.some((l) => l.amount == null)
  return {
    lines,
    perSet,
    quantity: config.quantity,
    total: perSet * config.quantity,
    hasIndividual,
    stats,
  }
}

/** Opis konfiguracji (podsumowanie, e-mail, zgłoszenie) */
export function describeConfig(config) {
  const stats = nailStats(config)
  const nail = NAILS.find((n) => n.id === config.nail)
  const color = COLORS.find((c) => c.id === config.color)
  const ec = ENGRAVE_COLORS.find((c) => c.id === config.engraveColor)
  const engrText = (b) => {
    const d = DESIGNS.find((x) => x.id === b.design)
    const parts = [b.design === 'custom' ? `własny plik${config.customFileName ? ` (${config.customFileName})` : ''}` : d.name]
    if (b.text?.trim()) {
      const f = FONTS.find((x) => x.id === b.font)
      const p = TEXT_POSITIONS.find((x) => x.id === b.textPos)
      parts.push(`napis „${b.text.trim()}” (${f.name.toLowerCase()}, ${p.name.toLowerCase()})`)
    }
    return parts.join(' + ')
  }
  const rows = [
    ['Poziom', `${stats.level.name} – rozstaw ${stats.spacing} mm (układ heksagonalny)`],
    ['Gwoździe', `${nail.name}, ${stats.perBoard} na deskę, ${stats.total} w komplecie`],
    ['Wymiary deski', `${cm(config.length)} × ${cm(config.width)} cm${isStandardSize(config) ? ' (standard)' : ' (niestandardowy)'}`],
    ['Okleina', `${color.name}${color.standard ? '' : ' (na zamówienie)'}`],
    ['Kolor graweru', ec.name],
  ]
  if (config.sameEngraving) rows.push(['Grawer (obie deski)', engrText(config.boards[0])])
  else {
    rows.push(['Grawer – lewa deska', engrText(config.boards[0])])
    rows.push(['Grawer – prawa deska', engrText(config.boards[1])])
  }
  const acc = ACCESSORIES.filter((a) => config.accessories[a.id]).map((a) => a.name)
  rows.push(['Dodatki', acc.length ? acc.join(', ') : 'brak'])
  rows.push(['Ilość kompletów', String(config.quantity)])

  const q = buildQuote(config)
  const priceLines = q.lines.map((l) => `• ${l.label}: ${money(l.amount)}`)
  const text = [
    'KONFIGURACJA DESEK SADHU',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'CENNIK',
    ...priceLines,
    `Razem za komplet: ${money(q.perSet)}${q.hasIndividual ? ' + pozycje do wyceny' : ''}`,
    `Razem (${q.quantity} szt.): ${money(q.total)}${q.hasIndividual ? ' + pozycje do wyceny' : ''}`,
  ].join('\n')
  return { rows, text, quote: q }
}

export const levelOf = (config) => LEVELS.find((l) => l.id === config.level)
