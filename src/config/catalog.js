/**
 * KATALOG OPCJI KONFIGURATORA DESEK SADHU
 * ---------------------------------------------------------------
 * Jedno źródło prawdy dla wszystkich wyborów w UI, w scenie 3D i w cenniku.
 * Nowa opcja (kolor, wzór, akcesorium…) = nowy obiekt w odpowiedniej tablicy.
 * Ceny są w osobnym pliku: src/config/pricing.js
 *
 * Jednostki: milimetry (wymiary deski i gwoździ podajemy w mm, scena 3D przelicza je na cm).
 */

/** Poziomy praktyki = rozstaw gwoździ (odległość między sąsiednimi gwoździami w układzie heksagonalnym) */
export const LEVELS = [
  {
    id: 'start',
    spacing: 8,
    name: 'Początkujący',
    label: '8 mm',
    tagline: 'Gęsto rozstawione gwoździe – nacisk rozkłada się na więcej punktów. Łagodne wejście w praktykę.',
    intensity: 1,
  },
  {
    id: 'pro',
    spacing: 10,
    name: 'PRO',
    label: '10 mm',
    tagline: 'Klasyczny rozstaw dla osób praktykujących regularnie. Wyraźne, głębokie doznania.',
    intensity: 2,
  },
  {
    id: 'gore',
    spacing: 12,
    name: 'GORE',
    label: '12 mm',
    tagline: 'Najrzadszy rozstaw i największy nacisk na każdy gwóźdź. Dla doświadczonych praktyków.',
    intensity: 3,
  },
]
export const DEFAULT_LEVEL = 'pro'

/** Materiał gwoździ (wg strony produktu: miedź lub stal ocynkowana) */
export const NAILS = [
  {
    id: 'copper',
    name: 'Miedź',
    description: 'Antybakteryjna, nie rdzewieje. Ciepły, miedziany połysk.',
    color: '#c97a4a',
    metalness: 1,
    roughness: 0.3,
    swatch: 'radial-gradient(circle at 35% 30%, #f4c49b 0%, #c97a4a 45%, #7a3a1c 100%)',
  },
  {
    id: 'steel',
    name: 'Stal ocynkowana',
    description: 'Odporna na korozję i niezwykle trwała. Chłodny, srebrny kolor.',
    color: '#b9bfc6',
    metalness: 1,
    roughness: 0.34,
    swatch: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #b9bfc6 45%, #5d646b 100%)',
  },
]

/**
 * Geometria gwoździ i deski (mm). Wartości orientacyjne do podglądu 3D –
 * do potwierdzenia z wykonawcą, zmiana tutaj przelicza model i liczbę gwoździ.
 */
export const GEOMETRY = {
  nailDiameter: 2.2, // średnica trzpienia
  nailHeight: 22, // wysokość ponad powierzchnią deski
  boardThickness: 16, // grubość sklejki
  cornerRadius: 12, // zaokrąglenie narożników
  margin: 10, // minimalna odległość osi gwoździa od krawędzi
  gap: 40, // odstęp między deskami w podglądzie
}

/** Wymiary pojedynczej deski (komplet = 2 osobne deski) */
export const SIZE = {
  standard: { length: 290, width: 140 }, // 29 × 14 cm – wg oferty
  length: { min: 240, max: 400, step: 10 },
  width: { min: 120, max: 200, step: 10 },
}

/**
 * Kolor okleiny zewnętrznej (strona z grawerem).
 * `standard: true` – kolor z oferty; pozostałe „na zamówienie” (dopłata w pricing.js).
 */
export const COLORS = [
  { id: 'kasztan', name: 'Kasztan', standard: true, base: '#9a5b38', grain: '#6f3c22' },
  { id: 'dab', name: 'Dąb naturalny', base: '#c9a06a', grain: '#a17846' },
  { id: 'orzech', name: 'Orzech', base: '#6e4a32', grain: '#4a2f1f' },
  { id: 'mahon', name: 'Mahoń', base: '#7c3424', grain: '#55200f' },
  { id: 'wenge', name: 'Wenge', base: '#3b2a22', grain: '#211611' },
  { id: 'bielony', name: 'Bielony', base: '#e6dccb', grain: '#c9bba3' },
  { id: 'czarny', name: 'Czarny', base: '#1f1c1b', grain: '#0d0b0b' },
  { id: 'granat', name: 'Granat', base: '#1d2a4a', grain: '#111a33' },
  { id: 'bordo', name: 'Bordo', base: '#5a1424', grain: '#3a0a15' },
  { id: 'zielen', name: 'Butelkowa zieleń', base: '#1f3d33', grain: '#12271f' },
].map((c) => ({ ...c, swatch: `linear-gradient(135deg, ${c.base} 0%, ${c.base} 55%, ${c.grain} 100%)` }))
export const DEFAULT_COLOR = 'kasztan'

