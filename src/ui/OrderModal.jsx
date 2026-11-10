import { useEffect, useRef, useState } from 'react'
import { useConfigurator, getShareUrl, LEAD_SOURCE } from '../store/useConfigurator'
import { describeConfig, money } from '../lib/quote'
import { takeSnapshot } from '../lib/snapshot'
import Icon from './icons'

const ENDPOINT = import.meta.env.VITE_ORDER_ENDPOINT || ''
const EMAIL = import.meta.env.VITE_ORDER_EMAIL || ''
/** Własny plik dołączamy do zgłoszenia tylko do tej wielkości (limit typowych usług formularzy) */
const MAX_ATTACH_BYTES = 1.5 * 1024 * 1024

/**
 * Kwestionariusz zamówienia – dane kontaktowe, pod którymi wykonawca skontaktuje się z klientem.
 *  • VITE_ORDER_ENDPOINT → POST JSON (np. Formspree, własne API),
 *  • w przeciwnym razie → otwiera program pocztowy (mailto:) z gotową treścią,
 *  • zawsze → window.parent.postMessage({ type: 'sadhu:order', … })
 *    – strona osadzająca iframe może przechwycić zamówienie (np. do GA / CRM).
 */
export default function OrderModal({ open, onClose }) {
  const config = useConfigurator((s) => s.config)
  const customImage = useConfigurator((s) => s.customImage)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [invoice, setInvoice] = useState(false)
  const dialog = useRef()

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      setStatus('idle')
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open])

  const { rows, text, quote } = describeConfig(config)

  const submit = async (e) => {
    e.preventDefault()
    const contact = Object.fromEntries(new FormData(e.currentTarget).entries())
    const shareUrl = getShareUrl(config)
    const attach = customImage && customImage.length * 0.75 <= MAX_ATTACH_BYTES
    const payload = {
      // pola na najwyższym poziomie – Formspree używa `email` jako adresu "Odpowiedz do"
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      _subject: `Zamówienie – deski Sadhu (${money(quote.total)}${quote.hasIndividual ? ' + wycena' : ''})`,
      contact,
      configuration: config,
      summary: Object.fromEntries(rows),
      priceLines: quote.lines.map((l) => ({ label: l.label, detail: l.detail, amount: l.amount })),
      totals: { perSet: quote.perSet, quantity: quote.quantity, total: quote.total, individualQuote: quote.hasIndividual },
      summaryText: text,
      shareUrl,
      customFile: config.customFileName ? { name: config.customFileName, dataUrl: attach ? customImage : null } : null,
      source: LEAD_SOURCE,
      createdAt: new Date().toISOString(),
    }

    try {
      window.parent?.postMessage({ type: 'sadhu:order', payload: { ...payload, preview: takeSnapshot('image/jpeg', 0.7) } }, '*')
    } catch {
      /* brak rodzica – ignorujemy */
    }

    if (ENDPOINT) {
      setStatus('sending')
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(String(res.status))
        setStatus('sent')
      } catch {
        setStatus('error')
      }
      return
    }

    // Fallback: wiadomość e-mail
    const label = (k) => ({ name: 'Imię i nazwisko', email: 'E-mail', phone: 'Telefon', contactPref: 'Preferowany kontakt', contactTime: 'Godziny kontaktu', city: 'Miejscowość / kod', delivery: 'Dostawa', deadline: 'Termin', experience: 'Doświadczenie', nip: 'NIP do faktury', message: 'Uwagi' })[k]
    const body = [
      ...Object.entries(contact)
        .filter(([k, v]) => label(k) && v)
        .map(([k, v]) => `${label(k)}: ${v}`),
      '',
      text,
      '',
      config.customFileName ? `Własny plik graweru: ${config.customFileName} (prześlę w odpowiedzi na tę wiadomość)` : null,
      `Podgląd konfiguracji: ${shareUrl}`,
      LEAD_SOURCE ? `Źródło: ${LEAD_SOURCE}` : null,
    ]
      .filter((l) => l !== null)
      .join('\n')
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Zamówienie – deski Sadhu')}&body=${encodeURIComponent(body)}`
    setStatus('sent')
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-auto max-h-[calc(100dvh-24px)] w-[min(680px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-deep-600 bg-transparent p-0 text-gold-100 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="panel-bg flex max-h-[calc(100dvh-24px)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-deep-700 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-serif text-2xl text-gold-gradient">Zamówienie</h2>
            <p className="mt-0.5 text-sm text-gold-100/60">
              Zostaw dane kontaktowe – wykonawca potwierdzi szczegóły, termin i płatność. Konfiguracja i cennik zostaną dołączone.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zamknij" className="grid size-9 shrink-0 place-items-center rounded-lg text-gold-200 hover:bg-deep-700">
            <Icon name="close" />
          </button>
        </div>

        {status === 'sent' ? (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold-gradient text-deep-900">
              <Icon name="check" size={28} />
            </span>
            <h3 className="mt-4 font-serif text-2xl text-gold-200">Dziękujemy!</h3>
            <p className="mx-auto mt-2 max-w-sm text-gold-100/70">
              {ENDPOINT
                ? 'Zamówienie dotarło do nas. Skontaktujemy się wkrótce, aby potwierdzić szczegóły.'
                : 'Otworzyliśmy Twój program pocztowy z gotową wiadomością – wystarczy ją wysłać.'}
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl border border-gold-500/60 px-5 py-2.5 text-gold-200 hover:bg-deep-700">
              Wróć do konfiguratora
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="scrollbar-thin grid gap-4 overflow-y-auto px-5 py-5 sm:px-6">
            <details className="rounded-xl border border-deep-600/70 bg-deep-950/40 px-4 py-3 text-sm">
              <summary className="flex cursor-pointer items-baseline justify-between gap-3 text-gold-300 select-none">
                <span>Twoja konfiguracja</span>
                <span className="font-serif text-lg text-gold-200 tabular-nums">
                  {quote.hasIndividual && <span className="mr-1 text-sm text-gold-100/60">od</span>}
                  {money(quote.total)}
                </span>
              </summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {rows.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-gold-100/55">{k}</dt>
                    <dd className="text-gold-100">{v}</dd>
                  </div>
                ))}
              </dl>
            </details>

            <Fieldset title="Dane kontaktowe">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Imię i nazwisko" name="name" autoComplete="name" required />
                <Field label="Telefon" name="phone" type="tel" autoComplete="tel" required />
                <Field label="E-mail" name="email" type="email" autoComplete="email" required className="sm:col-span-2" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Choice
                  label="Preferowany kontakt"
                  name="contactPref"
                  options={['Telefon', 'E-mail', 'SMS / WhatsApp']}
                />
                <Select label="Najlepsza pora kontaktu" name="contactTime" options={['Dowolna', '8:00–12:00', '12:00–16:00', '16:00–20:00']} />
              </div>
            </Fieldset>

            <Fieldset title="Dostawa i termin">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Miejscowość i kod pocztowy" name="city" autoComplete="address-level2" placeholder="np. 40-001 Katowice" />
                <Select label="Sposób dostawy" name="delivery" options={['Kurier', 'Paczkomat', 'Odbiór osobisty', 'Do ustalenia']} />
                <Field label="Na kiedy potrzebujesz desek?" name="deadline" placeholder="np. przed świętami" />
                <Select
                  label="Doświadczenie z deskami Sadhu"
                  name="experience"
                  options={['Pierwszy raz', 'Praktykuję okazjonalnie', 'Praktykuję regularnie', 'Zamawiam na prezent']}
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-gold-100/75">
                <input type="checkbox" checked={invoice} onChange={(e) => setInvoice(e.target.checked)} className="size-4 accent-gold-500" />
                Potrzebuję faktury VAT
              </label>
              {invoice && <Field label="NIP" name="nip" required inputMode="numeric" placeholder="np. 1234567890" />}
            </Fieldset>

            <Field label="Uwagi do zamówienia" name="message" textarea placeholder="Pytania, szczegóły graweru, preferowany kolor spoza palety…" />

            <label className="flex items-start gap-2.5 text-[0.8rem] leading-snug text-gold-100/60">
              <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-gold-500" />
              Wyrażam zgodę na przetwarzanie moich danych w celu realizacji zamówienia i kontaktu w jego sprawie.
            </label>

            {status === 'error' && (
              <p role="alert" className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-100">
                Nie udało się wysłać zamówienia. Spróbuj ponownie za chwilę.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3.5 font-serif text-lg font-semibold text-deep-900 transition-opacity disabled:opacity-60"
            >
              {status === 'sending' ? 'Wysyłanie…' : 'Wyślij zamówienie'}
              <Icon name="send" size={18} />
            </button>
            <p className="-mt-2 text-center text-[0.75rem] text-gold-100/45">Wysłanie nie zobowiązuje do zapłaty – płatność po potwierdzeniu przez wykonawcę.</p>
          </form>
        )}
      </div>
    </dialog>
  )
}

