import { useEffect, useRef, useState } from 'react'
import { useConfigurator } from '../store/useConfigurator'
import { DESIGNS, ENGRAVE_COLORS, FONTS, TEXT_MAX, TEXT_POSITIONS } from '../config/catalog'
import { SURCHARGES } from '../config/pricing'
import { drawDesign } from '../lib/engraving'
import { money } from '../lib/quote'
import { RangeField, Segmented, Swatch, ToggleRow } from './controls'
import Icon from './icons'
import { revealSide } from './reveal'

const MAX_FILE_MB = 4

/**
 * Edytor graweru: wzór z katalogu lub własny plik, kolor, rozmiar i położenie, napis.
 * Grawer może być wspólny dla obu desek albo inny na każdej.
 */
export default function EngravingEditor() {
  const config = useConfigurator((s) => s.config)
  const activeBoard = useConfigurator((s) => s.view.activeBoard)
  const a = useConfigurator.getState()
  const i = config.sameEngraving ? 0 : activeBoard
  const board = config.boards[i]
  const ec = ENGRAVE_COLORS.find((c) => c.id === config.engraveColor)

  const patch = (p) => {
    a.patchBoard(p)
    revealSide('engraving')
  }

  return (
    <div>
      <div className="-mx-3 mb-3">
        <ToggleRow
          checked={config.sameEngraving}
          onChange={() => {
            a.setSameEngraving(!config.sameEngraving)
            revealSide('engraving')
          }}
          title="Ten sam grawer na obu deskach"
          description="Wyłącz, by każda deska miała inny wzór lub napis (np. dwa imiona)."
        />
      </div>

      {!config.sameEngraving && (
        <div className="mb-4">
          <Segmented
            label="Edytowana deska"
            value={activeBoard}
            onChange={(v) => {
              a.setView({ activeBoard: v })
              revealSide('engraving')
            }}
            options={[
              { value: 0, label: 'Lewa deska', sub: DESIGNS.find((d) => d.id === config.boards[0].design).name },
              { value: 1, label: 'Prawa deska', sub: DESIGNS.find((d) => d.id === config.boards[1].design).name },
            ]}
          />
        </div>
      )}

      <h3 className="mb-2 text-[0.72rem] font-medium tracking-[0.18em] text-gold-500/90 uppercase">Wzór</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-4">
        {DESIGNS.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={board.design === d.id}
            title={d.name}
            onClick={() => patch({ design: d.id })}
            className={[
              'group flex flex-col items-center gap-1 rounded-xl border p-1.5 pb-2 transition-all',
              board.design === d.id ? 'border-gold-400/90 bg-gold-400/[0.09]' : 'border-deep-600/70 bg-deep-950/40 hover:border-gold-600/70',
            ].join(' ')}
          >
            <DesignThumb id={d.id} selected={board.design === d.id} />
            <span className="line-clamp-2 text-center text-[0.7rem] leading-tight text-gold-100/75">{d.name}</span>
          </button>
        ))}
      </div>

      {board.design === 'custom' && <CustomFile />}

      <div className="mt-5 mb-2 flex items-baseline justify-between">
        <span className="text-sm text-gold-100/70">Kolor graweru</span>
        <span className="text-sm text-gold-300">{ec.name}</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {ENGRAVE_COLORS.map((c) => (
          <Swatch
            key={c.id}
            selected={config.engraveColor === c.id}
            onClick={() => {
              a.setEngraveColor(c.id)
              revealSide('engraving')
            }}
            swatch={c.swatch}
            name={c.name}
            small
          />
        ))}
      </div>

      {board.design !== 'none' && (
        <div className="mt-4 grid gap-2">
          <RangeField
            id="scale"
            label="Wielkość wzoru"
            value={Math.round(config.scale * 100)}
            min={40}
            max={95}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => {
              a.setScale(v / 100)
              revealSide('engraving')
            }}
          />
          <RangeField
            id="offset"
            label="Położenie (góra – dół)"
            value={Math.round(config.offset * 100)}
            min={-30}
            max={30}
            step={1}
            marks={[0]}
            markTitle="Na środku"
            format={(v) => (v === 0 ? 'środek' : v < 0 ? `wyżej ${-v}` : `niżej ${v}`)}
            onChange={(v) => {
              a.setOffset(v / 100)
              revealSide('engraving')
            }}
          />
        </div>
      )}

      <h3 className="mt-5 mb-2 flex items-baseline justify-between text-[0.72rem] font-medium tracking-[0.18em] text-gold-500/90 uppercase">
        Napis
        <span className="tracking-normal normal-case text-gold-100/45">+{money(SURCHARGES.text)} / deska</span>
      </h3>
      <label className="block">
        <span className="sr-only">Treść napisu</span>
        <div className="relative">
          <input
            type="text"
            value={board.text}
            maxLength={TEXT_MAX}
            placeholder="np. imię, intencja, dedykacja"
            onChange={(e) => patch({ text: e.target.value })}
            className="w-full rounded-lg border border-deep-600 bg-deep-950/60 px-3 py-2.5 pr-14 text-gold-100 placeholder:text-gold-100/30 focus:border-gold-500 focus:outline-none"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.75rem] text-gold-100/40 tabular-nums">
            {board.text.length}/{TEXT_MAX}
          </span>
        </div>
      </label>
      {board.text.trim() && (
        <div className="mt-3 grid gap-2.5">
          <div role="radiogroup" aria-label="Krój pisma" className="grid grid-cols-4 gap-1 rounded-xl bg-deep-950/60 p-1">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={board.font === f.id}
                onClick={() => patch({ font: f.id })}
                className={[
                  'rounded-lg px-1 py-1.5 text-center transition-all',
                  board.font === f.id ? 'bg-gold-gradient text-deep-900 shadow' : 'text-gold-100/75 hover:bg-deep-800',
                ].join(' ')}
              >
                <span className="block truncate text-[1.05rem] leading-tight" style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}>
                  Aa
                </span>
                <span className={`block text-[0.68rem] leading-none ${board.font === f.id ? 'text-deep-800' : 'text-gold-100/50'}`}>{f.name}</span>
              </button>
            ))}
          </div>
          {board.design !== 'none' && (
            <Segmented
              label="Położenie napisu"
              value={board.textPos}
              onChange={(v) => patch({ textPos: v })}
              options={TEXT_POSITIONS.map((p) => ({ value: p.id, label: p.name }))}
            />
          )}
        </div>
      )}
    </div>
  )
}

