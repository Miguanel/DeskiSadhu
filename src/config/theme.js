/**
 * MOTYW KOLORYSTYCZNY
 *  • 'bordo'  – jak konfigurator Domedron (misteriada.com)
 *  • 'granat' – jak sklep misteriada.pl
 * Można też wymusić motyw parametrem adresu: ?motyw=granat (np. w src iframe'a).
 */
export const THEMES = ['bordo', 'granat']
export const DEFAULT_THEME = 'bordo'

export function applyTheme() {
  let theme = DEFAULT_THEME
  try {
    const q = new URLSearchParams(window.location.search).get('motyw')
    if (THEMES.includes(q)) theme = q
  } catch {
    /* ignorujemy */
  }
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', theme === 'granat' ? '#0b1230' : '#2a0810')
  return theme
}