function Fieldset({ title, children }) {
  return (
    <fieldset className="grid gap-4 rounded-xl border border-deep-700/80 px-4 pt-2 pb-4">
      <legend className="px-1.5 text-[0.72rem] font-medium tracking-[0.18em] text-gold-500/90 uppercase">{title}</legend>
      {children}
    </fieldset>
  )
}

const inputCls =
  'mt-1 w-full rounded-lg border border-deep-600 bg-deep-950/60 px-3 py-2.5 text-gold-100 placeholder:text-gold-100/30 transition-colors focus:border-gold-500 focus:outline-none'

function Field({ label, name, textarea, className = '', ...props }) {
  return (
    <label className={`block text-sm text-gold-100/70 ${className}`}>
      {label}
      {props.required && <span className="text-gold-400"> *</span>}
      {textarea ? <textarea name={name} rows={3} className={inputCls} {...props} /> : <input name={name} className={inputCls} {...props} />}
    </label>
  )
}

function Select({ label, name, options }) {
  return (
    <label className="block text-sm text-gold-100/70">
      {label}
      <select name={name} defaultValue={options[0]} className={`${inputCls} appearance-none`}>
        {options.map((o) => (
          <option key={o} value={o} className="bg-deep-900">
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

function Choice({ label, name, options }) {
  return (
    <div className="text-sm text-gold-100/70">
      {label}
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o, i) => (
          <label key={o} className="cursor-pointer">
            <input type="radio" name={name} value={o} defaultChecked={i === 0} className="peer sr-only" />
            <span className="block rounded-lg border border-deep-600 px-3 py-2 text-gold-100/80 transition-colors peer-checked:border-gold-400 peer-checked:bg-gold-400/10 peer-checked:text-gold-100 peer-focus-visible:outline-2 peer-focus-visible:outline-gold-400">
              {o}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
