import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, ENGRAVE_COLORS, FONTS, GEOMETRY, LEVELS, NAILS, PLYWOOD } from '../config/catalog'
import { nailLayout } from '../lib/nails'
import { paintInnerFace, paintOuterFace } from '../lib/engraving'
import { boardEngraving } from '../lib/quote'

/** mm → jednostki sceny (cm) */
const U = 0.1

/**
 * Bryła deski: zaokrąglony prostokąt wyciągnięty na grubość sklejki.
 * Grupy materiałów: 0 – strona z gwoździami (sklejka), 1 – krawędzie, 2 – strona z grawerem.
 * UV obu stron liczone są tak, by grafika była prosta, gdy deskę obrócimy grawerem do góry.
 */
export function useBoardGeometry(length, width) {
  return useMemo(() => {
    const L = length * U
    const W = width * U
    const T = GEOMETRY.boardThickness * U
    const bevel = 0.12
    const r = Math.min(GEOMETRY.cornerRadius * U, W / 2 - 0.2) - bevel
    const w = W / 2 - bevel
    const l = L / 2 - bevel
    const s = new THREE.Shape()
    s.moveTo(-w + r, -l)
    s.lineTo(w - r, -l)
    s.quadraticCurveTo(w, -l, w, -l + r)
    s.lineTo(w, l - r)
    s.quadraticCurveTo(w, l, w - r, l)
    s.lineTo(-w + r, l)
    s.quadraticCurveTo(-w, l, -w, l - r)
    s.lineTo(-w, -l + r)
    s.quadraticCurveTo(-w, -l, -w + r, -l)

    const g = new THREE.ExtrudeGeometry(s, {
      depth: T - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 6,
    })
    // wyciągnięcie wzdłuż +Z → wzdłuż +Y (grubość), długość deski wzdłuż osi Z
    g.rotateX(-Math.PI / 2)
    g.translate(0, bevel, 0)

    const pos = g.attributes.position
    const uv = g.attributes.uv
    const [caps, sides] = g.groups
    // wieczka: góra (gwoździe) i dół (grawer) – rozpoznajemy po wysokości wierzchołka
    for (let i = caps.start; i < caps.start + caps.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const top = pos.getY(i) > T / 2
      uv.setXY(i, top ? (x + W / 2) / W : (W / 2 - x) / W, (L / 2 - z) / L)
    }
    uv.needsUpdate = true
    g.clearGroups()
    const half = caps.count / 2
    const bottomFirst = pos.getY(caps.start) < T / 2
    g.addGroup(caps.start, half, bottomFirst ? 2 : 0)
    g.addGroup(caps.start + half, half, bottomFirst ? 0 : 2)
    g.addGroup(sides.start, sides.count, 1)
    g.computeBoundingSphere()
    return { geometry: g, L, W, T }
  }, [length, width])
}

/** Geometria gwoździa (bryła obrotowa: trzpień + zaokrąglony czubek), w cm */
function useNailGeometry() {
  return useMemo(() => {
    const r = (GEOMETRY.nailDiameter / 2) * U
    const h = GEOMETRY.nailHeight * U
    const tip = GEOMETRY.nailTip * U
    // trzpień + stożkowy, lekko zaokrąglony czubek (jak na płycie z produkcji)
    const pts = [
      [0, -0.3],
      [r, -0.3],
      [r, h - tip],
      [r * 0.55, h - tip * 0.45],
      [r * 0.18, h - 0.03],
      [0, h],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(pts, 8)
  }, [])
}

/** Ładowanie fontów napisów przed rysowaniem na canvasie */
function useFontsReady(families) {
  const [version, setVersion] = useState(0)
  const key = families.join('|')
  useEffect(() => {
    if (!document.fonts?.load) return
    let alive = true
    Promise.all(families.map((f) => document.fonts.load(`48px "${f}"`).catch(() => null))).then(() => alive && setVersion((v) => v + 1))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return version
}

function useImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    if (!src) {
      setImg(null)
      return
    }
    const im = new Image()
    im.onload = () => setImg(im)
    im.src = src
  }, [src])
  return img
}

