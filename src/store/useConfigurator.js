import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  ACCESSORY_IDS,
  COLORS,
  DEFAULT_COLOR,
  DEFAULT_DESIGN,
  DEFAULT_LEVEL,
  DESIGNS,
  ENGRAVE_COLORS,
  FONTS,
  LEVELS,
  NAILS,
  QUANTITY,
  SIZE,
  TEXT_MAX,
  TEXT_POSITIONS,
} from '../config/catalog'

/**
 * GLOBALNY STAN KONFIGURATORA (zustand)
 * ---------------------------------------------------------------
 * `config` – to, co klient zamawia (trafia do cennika, zamówienia i linku #c=…)
 * `view`   – ustawienia podglądu (nie wpływają na zamówienie)
 * `customImage` – własny plik graweru (dataURL). Nie trafia do linku (za duży),
 *                 ale jest dołączany do zamówienia.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const snap = (v, step) => Math.round(v / step) * step
const pick = (list, id, fallback) => (list.some((x) => x.id === id) ? id : fallback)

export const defaultBoard = () => ({ design: DEFAULT_DESIGN, text: '', font: 'cinzel', textPos: 'below' })

export const DEFAULT_CONFIG = {
  level: DEFAULT_LEVEL,
  nail: 'copper',
  length: SIZE.standard.length,
  width: SIZE.standard.width,
  color: DEFAULT_COLOR,
  engraveColor: 'white',
  scale: 0.74,
  offset: 0,
  sameEngraving: true,
  boards: [defaultBoard(), { ...defaultBoard(), design: 'none' }],
  customFileName: '',
  invertCustom: false,
  accessories: Object.fromEntries(ACCESSORY_IDS.map((id) => [id, false])),
  quantity: 1,
}

function sanitizeBoard(b = {}) {
  return {
    design: pick(DESIGNS, b.design, DEFAULT_DESIGN),
    text: String(b.text ?? '').slice(0, TEXT_MAX),
    font: pick(FONTS, b.font, 'cinzel'),
    textPos: pick(TEXT_POSITIONS, b.textPos, 'below'),
  }
}

/** Walidacja – chroni przed „zepsutym” linkiem z parametrami */
export function sanitize(c = {}) {
  const d = DEFAULT_CONFIG
  return {
    level: pick(LEVELS, c.level, d.level),
    nail: pick(NAILS, c.nail, d.nail),
    length: clamp(snap(Number(c.length) || d.length, SIZE.length.step), SIZE.length.min, SIZE.length.max),
    width: clamp(snap(Number(c.width) || d.width, SIZE.width.step), SIZE.width.min, SIZE.width.max),
    color: pick(COLORS, c.color, d.color),
    engraveColor: pick(ENGRAVE_COLORS, c.engraveColor, d.engraveColor),
    scale: clamp(Number(c.scale) || d.scale, 0.4, 0.95),
    offset: clamp(Number(c.offset) || 0, -0.3, 0.3),
    sameEngraving: c.sameEngraving !== false,
    boards: [sanitizeBoard(c.boards?.[0] ?? d.boards[0]), sanitizeBoard(c.boards?.[1] ?? d.boards[1])],
    customFileName: String(c.customFileName ?? '').slice(0, 120),
    invertCustom: Boolean(c.invertCustom),
    accessories: Object.fromEntries(ACCESSORY_IDS.map((id) => [id, Boolean(c.accessories?.[id])])),
    quantity: clamp(Math.round(Number(c.quantity) || 1), QUANTITY.min, QUANTITY.max),
  }
}

// ---------- Udostępnianie konfiguracji przez link (#c=...) ----------
const HASH_KEY = 'c'

export function encodeConfig(config) {
  const b = (x) => [x.design, x.text, x.font, x.textPos]
  const compact = {
    l: config.level,
    n: config.nail,
    s: [config.length, config.width],
    c: config.color,
    e: config.engraveColor,
    g: [Math.round(config.scale * 100), Math.round(config.offset * 100)],
    same: config.sameEngraving ? 1 : 0,
    b: config.sameEngraving ? [b(config.boards[0])] : config.boards.map(b),
    f: config.customFileName || undefined,
    i: config.invertCustom ? 1 : undefined,
    a: ACCESSORY_IDS.filter((id) => config.accessories[id]),
    q: config.quantity,
  }
  return btoa(encodeURIComponent(JSON.stringify(compact)))
}

function decodeConfig(str) {
  try {
    const c = JSON.parse(decodeURIComponent(atob(str)))
    const board = (x) => (x ? { design: x[0], text: x[1], font: x[2], textPos: x[3] } : undefined)
    return sanitize({
      level: c.l,
      nail: c.n,
      length: c.s?.[0],
      width: c.s?.[1],
      color: c.c,
      engraveColor: c.e,
      scale: (c.g?.[0] ?? 74) / 100,
      offset: (c.g?.[1] ?? 0) / 100,
      sameEngraving: c.same !== 0,
      boards: [board(c.b?.[0]), board(c.b?.[1]) ?? { ...defaultBoard(), design: 'none' }],
      customFileName: c.f,
      invertCustom: c.i === 1,
      accessories: Object.fromEntries((c.a || []).map((id) => [id, true])),
      quantity: c.q,
    })
  } catch {
    return null
  }
}

function readHashParams() {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.hash.slice(1))
}

function readConfigFromUrl() {
  const params = readHashParams()
  const raw = params.get(HASH_KEY)
  if (raw) return decodeConfig(raw)
  // Link z kampanii / agenta pozyskiwania klientów: #poziom=start|pro|gore&src=<id leada>
  const level = params.get('poziom')
  return level && LEVELS.some((l) => l.id === level) ? sanitize({ ...DEFAULT_CONFIG, level }) : null
}

