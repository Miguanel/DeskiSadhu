import { lazy, Suspense, useState } from 'react'
import UIOverlay from './ui/UIOverlay'
import ViewerOverlay from './ui/ViewerOverlay'
import OrderModal from './ui/OrderModal'

// Scena 3D (three.js ~600 kB) ładowana osobnym chunkiem – panel UI pojawia się od razu.
const BoardScene = lazy(() => import('./scene/BoardScene'))

/**
 * CONFIGURATOR APP – główny layout.
 *  • ≥ lg: podgląd 3D na całej wysokości + panel 420 px po prawej
 *  • < lg: podgląd u góry (~48% wysokości), panel przewijany pod spodem
 * Aplikacja zawsze wypełnia 100% swojego okna (dvh) – gotowa do osadzenia w iframe.
 */
export default function ConfiguratorApp() {
  const [orderOpen, setOrderOpen] = useState(false)

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-deep-950 lg:flex-row">
      <main className="stage-bg relative h-[48dvh] min-h-[300px] shrink-0 lg:h-full lg:min-h-0 lg:flex-1">
        <Suspense fallback={<SceneLoader />}>
          <BoardScene />
        </Suspense>
        <ViewerOverlay />
      </main>

      <aside
        aria-label="Opcje konfiguracji"
        className="panel-bg scrollbar-thin relative flex-1 overflow-y-auto overscroll-contain border-t border-gold-600/40 lg:w-[420px] lg:flex-none lg:border-t-0 lg:border-l xl:w-[440px]"
      >
        <UIOverlay onOrder={() => setOrderOpen(true)} />
      </aside>

      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} />
    </div>
  )
}

function SceneLoader() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center gap-3 text-gold-300">
        <span className="size-10 animate-spin rounded-full border-2 border-gold-500/30 border-t-gold-400" />
        <span className="font-serif text-sm">Ładowanie modelu 3D…</span>
      </div>
    </div>
  )
}
