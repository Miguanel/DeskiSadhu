import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useConfigurator } from '../store/useConfigurator'
import Board, { boardDims } from './Board'
import { GEOMETRY } from '../config/catalog'
import Feet from './Feet'
import { registerSnapshot } from '../lib/snapshot'

/**
 * BOARD SCENE – Canvas, światło, kamera i widoki kompletu desek.
 * Jednostki sceny: centymetry.
 *
 * Widoki (view.pose):
 *  • showcase  – deski ustawione pionowo jak na zdjęciu produktu (grawer + gwoździe)
 *  • nails     – obie deski płasko, gwoździami do góry (do praktyki)
 *  • engraving – obie deski odwrócone grawerem do góry
 *  • stacked   – złożony komplet: górna deska obrócona „końcem na koniec”, jej gwoździe wchodzą
 *                w otwory dolnej (i odwrotnie) – deski zachodzą na siebie, nie stykają się czubkami
 */
const q = (x = 0, y = 0, z = 0, order = 'XYZ') => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, order))
const FLAT = q()
const FLIP = q(0, 0, Math.PI)
const TURN = q(0, Math.PI, 0) // obrót o 180° w płaszczyźnie deski
const STAND_NAILS = q(Math.PI / 2, 0, 0)
// najpierw obrót wokół osi długiej (grawer do góry), potem postawienie deski pionowo
const STAND_ENGRAVED = new THREE.Quaternion().multiplyQuaternions(q(Math.PI / 2, 0, 0), FLIP)

export function poseTargets(pose, config) {
  const { L, W, T, H, gap } = boardDims(config)
  const sx = W / 2 + gap / 2
  switch (pose) {
    case 'nails':
      return [
        { position: [-sx, 0, 0], quaternion: FLAT },
        { position: [sx, 0, 0], quaternion: FLAT },
      ]
    case 'engraving':
      return [
        { position: [-sx, T, 0], quaternion: FLIP },
        { position: [sx, T, 0], quaternion: FLIP },
      ]
    case 'stacked': {
      // dolna deska obrócona o 180°, górna odwrócona grawerem do góry: względem siebie to obrót
      // „końcem na koniec”, więc gwoździe jednej trafiają w otwory drugiej (patrz lib/nails.js).
      // Między płytami zostaje wysokość gwoździa minus głębokość otworu.
      const gapFaces = H - GEOMETRY.holeDepth * 0.1
      return [
        { position: [0, 0, 0], quaternion: TURN },
        { position: [0, 2 * T + gapFaces, 0], quaternion: FLIP },
      ]
    }
    case 'showcase':
    default: {
      const yaw = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a)
      return [
        { position: [-W * 0.36, L / 2, T + 2.5], quaternion: yaw(0.12).multiply(STAND_ENGRAVED) },
        { position: [W * 0.42, L / 2, -W * 0.25], quaternion: yaw(-0.16).multiply(STAND_NAILS) },
      ]
    }
  }
}

/**
 * Kadr kamery dla widoku: kierunek patrzenia, punkt docelowy i promień obejmowanej sceny (cm).
 * Odległość dobiera CameraRig tak, by całość zmieściła się w oknie przy dowolnych proporcjach.
 */
function cameraFor(pose, config) {
  const { L, W, gap, T, H } = boardDims(config)
  if (pose === 'showcase') return { dir: [0.2, 0.16, 1], target: [0, L * 0.5, 0], radius: 0.5 * Math.hypot(L, W * 1.9) }
  // złożone: niski kąt z boku, żeby było widać gwoździe obu desek wchodzące w otwory
  if (pose === 'stacked') return { dir: [1, 0.32, 0.55], target: [0, T + H / 2, 0], radius: 0.5 * Math.hypot(L, W) * 0.95 }
  return { dir: [0, 1.25, 0.9], target: [0, 1, 0], radius: 0.5 * Math.hypot(L, 2 * W + gap) }
}

