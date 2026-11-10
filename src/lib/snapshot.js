/**
 * Zrzut podglądu 3D (do wydruku raportu i do zamówienia).
 * Scena rejestruje funkcję, która renderuje klatkę i zwraca ją jako dataURL.
 */
let snap = null
export const registerSnapshot = (fn) => {
  snap = fn
  return () => {
    if (snap === fn) snap = null
  }
}
export const takeSnapshot = (type = 'image/jpeg', quality = 0.85) => {
  try {
    return snap ? snap(type, quality) : null
  } catch {
    return null
  }
}