/**
 * Pojedyncza deska. Położenie grupy (`groupRef`) ustawia PoseAnimator w BoardScene –
 * tam jest logika przejść między widokami bez przenikania desek.
 */
export default function Board({ index, config, customImage, groupRef }) {
  const gl = useThree((s) => s.gl)
  const { geometry, L, W, T } = useBoardGeometry(config.length, config.width)
  const nailGeo = useNailGeometry()
  const level = LEVELS.find((l) => l.id === config.level)
  const nailDef = NAILS.find((n) => n.id === config.nail)
  const wood = COLORS.find((c) => c.id === config.color)
  const engrave = ENGRAVE_COLORS.find((c) => c.id === config.engraveColor)
  const board = boardEngraving(config, index)
  const font = FONTS.find((f) => f.id === board.font)
  const fontsVersion = useFontsReady([font.family])
  const img = useImage(board.design === 'custom' ? customImage : null)

  const layout = useMemo(() => nailLayout(config.length, config.width, level.spacing), [config.length, config.width, level.spacing])

  // --- tekstury
  const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
  const outerTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 640
    c.height = Math.round((640 * config.length) / config.width)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = aniso
    return t
  }, [config.length, config.width, aniso])
  const innerTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 720
    c.height = Math.round((720 * config.length) / config.width)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = aniso
    return t
  }, [config.length, config.width, aniso])

  useEffect(() => () => outerTex.dispose(), [outerTex])
  useEffect(() => () => innerTex.dispose(), [innerTex])

  useEffect(() => {
    paintOuterFace(outerTex.image, {
      wood,
      engrave,
      board,
      scale: config.scale,
      offset: config.offset,
      fontFamily: font.family,
      fontWeight: font.weight,
      customImage: img,
      invert: config.invertCustom,
      seed: 11 + index * 17,
    })
    outerTex.needsUpdate = true
  }, [outerTex, wood, engrave, board, config.scale, config.offset, font, img, config.invertCustom, index, fontsVersion])

  useEffect(() => {
    paintInnerFace(innerTex.image, {
      plywood: PLYWOOD,
      points: layout.points,
      holes: layout.holes,
      width: config.width,
      geometry: GEOMETRY,
    })
    innerTex.needsUpdate = true
  }, [innerTex, layout, config.length, config.width])

  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ map: innerTex, roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ color: wood.base, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ map: outerTex, roughness: 0.55 }),
    ],
    [innerTex, outerTex, wood.base],
  )
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  const nailMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: nailDef.color,
        metalness: nailDef.metalness,
        roughness: nailDef.roughness,
        envMapIntensity: 1.2,
      }),
    [nailDef],
  )
  useEffect(() => () => nailMat.dispose(), [nailMat])

  // --- gwoździe (instancing)
  const nails = useRef()
  const count = layout.points.length
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    layout.points.forEach(([x, y], i) => {
      m.makeTranslation(x * U, T, -y * U)
      nails.current.setMatrixAt(i, m)
    })
    nails.current.instanceMatrix.needsUpdate = true
    nails.current.computeBoundingSphere()
  }, [layout, T, count])

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={materials} castShadow receiveShadow />
      {/* materiał i geometria jako właściwości, nie `args` – inaczej zmiana metalu tworzy nowy obiekt
          bez ustawionych pozycji i wszystkie gwoździe lądują w jednym punkcie */}
      <instancedMesh key={count} ref={nails} args={[undefined, undefined, count]} geometry={nailGeo} material={nailMat} castShadow />
    </group>
  )
}

/** Wymiary bryły w cm (dla ustawień widoków) */
export function boardDims(config) {
  return {
    L: config.length * U,
    W: config.width * U,
    T: GEOMETRY.boardThickness * U,
    H: GEOMETRY.nailHeight * U,
    gap: GEOMETRY.gap * U,
  }
}
