import { useConfigurator } from '../store/useConfigurator'
import { ACCESSORIES, COLORS, LEVELS, NAILS, QUANTITY, REFERENCE_WEIGHT_KG, SIZE } from '../config/catalog'
import { ACCESSORY_PRICES, SURCHARGES } from '../config/pricing'
import { nailStats } from '../lib/nails'
import { buildQuote, cm, isStandardSize, money, nf } from '../lib/quote'
import EngravingEditor from './EngravingEditor'
import PriceReport from './PriceReport'
import { ResetButton } from './ResetControl'
import { OptionCard, RangeField, Section, Segmented, Swatch, ToggleRow } from './controls'
import Icon from './icons'
import { revealSide } from './reveal'

/**
 * UI OVERLAY – panel konfiguracji (desktop: kolumna po prawej, mobile: pod podglądem 3D)
 */
export default function UIOverlay({ onOrder }) {
  const config = useConfigurator((s) => s.config)
  const a = useConfigurator.getState()
  const stats = nailStats(config)
  const quote = buildQuote(config)
  const color = COLORS.find((c) => c.id === config.color)
  const standard = isStandardSize(config)

  return (
    <div className="flex min-h-full flex-col">
      <header className="px-5 pt-6 pb-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-x-3">
          <p className="pt-1.5 text-[0.72rem] font-medium tracking-[0.22em] text-gold-500 uppercase">Misteriada · deski Sadhu</p>
          <ResetButton />
        </div>
        <h1 className="mt-1.5 font-serif text-[1.85rem] leading-[1.1] font-medium text-gold-gradient">Zaprojektuj swoje deski</h1>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-gold-100/65">
          Wybierz rozstaw i materiał gwoździ, kolor okleiny oraz grawer. Każda zmiana od razu pojawia się na modelu 3D,
          a na końcu zobaczysz cennik i złożysz zamówienie.
        </p>
      </header>

      <Section index={1} title="Poziom praktyki">
        <div className="grid gap-2">
          {LEVELS.map((l) => (
            <OptionCard
              key={l.id}
              selected={config.level === l.id}
              onClick={() => {
                a.setLevel(l.id)
                revealSide('nails')
              }}
              title={l.name}
              aside={<span className="font-serif text-[0.95rem] text-gold-300 tabular-nums">{l.label}</span>}
              subtitle={l.tagline}
              compact
            />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Na deskę', `${stats.perBoard}`],
            ['W komplecie', `${stats.total}`],
            ['Nacisk*', `~${nf(stats.gramsPerNail)} g`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-deep-950/50 px-2 py-2.5">
              <dt className="text-[0.7rem] tracking-wide text-gold-100/50 uppercase">{k}</dt>
              <dd className="mt-0.5 font-serif text-lg leading-tight text-gold-200 tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 flex gap-1.5 text-[0.78rem] leading-snug text-gold-100/45">
          <Icon name="info" size={14} className="mt-px shrink-0" />
          Gwoździe w układzie heksagonalnym – każdy ma 6 sąsiadów w odległości {stats.spacing} mm. *Szacunkowy nacisk na
          jeden gwóźdź przy {REFERENCE_WEIGHT_KG} kg, stojąc na obu deskach.
        </p>
      </Section>

      <Section index={2} title="Gwoździe" aside={<span className="text-sm text-gold-300">{NAILS.find((n) => n.id === config.nail).name}</span>}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {NAILS.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-pressed={config.nail === n.id}
              onClick={() => {
                a.setNail(n.id)
                revealSide('nails')
              }}
              className={[
                'flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                config.nail === n.id
                  ? 'border-gold-400/90 bg-gold-400/[0.09] shadow-[0_0_0_1px_rgb(226_184_102/0.35)_inset]'
                  : 'border-deep-600/80 bg-deep-800/50 hover:border-gold-600/70 hover:bg-deep-800',
              ].join(' ')}
            >
              <span className="mt-0.5 size-8 shrink-0 rounded-full border border-black/30 shadow-inner" style={{ background: n.swatch }} />
              <span className="min-w-0">
                <span className="block font-medium text-gold-100">{n.name}</span>
                <span className="mt-0.5 block text-[0.82rem] leading-snug text-gold-100/60">{n.description}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section index={3} title="Wymiary deski" aside={<span className="text-sm text-gold-300 tabular-nums">{cm(config.length)} × {cm(config.width)} cm</span>}>
        <Segmented
          label="Rozmiar"
          value={standard ? 'standard' : 'custom'}
          onChange={(v) => {
            if (v === 'standard') a.setSize(SIZE.standard.length, SIZE.standard.width)
            else a.setSize(SIZE.standard.length + 30, SIZE.standard.width + 20)
          }}
          options={[
            { value: 'standard', label: '29 × 14 cm', sub: 'standard' },
            { value: 'custom', label: 'Własny wymiar', sub: `+${money(SURCHARGES.customSize)}` },
          ]}
        />
        {!standard && (
          <div className="mt-4 grid gap-3">
            <RangeField
              id="length"
              label="Długość deski"
              value={config.length}
              min={SIZE.length.min}
              max={SIZE.length.max}
              step={SIZE.length.step}
              marks={[SIZE.standard.length]}
              markTitle="Wymiar standardowy"
              format={(v) => `${cm(v)} cm`}
              onChange={a.setLength}
            />
            <RangeField
              id="width"
              label="Szerokość deski"
              value={config.width}
              min={SIZE.width.min}
              max={SIZE.width.max}
              step={SIZE.width.step}
              marks={[SIZE.standard.width]}
              markTitle="Wymiar standardowy"
              format={(v) => `${cm(v)} cm`}
              onChange={a.setWidth}
            />
          </div>
        )}
        <p className="mt-2.5 text-[0.8rem] leading-snug text-gold-100/55">
          Komplet to dwie osobne deski – po jednej na każdą stopę. Liczba gwoździ przelicza się z wymiaru i rozstawu.
        </p>
      </Section>

      <Section
        index={4}
        title="Kolor okleiny"
        aside={
          <span className="text-right text-sm text-gold-300">
            {color.name}
            {!color.standard && <span className="ml-1.5 text-gold-100/50">· na zamówienie</span>}
          </span>
        }
      >
        <div className="flex flex-wrap gap-3">
          {COLORS.map((c) => (
            <Swatch
              key={c.id}
              selected={config.color === c.id}
              onClick={() => {
                a.setColor(c.id)
                revealSide('engraving')
              }}
              swatch={c.swatch}
              name={`${c.name}${c.standard ? '' : ' (na zamówienie)'}`}
              small
            />
          ))}
        </div>
        <p className="mt-2.5 text-[0.8rem] leading-snug text-gold-100/55">
          Kasztan to kolor standardowy. Pozostałe kolory wykonujemy na zamówienie (+{money(SURCHARGES.customColor)} za komplet).
        </p>
      </Section>

      <Section index={5} title="Grawer i napis">
        <EngravingEditor />
      </Section>

      <Section index={6} title="Dodatki">
        <div className="-mx-3">
          {ACCESSORIES.map((x) => (
            <ToggleRow
              key={x.id}
              checked={config.accessories[x.id]}
              onChange={() => a.toggleAccessory(x.id)}
              title={x.name}
              description={x.description}
              aside={<span className="shrink-0 font-serif text-[0.95rem] text-gold-300 tabular-nums">+{money(ACCESSORY_PRICES[x.id])}</span>}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-deep-950/40 px-3 py-2.5">
          <span>
            <span className="block font-medium text-gold-100">Liczba kompletów</span>
            <span className="text-[0.8rem] text-gold-100/50">np. dla pary lub na prezent</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Mniej"
              disabled={config.quantity <= QUANTITY.min}
              onClick={() => a.setQuantity(config.quantity - 1)}
              className="grid size-9 place-items-center rounded-lg border border-deep-600 text-gold-200 hover:border-gold-600 disabled:opacity-30"
            >
              <Icon name="minus" size={16} />
            </button>
            <output className="w-9 text-center font-serif text-xl text-gold-200 tabular-nums" aria-live="polite">
              {config.quantity}
            </output>
            <button
              type="button"
              aria-label="Więcej"
              disabled={config.quantity >= QUANTITY.max}
              onClick={() => a.setQuantity(config.quantity + 1)}
              className="grid size-9 place-items-center rounded-lg border border-deep-600 text-gold-200 hover:border-gold-600 disabled:opacity-30"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      </Section>

      <Section index={7} title="Cennik">
        <PriceReport quote={quote} config={config} />
      </Section>

      {/* CTA – przyklejone do dołu panelu; na telefonie w jednym wierszu, by nie zabierać miejsca */}
      <div className="sticky bottom-0 z-10 mt-auto flex items-center gap-4 border-t border-deep-700/80 bg-deep-900/95 px-5 py-3 backdrop-blur sm:px-6 lg:block lg:py-4">
        <div className="flex shrink-0 flex-col lg:mb-2.5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-3">
          <span className="text-[0.8rem] text-gold-100/60 lg:text-sm">
            Razem{config.quantity > 1 ? ` · ${config.quantity} kpl.` : ''}
          </span>
          <span className="font-serif text-xl font-semibold text-gold-200 tabular-nums lg:text-2xl">
            {quote.hasIndividual && <span className="mr-1 text-sm font-normal text-gold-100/60 lg:text-base">od</span>}
            {money(quote.total)}
          </span>
        </div>
        <button
          type="button"
          onClick={onOrder}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 font-serif text-lg font-semibold text-deep-900 shadow-[0_8px_24px_-8px_rgb(226_184_102/0.6)] transition-transform hover:-translate-y-px active:translate-y-0 lg:py-3.5"
        >
          Zamów
          <Icon name="send" size={18} />
        </button>
        <p className="mt-2 hidden text-center text-[0.75rem] text-gold-100/45 lg:block">Wykonawca skontaktuje się, by potwierdzić szczegóły i płatność</p>
      </div>
    </div>
  )
}
