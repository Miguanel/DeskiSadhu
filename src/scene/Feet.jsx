import { useMemo } from 'react'
import * as THREE from 'three'
import { boardDims } from './Board'

/**
 * Sylwetki stóp (rozmiar ok. 42 EU, 26,5 cm) unoszące się nad gwoździami – pokazują skalę deski
 * i to, jak stopa układa się na komplecie. Widoczne tylko w widoku „gwoździe do góry”.
 */
function footShape(len, wid) {
  const s = new THREE.Shape()
  const l = len / 2
  // kontur prawej stopy: pięta na dole (y = -l), palce u góry
  s.moveTo(0, -l)
  s.bezierCurveTo(wid * 0.42, -l, wid * 0.42, -l * 0.55, wid * 0.36, -l * 0.2)
  s.bezierCurveTo(wid * 0.32, l * 0.15, wid * 0.55, l * 0.35, wid * 0.52, l * 0.62)
  s.bezierCurveTo(wid * 0.5, l * 0.95, wid * 0.1, l * 1.02, -wid * 0.12, l * 0.98)
  s.bezierCurveTo(-wid * 0.42, l * 0.94, -wid * 0.48, l * 0.6, -wid * 0.44, l * 0.3)
  s.bezierCurveTo(-wid * 0.4, 0, -wid * 0.3, -l * 0.3, -wid * 0.33, -l * 0.6)
  s.bezierCurveTo(-wid * 0.36, -l * 0.95, -wid * 0.18, -l, 0, -l)
  return s
}

export default function Feet({ config }) {
  const { W, T, H, gap } = boardDims(config)
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(footShape(26.5, 10), { depth: 0.4, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 2 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f6e2a8', transparent: true, opacity: 0.38, roughness: 0.4, depthWrite: false }),
    [],
  )
  const sx = W / 2 + gap / 2
  const y = T + H + 0.15
  return (
    <group>
      <mesh geometry={geo} material={mat} position={[sx, y, 0.4]} rotation-y={-0.06} />
      <mesh geometry={geo} material={mat} position={[-sx, y, 0.4]} rotation-y={0.06} scale-x={-1} />
    </group>
  )
}