/** Strona wewnętrzna – sklejka (nie jest wybierana, służy do podglądu 3D) */
export const PLYWOOD = { base: '#e3c992', grain: '#c8a66a', edge: '#d6b77f' }

/**
 * Wzory graweru. Rysunki są generowane proceduralnie w src/lib/engraving.js
 * (klucz `id` = nazwa funkcji w DESIGN_DRAW). 'custom' = plik klienta, 'none' = bez wzoru.
 */
export const DESIGNS = [
  { id: 'metatron', name: 'Kostka Metatrona' },
  { id: 'flower', name: 'Kwiat Życia' },
  { id: 'seed', name: 'Nasienie Życia' },
  { id: 'sriyantra', name: 'Sri Jantra' },
  { id: 'merkaba', name: 'Merkaba' },
  { id: 'tree', name: 'Drzewo Życia' },
  { id: 'lotus', name: 'Lotos' },
  { id: 'sun', name: 'Słońce' },
  { id: 'yinyang', name: 'Yin i Yang' },
  { id: 'none', name: 'Bez wzoru' },
  { id: 'custom', name: 'Własny plik' },
]
export const DEFAULT_DESIGN = 'metatron'

/** Kolor graweru / nadruku */
export const ENGRAVE_COLORS = [
  { id: 'white', name: 'Biały', color: '#f6f1e7', swatch: '#f6f1e7' },
  { id: 'gold', name: 'Złoty', color: '#e2b866', swatch: 'linear-gradient(180deg,#f6e2a8,#c3913f)' },
  { id: 'copper', name: 'Miedziany', color: '#d08a5c', swatch: 'linear-gradient(180deg,#f0b48a,#a85a2c)' },
  { id: 'burn', name: 'Wypalany', color: '#2a170e', swatch: '#2a170e' },
]

/** Kroje pisma napisu (ładowane w index.html z Google Fonts) */
export const FONTS = [
  { id: 'alegreya', name: 'Klasyczny', family: 'Alegreya', weight: 500 },
  { id: 'cinzel', name: 'Kapitaliki', family: 'Cinzel', weight: 500 },
  { id: 'script', name: 'Odręczny', family: 'Great Vibes', weight: 400 },
  { id: 'sans', name: 'Prosty', family: 'Alegreya Sans', weight: 500 },
]

/** Położenie napisu względem wzoru */
export const TEXT_POSITIONS = [
  { id: 'below', name: 'Pod wzorem' },
  { id: 'above', name: 'Nad wzorem' },
  { id: 'center', name: 'Na środku' },
]
export const TEXT_MAX = 28

/** Dodatki do kompletu (ceny w pricing.js) */
export const ACCESSORIES = [
  {
    id: 'spray',
    name: 'Spray dezynfekujący',
    description: 'Do comiesięcznej dezynfekcji gwoździ – zgodnie z instrukcją pielęgnacji.',
  },
  {
    id: 'brush',
    name: 'Szczotka do czyszczenia',
    description: 'Długi, średnio twardy włos – do strony z gwoździami.',
  },
  {
    id: 'case',
    name: 'Pokrowiec na komplet',
    description: 'Bezpieczne przechowywanie złożonych desek, poza zasięgiem dzieci i zwierząt.',
  },
  {
    id: 'mat',
    name: 'Mata do praktyki',
    description: 'Antypoślizgowa podkładka pod deski i miejsce do medytacji po praktyce.',
  },
]
export const ACCESSORY_IDS = ACCESSORIES.map((a) => a.id)

export const QUANTITY = { min: 1, max: 20 }

/** Waga referencyjna do szacunku nacisku na gwóźdź w podsumowaniu */
export const REFERENCE_WEIGHT_KG = 70
/** Przybliżona powierzchnia kontaktu obu stóp z deskami (cm²) */
export const FEET_CONTACT_CM2 = 240
