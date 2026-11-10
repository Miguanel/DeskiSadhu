/**
 * CENNIK KONFIGURATORA
 * ---------------------------------------------------------------
 * Model cenowy kompletu (2 deski):
 *
 *   cena kompletu = BOARD_SET × (powierzchnia / powierzchnia standardowa)
 *                 + liczba gwoździ × cena gwoździa (zależna od materiału)
 *                 + dopłaty (kolor na zamówienie, wymiar niestandardowy, napisy)
 *
 * Kalibracja: komplet PRO 10 mm, miedź, 29 × 14 cm, kasztan, grawer z katalogu
 * = 850 zł (cena ze sklepu misteriada.pl). Pozostałe wartości są ROBOCZE –
 * do potwierdzenia z Misteriadą. Każdą można zmienić tutaj bez dotykania reszty kodu.
 *
 * `null` jako cena = pozycja „do indywidualnej wyceny” (np. własny plik graweru).
 */

export const CURRENCY = 'zł'

/** Ceny końcowe zaokrąglamy w górę do… */
export const ROUND_TO = 10

/** Deski (sklejka, okleina, grawer z katalogu, wykończenie) – komplet 2 szt. w rozmiarze standardowym */
export const BOARD_SET = 370

/** Cena jednego gwoździa (z osadzeniem) wg materiału */
export const NAIL_PRICE = {
  copper: 0.6, // ROBOCZE – dobrane tak, by PRO 10 mm / miedź = 850 zł
  steel: 0.25, // ROBOCZE
}

export const SURCHARGES = {
  customColor: 60, // kolor okleiny „na zamówienie” (za komplet)
  customSize: 80, // wymiar niestandardowy (za komplet)
  text: 40, // napis grawerowany – za każdą deskę z napisem
  designPerBoard: 0, // wzór z katalogu – w cenie
  customFile: null, // własny plik graweru – wycena indywidualna
}

/** Dodatki – cena za sztukę (ROBOCZE) */
export const ACCESSORY_PRICES = {
  spray: 45,
  brush: 35,
  case: 120,
  mat: 150,
}

/** Informacja pod cennikiem */
export const PRICE_NOTE =
  'Ceny orientacyjne brutto. Ostateczną wycenę, termin realizacji i koszt dostawy potwierdzi wykonawca po kontakcie.'
