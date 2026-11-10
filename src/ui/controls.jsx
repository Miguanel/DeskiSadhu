import Icon from './icons'

/** Nagłówek sekcji konfiguratora */
export function Section({ index, title, aside, children }) {
  return (
    <section className="border-t border-deep-700/70 px-5 py-5 sm:px-6">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="flex items-baseline gap-2.5 font-serif text-[1.2rem] font-medium text-gold-200">
          <span className="font-serif text-sm text-gold-500 tabular-nums">{String(index).padStart(2, '0')}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Duża karta wyboru (poziom, materiał) */
export function OptionCard({ selected, onClick, title, subtitle, icon, compact = false, aside }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'group relative flex w-full items-start gap-3 rounded-xl border text-left transition-all duration-200',
        compact ? 'p-3' : 'p-3.5',
        selected
          ? 'border-gold-400/90 bg-gold-400/[0.09] shadow-[0_0_0_1px_rgb(226_184_102/0.35)_inset]'
          : 'border-deep-600/80 bg-deep-800/50 hover:border-gold-600/70 hover:bg-deep-800',
      ].join(' ')}
    >
      {icon && (
        <span
          className={[
            'mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg transition-colors',
            selected ? 'bg-gold-gradient text-deep-900' : 'bg-deep-700/80 text-gold-300',
          ].join(' ')}
        >
          <Icon name={icon} size={19} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2 font-medium leading-tight text-gold-100">
          {title}
          {aside}
        </span>
        {subtitle && <span className="mt-1 block text-[0.83rem] leading-snug text-gold-100/60">{subtitle}</span>}
      </span>
      <span
        className={[
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-all',
          selected ? 'border-gold-400 bg-gold-400 text-deep-900' : 'border-deep-500 text-transparent',
        ].join(' ')}
      >
        <Icon name="check" size={13} />
      </span>
    </button>
  )
}

/** Przełącznik segmentowy */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-deep-950/60 p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={[
              'rounded-lg px-2 py-2 text-center transition-all duration-200',
              active ? 'bg-gold-gradient text-deep-900 shadow' : 'text-gold-100/70 hover:bg-deep-800 hover:text-gold-100',
            ].join(' ')}
          >
            <span className="block text-sm font-bold leading-none">{o.label}</span>
            {o.sub && <span className={`mt-1 block text-[0.72rem] leading-none ${active ? 'text-deep-800' : 'text-gold-100/50'}`}>{o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Suwak z wartością i znacznikami wartości standardowych */
export function RangeField({ id, label, value, min, max, step, onChange, format, marks = [], markTitle = 'Wartość standardowa' }) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-1 flex items-end justify-between">
        <label htmlFor={id} className="text-sm text-gold-100/70">
          {label}
        </label>
        <output htmlFor={id} className="font-serif text-2xl font-semibold leading-none text-gold-200 tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range-gold"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="relative mt-1 h-5 text-[0.72rem] text-gold-100/45">
        <span className="absolute left-0">{format(min)}</span>
        <span className="absolute right-0">{format(max)}</span>
        {marks.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`absolute -translate-x-1/2 rounded px-1 transition-colors ${value === m ? 'text-gold-300' : 'text-gold-400/70 hover:text-gold-200'}`}
            style={{ left: `${((m - min) / (max - min)) * 100}%` }}
            title={markTitle}
          >
            ▲ {format(m)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Wiersz z przełącznikiem (dodatki) */
export function ToggleRow({ checked, onChange, title, description, badge, aside }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-deep-800/70">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-medium text-gold-100">
          {title}
          {badge}
        </span>
        <span className="mt-0.5 block text-[0.82rem] leading-snug text-gold-100/55">{description}</span>
      </span>
      {aside}
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        aria-hidden
        className="relative h-6 w-11 shrink-0 rounded-full bg-deep-700 transition-colors duration-200 peer-checked:bg-gold-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-400 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-gold-100 after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
      />
    </label>
  )
}

/** Próbnik koloru */
export function Swatch({ selected, onClick, swatch, name, small = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={name}
      title={name}
      className="group flex flex-col items-center gap-1.5"
    >
      <span
        className={[
          `block ${small ? 'size-9' : 'size-12'} rounded-full border-2 transition-all duration-200`,
          selected ? 'scale-105 border-gold-300 ring-2 ring-gold-400/40 ring-offset-2 ring-offset-deep-900' : 'border-deep-500 group-hover:border-gold-600',
        ].join(' ')}
        style={{ background: swatch }}
      />
    </button>
  )
}
