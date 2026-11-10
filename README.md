# Deski Sadhu – konfigurator 3D z cennikiem

Interaktywny konfigurator desek fakirskich (Sadhu) dla [Misteriada](https://misteriada.pl/produkt/deski-sadhu-deski-fakirskie-pro-10-mm-wzor-metatron-miedz/).
Klient wybiera rozstaw i materiał gwoździ, wymiar, kolor okleiny, grawer (wzór, napis, własny plik) i dodatki.
Na końcu widzi cennik w formie raportu (z wydrukiem do PDF), a przycisk **Zamów** otwiera kwestionariusz
z danymi kontaktowymi, pod którymi skontaktuje się wykonawca.

Architektura i styl są takie same jak w konfiguratorze kopuły Domedron (`InteraktywnaKopula`).

**Stos:** React 19 · @react-three/fiber 9 · @react-three/drei 10 · three.js · zustand · Tailwind CSS 4 · Vite 8

## Uruchomienie

Wymagany Node.js 20.19+ lub 22.12+.

```powershell
npm install
npm run dev        # http://localhost:5173
npm run build      # produkcyjny build → dist/
npm run preview    # podgląd buildu
```

## Architektura

```
src/
├─ ConfiguratorApp.jsx        # layout (desktop: 3D + panel po prawej, mobile: 3D u góry, panel pod spodem)
├─ store/useConfigurator.js   # stan (zustand): konfiguracja, historia cofnij/ponów, link #c=…, plik graweru
├─ config/
│  ├─ catalog.js              # poziomy (8/10/12 mm), gwoździe, wymiary, kolory, wzory, kroje, dodatki, geometria
│  ├─ pricing.js              # CENNIK – wszystkie kwoty w jednym miejscu
│  └─ theme.js                # motyw kolorystyczny: bordo (jak Domedron) / granat (jak misteriada.pl)
├─ lib/
│  ├─ nails.js                # układ heksagonalny gwoździ, liczba gwoździ, szacunkowy nacisk
│  ├─ engraving.js            # okleina, sklejka i wzory graweru rysowane na <canvas>
│  ├─ quote.js                # raport cenowy i opis konfiguracji (podsumowanie, e-mail, zamówienie)
│  └─ snapshot.js             # zrzut podglądu 3D do raportu i zamówienia
├─ scene/
│  ├─ BoardScene.jsx          # Canvas, światło, kamera, widoki kompletu
│  ├─ Board.jsx               # deska: bryła, tekstury obu stron, gwoździe (instancing)
│  └─ Feet.jsx                # sylwetki stóp dla skali
└─ ui/
   ├─ UIOverlay.jsx           # panel konfiguracji + CTA „Zamów”
   ├─ EngravingEditor.jsx     # wzór / własny plik / kolor / rozmiar / napis
   ├─ PriceReport.jsx         # cennik-raport + wersja do druku (PDF)
   ├─ OrderModal.jsx          # kwestionariusz zamówienia
   ├─ ViewerOverlay.jsx       # widoki, narzędzia podglądu, wymiary
   └─ controls.jsx, icons.jsx, ResetControl.jsx, reveal.js
```

### Gwoździe

Układ jest **heksagonalny**: każdy gwóźdź ma 6 sąsiadów w odległości równej rozstawowi
(8 mm – Początkujący, 10 mm – PRO, 12 mm – GORE). Rzędy są co `rozstaw × √3/2`, co drugi przesunięty
o pół rozstawu, a siatka jest wyśrodkowana z marginesem `GEOMETRY.margin` od krawędzi.
Pole jest symetryczne: pełne rzędy i krótsze o jeden gwóźdź rzędy przesunięte, a narożniki są ścięte „schodkowo”
wzdłuż linii siatki (`fieldCornerCut`). Przy 10 mm i 29 × 14 cm rzędy od końca mają 8, 9, 10, potem 11 / 10 gwoździ –
razem 491 / 296 / 229 gwoździ na deskę (8 / 10 / 12 mm).
Między gwoździami są otwory (środki trójkątów siatki), w które po złożeniu kompletu wchodzą gwoździe drugiej deski.
Siatka jest symetryczna względem obrotu deski „końcem na koniec”, więc gwoździe zawsze trafiają w otwory – przy każdym
rozstawie i wymiarze. Pole otacza frezowany rowek, jak na płycie z produkcji
(`holeDiameter`, `holeDepth`, `grooveInset` w `GEOMETRY`).

### Przejścia między widokami

`src/scene/poseTransition.js` liczy tor ruchu tak, by deski się nie przenikały: deska leżąca na drugiej najpierw
unosi się pionowo (gwoździe wychodzą z otworów), deski rozsuwają się na boki dokładnie na tyle, by przy żadnym kącie
obrotu nie zachodziły na siebie, i unoszą się tylko tyle, by nic nie zeszło pod podłogę. Obrót odbywa się w środku toru,
a przy składaniu górna deska opada pionowo w otwory.

Wymiary gwoździa, grubość sklejki, zaokrąglenie narożników i margines są w `GEOMETRY`
(`src/config/catalog.js`) – to wartości orientacyjne do potwierdzenia z wykonawcą.

### Cennik

`src/config/pricing.js`:

```
cena kompletu = BOARD_SET × (powierzchnia / 29×14 cm) + liczba gwoździ × NAIL_PRICE[materiał] + dopłaty
```

Model jest skalibrowany do ceny ze sklepu: **PRO 10 mm, miedź, 29 × 14 cm, kasztan, Metatron = 850 zł**.
Pozostałe kwoty (stal, dopłaty, dodatki) są robocze – wystarczy je zmienić w tym pliku.
Kwota `null` oznacza pozycję „do wyceny” (np. grawer z własnego pliku); suma pokazuje się wtedy jako „od …”.

### Grawer

* Wzory są rysowane proceduralnie w `src/lib/engraving.js`: Kostka Metatrona, Kwiat Życia, Nasienie Życia,
  Sri Jantra, Merkaba, Drzewo Życia, Lotos, Słońce, Yin i Yang. Nowy wzór to funkcja w `DESIGN_DRAW`
  i wpis w `DESIGNS` (`catalog.js`) – miniatura w panelu powstaje automatycznie.
* Napis: do 28 znaków, 4 kroje (Alegreya, Cinzel, Great Vibes, Alegreya Sans), nad / pod / na środku wzoru.
* Własny plik (PNG / JPG / SVG / WEBP, do 4 MB): PNG z przezroczystością → kształt z kanału alfa,
  obraz bez przezroczystości → ciemne piksele to grawer. Plik nie trafia do linku, ale jest dołączany
  do zamówienia (do 1,5 MB).
* Grawer może być wspólny dla obu desek albo inny na każdej (np. dwa imiona).

### Widoki

Prezentacja (deski pionowo jak na zdjęciu produktu), Gwoździe, Grawer, Złożone (komplet do przechowywania:
gwoździe każdej deski wchodzą w otwory drugiej, między płytami zostaje `nailHeight − holeDepth`).
Zmiana opcji gwoździ obraca podgląd na stronę z gwoździami, a zmiana graweru – na stronę z grawerem.
Ikona stopy pokazuje sylwetki stóp dla skali.

### Motyw kolorystyczny

Domyślnie bordo, jak w Domedronie (`DEFAULT_THEME` w `src/config/theme.js`). Granat jak na misteriada.pl
włącza parametr adresu `?motyw=granat`, np. w `src` iframe'a.

## Zamówienia

Zmienne środowiskowe (lokalnie `.env.local`, na GitHubie: *Settings → Secrets and variables → Actions → Variables*):

| Zmienna | Działanie |
|---|---|
| `VITE_ORDER_ENDPOINT` | POST `application/json` z danymi kontaktowymi, konfiguracją, cennikiem, linkiem i plikiem graweru (np. Formspree lub własne API) |
| `VITE_ORDER_EMAIL` | gdy brak endpointu, otwiera program pocztowy z gotową wiadomością |

Każde zamówienie trafia też do strony nadrzędnej przez
`postMessage({ type: 'sadhu:order', payload })` (ze zrzutem podglądu 3D w `payload.preview`).

Link z kampanii może ustawić poziom i źródło leada: `#poziom=start|pro|gore&src=<id>`.

## Wdrożenie na GitHub Pages

1. Utwórz repozytorium (np. `DeskiFakirskieSadhu`) i wypchnij projekt na gałąź `main`.
2. *Settings → Pages → Source: GitHub Actions*.
3. Ustaw zmienne `VITE_ORDER_*` (patrz wyżej). Workflow `.github/workflows/deploy.yml` zbuduje i opublikuje stronę
   pod adresem `https://<użytkownik>.github.io/<repozytorium>/`.

## Osadzenie na stronie klienta (iframe)

Gotowy fragment HTML/CSS jest w `public/embed-example.html` (po buildzie: `/embed-example.html`).
Aplikacja zawsze wypełnia 100% wysokości swojego okna, więc wystarczy nadać iframe'owi wysokość.
Dzięki `base: './'` w `vite.config.js` build działa też jako zwykłe pliki statyczne w podkatalogu serwera klienta.
