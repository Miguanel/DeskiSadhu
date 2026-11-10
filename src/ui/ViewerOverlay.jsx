import { useEffect, useState } from 'react'
import { useConfigurator, getShareUrl } from '../store/useConfigurator'
import { NAILS } from '../config/catalog'
import { nailStats } from '../lib/nails'
import { cm } from '../lib/quote'
import Icon from './icons'
import { HistoryControls, UndoToast } from './ResetControl'

const POSES = [
  { id: 'showcase', icon: 'stand', label: 'Prezentacja' },
  { id: 'nails', icon: 'nails', label: 'Gwoździe' },
  { id: 'engraving', icon: 'flip', label: 'Grawer' },
  { id: 'stacked', icon: 'stack', label: 'Złożone' },
]

/** Nakładki na podgląd 3D: widoki kompletu, narzędzia, wymiary, podpowiedź gestów. */
export default function ViewerOverlay() {
  const view = useConfigurator((s) => s.view)
  const config = useConfigurator((s) => s.config)
  const { setView, setPose, resetCamera } = useConfigurator.getState()
  const stats = nailStats(config)
  const nail = NAILS.find((n) => n.id === config.nail)
  const [hint, setHint] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 6000)
    return () => clearTimeout(t)
  }, [])

  const share = async () => {
    const url = getShareUrl(config)
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'Moje deski Sadhu', url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      /* anulowano / brak uprawnień do schowka (np. iframe bez allow="clipboard-write") */
    }
  }

  const tools = [
    {
      id: 'feet',
      icon: 'foot',
      label: 'Stopy dla skali',
      active: view.showFeet && view.pose === 'nails',
      onClick: () => {
        const on = !(view.showFeet && view.pose === 'nails')
        setView({ showFeet: on })
        if (on) setPose('nails')
      },
    },
    { id: 'rotate', icon: 'rotate', label: 'Automatyczny obrót', active: view.autoRotate, onClick: () => setView({ autoRotate: !view.autoRotate }) },
    { id: 'reset', icon: 'target', label: 'Wyśrodkuj widok', onClick: resetCamera },
    { id: 'share', icon: copied ? 'check' : 'share', label: copied ? 'Skopiowano link' : 'Udostępnij konfigurację', onClick: share },
  ]

  return (
    <div className="pointer-events-none absolute inset-0" onPointerDown={() => setHint(false)}>
      {/* marka + cofnij/ponów */}
      <div className="absolute top-3 left-3 flex flex-col items-start gap-2 sm:top-4 sm:left-4">
        <div className="hidden items-center gap-2 rounded-full bg-deep-900/75 p-1.5 pr-3.5 shadow-lg backdrop-blur-md lg:flex">
          <img src="./favicon.svg" alt="" className="size-7 rounded-full" />
          <span className="font-serif text-[0.95rem] text-gold-200">Deski Sadhu</span>
          <span className="text-xs text-gold-100/50">· podgląd 3D</span>
        </div>
        <HistoryControls className="pointer-events-auto" />
      {/* wymiary i gwoździe */}
        <div className="hidden items-center gap-3 rounded-xl bg-deep-900/75 px-3.5 py-2 text-gold-100 shadow-lg backdrop-blur-md md:flex">
          <Metric label="Deska" value={`${cm(config.length)} × ${cm(config.width)} cm`} />
          <span className="h-6 w-px bg-deep-600" />
          <Metric label="Rozstaw" value={`${stats.spacing} mm`} />
          <span className="hidden h-6 w-px bg-deep-600 xl:block" />
          <span className="hidden xl:flex">
            <Metric label={nail.name} value={`2 × ${stats.perBoard}`} />
          </span>
        </div>
      </div>

      {/* narzędzia widoku */}
      <div
        role="toolbar"
        aria-label="Narzędzia podglądu"
        className="pointer-events-auto absolute top-3 right-3 flex flex-row gap-0.5 rounded-2xl bg-deep-900/75 p-1 shadow-lg backdrop-blur-md sm:top-4 sm:right-4 sm:flex-col sm:gap-1"
      >
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={t.onClick}
            aria-pressed={t.active}
            aria-label={t.label}
            title={t.label}
            className={[
              'group relative grid size-9 place-items-center rounded-xl transition-colors sm:size-10',
              t.active ? 'bg-gold-gradient text-deep-900' : 'text-gold-200 hover:bg-deep-700',
            ].join(' ')}
          >
            <Icon name={t.icon} size={19} />
            <span className="pointer-events-none absolute right-full mr-2 hidden rounded-md bg-deep-950/95 px-2 py-1 text-xs whitespace-nowrap text-gold-100 opacity-0 transition-opacity group-hover:opacity-100 md:block">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* widoki kompletu */}
      <div
        role="radiogroup"
        aria-label="Widok kompletu"
        className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-2xl bg-deep-900/80 p-1 shadow-lg backdrop-blur-md sm:bottom-4"
      >
        {POSES.map((p) => {
          const active = view.pose === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPose(p.id)}
              className={[
                'flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[0.82rem] transition-colors sm:px-3',
                active ? 'bg-gold-gradient text-deep-900' : 'text-gold-100/80 hover:bg-deep-700 hover:text-gold-100',
              ].join(' ')}
            >
              <Icon name={p.icon} size={17} />
              <span className="hidden min-[440px]:inline">{p.label}</span>
            </button>
          )
        })}
      </div>

      <UndoToast />

      {/* podpowiedź gestów */}
      <div
        className={`absolute top-16 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-4 py-2 text-[0.82rem] whitespace-nowrap text-white/90 backdrop-blur transition-opacity duration-700 sm:top-5 ${hint ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="hidden sm:inline">Przeciągnij, aby obrócić · kółko myszy – przybliżenie</span>
        <span className="sm:hidden">Przesuń palcem, aby obrócić</span>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-serif text-sm text-gold-500">{label}</span>
      <span className="font-serif text-base text-gold-100 tabular-nums">{value}</span>
    </span>
  )
}
