import { useState } from 'react'
import { flushSync } from 'react-dom'
import { getShareUrl, useConfigurator } from '../store/useConfigurator'
import { PRICE_NOTE } from '../config/pricing'
import { describeConfig, money } from '../lib/quote'
import { takeSnapshot } from '../lib/snapshot'
import Icon from './icons'

/**
 * Raport cenowy – pozycje kompletu, dodatki, ilość i suma.
 * „Drukuj / PDF” drukuje osobny, jasny raport (PrintableReport) ze zrzutem podglądu 3D.
 */
export default function PriceReport({ quote, config }) {
  const [snapshot, setSnapshot] = useState(null)

  const print = () => {
    // zrzut musi trafić do DOM przed otwarciem okna drukowania
    flushSync(() => setSnapshot(takeSnapshot()))
    window.print()
  }

  return (
    <div className="rounded-xl border border-deep-600/70 bg-deep-950/40 p-4">
      <table className="w-full text-[0.88rem]">
        <caption className="sr-only">Cennik konfiguracji</caption>
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l.id} className="border-b border-deep-700/60 align-top last:border-0">
              <td className="py-2 pr-3">
                <span className="block text-gold-100">{l.label}</span>
                {l.detail && <span className="block text-[0.78rem] leading-snug text-gold-100/50">{l.detail}</span>}
              </td>
              <td className={`py-2 text-right whitespace-nowrap tabular-nums ${l.amount == null ? 'text-gold-300 italic' : l.amount === 0 ? 'text-gold-100/50' : 'text-gold-100'}`}>
                {l.amount === 0 ? 'w cenie' : money(l.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-deep-600 pt-3 text-[0.9rem]">
        <dt className="text-gold-100/60">Za komplet</dt>
        <dd className="text-right text-gold-100 tabular-nums">{money(quote.perSet)}</dd>
        <dt className="text-gold-100/60">Ilość</dt>
        <dd className="text-right text-gold-100 tabular-nums">× {quote.quantity}</dd>
        <dt className="mt-1 font-serif text-lg text-gold-200">Razem</dt>
        <dd className="mt-1 text-right font-serif text-lg font-semibold text-gold-200 tabular-nums">{money(quote.total)}</dd>
      </dl>
      {quote.hasIndividual && (
        <p className="mt-2 rounded-lg bg-gold-400/10 px-3 py-2 text-[0.8rem] leading-snug text-gold-200">
          Część pozycji wymaga indywidualnej wyceny – kwotę uzupełni wykonawca.
        </p>
      )}
      <p className="mt-3 text-[0.75rem] leading-snug text-gold-100/40">{PRICE_NOTE}</p>
      <button
        type="button"
        onClick={print}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-deep-500 px-3 py-2 text-sm text-gold-100/85 transition-colors hover:border-gold-600 hover:text-gold-100"
      >
        <Icon name="print" size={16} />
        Drukuj / zapisz raport PDF
      </button>
      <PrintableReport config={config} snapshot={snapshot} />
    </div>
  )
}

/** Wersja do druku: jasne tło, czarny tekst, dane konfiguracji, cennik i link */
function PrintableReport({ config, snapshot }) {
  const { rows, quote } = describeConfig(config)
  const date = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  const customImage = useConfigurator((s) => s.customImage)
  return (
    <div id="print-report" className="hidden font-sans text-[11pt] text-black">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #a97a2c', paddingBottom: 6 }}>
        <h1 style={{ fontFamily: 'Alegreya, Georgia, serif', fontSize: '20pt', margin: 0 }}>Deski Sadhu – raport konfiguracji</h1>
        <span style={{ color: '#555' }}>{date}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {snapshot && <img src={snapshot} alt="" style={{ width: '48%', borderRadius: 8, objectFit: 'cover' }} />}
        <table style={{ flex: 1, borderCollapse: 'collapse', fontSize: '10pt' }}>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td style={{ color: '#666', padding: '3px 8px 3px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{k}</td>
                <td style={{ padding: '3px 0' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {customImage && (
        <p style={{ marginTop: 8, fontSize: '9pt', color: '#555' }}>
          Własny plik graweru: {config.customFileName} <img src={customImage} alt="" style={{ height: 48, verticalAlign: 'middle', marginLeft: 8 }} />
        </p>
      )}
      <h2 style={{ fontFamily: 'Alegreya, Georgia, serif', fontSize: '14pt', margin: '16px 0 6px' }}>Cennik</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '4px 0' }}>
                {l.label}
                {l.detail && <div style={{ color: '#777', fontSize: '8.5pt' }}>{l.detail}</div>}
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{l.amount === 0 ? 'w cenie' : money(l.amount)}</td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: '6px 0', color: '#555' }}>Za komplet × {quote.quantity}</td>
            <td style={{ textAlign: 'right' }}>{money(quote.perSet)}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0', fontWeight: 700, fontSize: '12pt' }}>Razem</td>
            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '12pt' }}>
              {quote.hasIndividual ? 'od ' : ''}
              {money(quote.total)}
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginTop: 10, fontSize: '8.5pt', color: '#666' }}>{PRICE_NOTE}</p>
      <p style={{ marginTop: 6, fontSize: '8pt', color: '#666', wordBreak: 'break-all' }}>Podgląd konfiguracji: {typeof window !== 'undefined' ? getShareUrl(config) : ''}</p>
      <p style={{ marginTop: 6, fontSize: '8.5pt', color: '#666' }}>Misteriada · misteriada.pl</p>
    </div>
  )
}