/** Miniatura wzoru rysowana tą samą funkcją co grawer na desce */
function DesignThumb({ id, selected }) {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    const s = c.width
    ctx.clearRect(0, 0, s, s)
    drawDesign(ctx, id, s / 2, s / 2, s * 0.44, selected ? '#f6e2a8' : '#e2b866', 1.4)
  }, [id, selected])
  if (id === 'none')
    return (
      <span className="grid size-14 place-items-center rounded-lg border border-dashed border-gold-600/50 text-gold-500">
        <Icon name="close" size={20} />
      </span>
    )
  if (id === 'custom')
    return (
      <span className="grid size-14 place-items-center rounded-lg border border-dashed border-gold-600/50 text-gold-400">
        <Icon name="upload" size={22} />
      </span>
    )
  return <canvas ref={ref} width={112} height={112} className="size-14" aria-hidden />
}

/** Wgrywanie własnego pliku graweru (PNG / JPG / SVG / WEBP) */
function CustomFile() {
  const config = useConfigurator((s) => s.config)
  const hasImage = useConfigurator((s) => Boolean(s.customImage))
  const { setCustomFile, setInvertCustom } = useConfigurator.getState()
  const [error, setError] = useState('')
  const input = useRef()

  const onFile = (file) => {
    setError('')
    if (!file) return
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) {
      setError('Obsługiwane formaty: PNG, JPG, SVG, WEBP.')
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Plik jest za duży (maks. ${MAX_FILE_MB} MB).`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCustomFile(reader.result, file.name)
      revealSide('engraving')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mt-3 rounded-xl border border-gold-600/40 bg-gold-400/5 p-3.5">
      <input ref={input} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/60 px-3 py-2.5 text-sm text-gold-200 transition-colors hover:bg-deep-700"
      >
        <Icon name="upload" size={17} />
        {hasImage ? 'Zmień plik' : 'Wybierz plik z grafiką'}
      </button>
      {hasImage && config.customFileName && (
        <p className="mt-2 truncate text-[0.8rem] text-gold-100/70" title={config.customFileName}>
          Plik: {config.customFileName}
        </p>
      )}
      {!hasImage && config.customFileName && (
        <p className="mt-2 text-[0.8rem] text-gold-300">Ten link nie zawiera pliku „{config.customFileName}” – wgraj go ponownie.</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[0.8rem] text-red-200">
          {error}
        </p>
      )}
      {hasImage && (
        <div className="-mx-3 mt-1">
          <ToggleRow
            checked={config.invertCustom}
            onChange={() => setInvertCustom(!config.invertCustom)}
            title="Odwróć jasność"
            description="Gdy grawerowane ma być jasne tło zamiast rysunku."
          />
        </div>
      )}
      <p className="mt-2 text-[0.78rem] leading-snug text-gold-100/55">
        Najlepiej sprawdzi się jednokolorowe logo lub symbol (np. czarny na białym tle albo PNG z przezroczystością). Grawer z
        własnego pliku wyceniamy indywidualnie – wykonawca potwierdzi możliwość wykonania.
      </p>
    </div>
  )
}