export default function BoardScene() {
  useEffect(() => {
    const onKey = (e) => {
      // pomijamy tylko pola tekstowe (tam Ctrl+Z cofa wpisywany tekst); suwaki i przyciski – nie
      const t = e.target
      if (t.isContentEditable || /textarea|select/i.test(t.tagName) || (t.tagName === 'INPUT' && !/range|checkbox|radio|button|file/.test(t.type))) return
      const st = useConfigurator.getState()
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y')) {
        e.preventDefault()
        if (e.key === 'y' || e.shiftKey) st.redo()
        else st.undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [18, 30, 85], fov: 32, near: 1, far: 800 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
      className="touch-none"
      aria-label="Podgląd 3D desek Sadhu – przeciągnij, aby obrócić; kółko lub gest, aby przybliżyć"
      onCreated={(state) => {
        state.gl.toneMapping = THREE.ACESFilmicToneMapping
        state.gl.toneMappingExposure = 1.05
        if (import.meta.env.DEV) window.__r3f = state
      }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  )
}

function SceneContent() {
  const config = useConfigurator((s) => s.config)
  const customImage = useConfigurator((s) => s.customImage)
  const pose = useConfigurator((s) => s.view.pose)
  const showFeet = useConfigurator((s) => s.view.showFeet)
  const autoRotate = useConfigurator((s) => s.view.autoRotate)
  const resetToken = useConfigurator((s) => s.view.resetToken)

  const targets = useMemo(() => poseTargets(pose, config), [pose, config])
  const { gl, scene, camera } = useThree()
  useEffect(
    () =>
      registerSnapshot((type, quality) => {
        // canvas jest przezroczysty (tło robi CSS) – do zrzutu podkładamy kolor tła motywu
        const prev = scene.background
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-deep-800').trim() || '#3a0c17'
        scene.background = new THREE.Color(bg)
        gl.render(scene, camera)
        const url = gl.domElement.toDataURL(type, quality)
        scene.background = prev
        gl.render(scene, camera)
        return url
      }),
    [gl, scene, camera],
  )
  const { L, W } = boardDims(config)

  return (
    <>
      <Lights size={Math.max(L, W * 2)} />
      <Board index={0} config={config} customImage={customImage} target={targets[0]} />
      <Board index={1} config={config} customImage={customImage} target={targets[1]} />
      {showFeet && pose === 'nails' && <Feet config={config} />}
      <ContactShadows position={[0, -0.05, 0]} scale={Math.max(L, W * 2) * 2.4} blur={2.4} far={L} opacity={0.55} resolution={512} />
      <CameraRig pose={pose} config={config} autoRotate={autoRotate} resetToken={resetToken} />
    </>
  )
}

function Lights({ size }) {
  const key = useRef()
  useEffect(() => {
    const cam = key.current.shadow.camera
    const e = size * 1.2
    Object.assign(cam, { left: -e, right: e, top: e, bottom: -e, near: 1, far: size * 6 })
    cam.updateProjectionMatrix()
  }, [size])
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        ref={key}
        position={[size * 0.8, size * 2.2, size * 1.4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-size * 1.5, size * 0.8, -size]} intensity={0.6} color="#ffd9a8" />
      {/* odbicia na metalu gwoździ – lokalne „softboxy”, bez pobierania plików HDR */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, 4]} scale={[12, 5, 1]} color="#fff4e2" />
        <Lightformer intensity={1.4} position={[-7, 3, -3]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} color="#ffd7a6" />
        <Lightformer intensity={1.1} position={[7, 2, -2]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} color="#cfe0ff" />
        <Lightformer intensity={0.6} position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} color="#3a1a10" />
      </Environment>
    </>
  )
}

function CameraRig({ pose, config, autoRotate, resetToken }) {
  const controls = useRef()
  const camera = useThree((s) => s.camera)
  const anim = useRef(null)
  const { L, W } = boardDims(config)
  const span = Math.max(L, W * 2.3)

  const size = useThree((s) => s.size)
  // zmiana widoku lub "wyśrodkuj" → płynny przelot kamery
  useEffect(() => {
    const { dir, target, radius } = cameraFor(pose, config)
    const vfov = THREE.MathUtils.degToRad(camera.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (size.width / size.height))
    const dist = (radius * 1.12) / Math.sin(Math.min(vfov, hfov) / 2)
    const t = new THREE.Vector3(...target)
    const pos = new THREE.Vector3(...dir).normalize().multiplyScalar(dist).add(t)
    anim.current = { pos, target: t, time: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, resetToken, config.length, config.width, size.width])

  useFrame((_, dt) => {
    const a = anim.current
    if (!a || !controls.current) return
    const k = 1 - Math.exp(-dt * 4)
    camera.position.lerp(a.pos, k)
    controls.current.target.lerp(a.target, k)
    controls.current.update()
    a.time += dt
    if (a.time > 1.6 || camera.position.distanceTo(a.pos) < 0.05) anim.current = null
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate}
      autoRotateSpeed={0.9}
      minDistance={span * 0.5}
      maxDistance={span * 6}
      maxPolarAngle={Math.PI * 0.49}
      enablePan={false}
      onStart={() => {
        anim.current = null
      }}
    />
  )
}
