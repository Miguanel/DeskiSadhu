import { useConfigurator } from '../store/useConfigurator'

/** Obraca podgląd na stronę deski, której dotyczy zmiana (gwoździe lub grawer) */
export function revealSide(side) {
  const st = useConfigurator.getState()
  const pose = st.view.pose
  if (side === 'nails' && (pose === 'engraving' || pose === 'stacked')) st.setPose('nails')
  if (side === 'engraving' && (pose === 'nails' || pose === 'stacked')) st.setPose('engraving')
}