/**
 * Źródło wejścia (np. identyfikator leada z linku #…&src=L1a2b3c4d).
 * Zapamiętane w sessionStorage, bo hash jest potem nadpisywany przez #c=…; trafia do zamówienia.
 */
export const LEAD_SOURCE = (() => {
  try {
    const src = readHashParams().get('src')
    if (src && /^[\w-]{1,40}$/.test(src)) {
      sessionStorage.setItem('sadhu:src', src)
      return src
    }
    return sessionStorage.getItem('sadhu:src')
  } catch {
    return null
  }
})()

export function getShareUrl(config) {
  const url = new URL(window.location.href)
  url.hash = `${HASH_KEY}=${encodeConfig(config)}`
  return url.toString()
}

// ---------- Store ----------
const HISTORY_LIMIT = 80
const COALESCE_MS = 450 // ciągłe zmiany (suwak, pisanie napisu) tworzą jeden krok historii
let timeTravel = false
let lastChange = 0

export const useConfigurator = create(
  subscribeWithSelector((set, get) => {
    const patchConfig = (patch) => set((s) => ({ config: { ...s.config, ...patch } }))

    return {
      config: readConfigFromUrl() ?? sanitize(DEFAULT_CONFIG),
      customImage: null, // dataURL własnego pliku graweru

      view: {
        pose: 'showcase', // 'showcase' | 'nails' | 'engraving' | 'stacked'
        autoRotate: false,
        showFeet: false, // sylwetki stóp dla skali
        resetToken: 0,
        activeBoard: 0, // deska edytowana w sekcji graweru (0 – lewa, 1 – prawa)
      },

      // --- Historia zmian (cofnij / ponów)
      past: [],
      future: [],
      resetNotice: false,
      undo: () =>
        set((s) => {
          if (!s.past.length) return s
          timeTravel = true
          return { config: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.config, ...s.future], resetNotice: false }
        }),
      redo: () =>
        set((s) => {
          if (!s.future.length) return s
          timeTravel = true
          return { config: s.future[0], past: [...s.past, s.config], future: s.future.slice(1) }
        }),
      /** Powrót do konfiguracji standardowej (można cofnąć) */
      resetAll: () => set({ config: sanitize(DEFAULT_CONFIG), resetNotice: true }),
      dismissResetNotice: () => set({ resetNotice: false }),

      // --- Parametry kompletu
      setLevel: (level) => patchConfig({ level }),
      setNail: (nail) => patchConfig({ nail }),
      setSize: (length, width) => patchConfig({ length, width }),
      setLength: (length) => patchConfig({ length }),
      setWidth: (width) => patchConfig({ width }),
      setColor: (color) => patchConfig({ color }),
      setEngraveColor: (engraveColor) => patchConfig({ engraveColor }),
      setScale: (scale) => patchConfig({ scale }),
      setOffset: (offset) => patchConfig({ offset }),
      setQuantity: (quantity) => patchConfig({ quantity: clamp(quantity, QUANTITY.min, QUANTITY.max) }),
      toggleAccessory: (id) =>
        set((s) => ({ config: { ...s.config, accessories: { ...s.config.accessories, [id]: !s.config.accessories[id] } } })),

      // --- Grawer
      setSameEngraving: (sameEngraving) =>
        set((s) => {
          const boards = [...s.config.boards]
          // przy rozdzieleniu prawa deska startuje od kopii lewej – łatwiej zrobić „parę” z różnymi napisami
          if (!sameEngraving) boards[1] = { ...boards[0] }
          return {
            config: { ...s.config, sameEngraving, boards },
            view: { ...s.view, activeBoard: sameEngraving ? 0 : s.view.activeBoard },
          }
        }),
      /** Zmiana graweru aktywnej deski (w trybie „ten sam na obu” – zawsze deska 0) */
      patchBoard: (patch) =>
        set((s) => {
          const i = s.config.sameEngraving ? 0 : s.view.activeBoard
          const boards = s.config.boards.map((b, k) => (k === i ? { ...b, ...patch } : b))
          return { config: { ...s.config, boards } }
        }),
      setCustomFile: (customImage, customFileName) =>
        set((s) => {
          const i = s.config.sameEngraving ? 0 : s.view.activeBoard
          const boards = s.config.boards.map((b, k) => (k === i ? { ...b, design: 'custom' } : b))
          return { customImage, config: { ...s.config, customFileName, boards } }
        }),
      setInvertCustom: (invertCustom) => patchConfig({ invertCustom }),

      // --- Podgląd
      setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),
      setPose: (pose) => set((s) => ({ view: { ...s.view, pose } })),
      resetCamera: () => set((s) => ({ view: { ...s.view, resetToken: s.view.resetToken + 1 } })),
    }
  }),
)

// Zapis historii: każda zmiana konfiguracji odkłada poprzedni stan na stos "past"
useConfigurator.subscribe(
  (s) => s.config,
  (config, prev) => {
    if (timeTravel) {
      timeTravel = false
      lastChange = 0
      return
    }
    const now = Date.now()
    const coalesce = now - lastChange < COALESCE_MS
    lastChange = now
    if (coalesce) return
    useConfigurator.setState((s) => ({ past: [...s.past, prev].slice(-HISTORY_LIMIT), future: [] }))
  },
)

// Synchronizacja z adresem URL (bez zaśmiecania historii przeglądarki)
if (typeof window !== 'undefined') {
  let t
  useConfigurator.subscribe(
    (s) => s.config,
    (config) => {
      clearTimeout(t)
      t = setTimeout(() => {
        try {
          history.replaceState(null, '', `#${HASH_KEY}=${encodeConfig(config)}`)
        } catch {
          /* np. sandboxowany iframe – ignorujemy */
        }
      }, 300)
    },
  )
}
