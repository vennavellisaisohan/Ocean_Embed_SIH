import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { paintGlobeCanvas } from '../../lib/paintGlobe'

function Earth({ mode, depth, dateId }) {
  const texture = useMemo(() => {
    const canvas = paintGlobeCanvas(mode, depth, dateId)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.needsUpdate = true
    return tex
  }, [mode, depth, dateId])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group rotation={[0, (-75 * Math.PI) / 180, 0]}>
      <mesh>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh scale={1.025}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial color="#7ec8e3" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

export default function TempGlobe({ mode = 'sst', depth = 0, dateId = '2025-04-25', caption }) {
  return (
    <div className="globe-wrap">
      <Canvas camera={{ position: [0, 0.12, 3.35], fov: 34 }} gl={{ antialias: true, alpha: true }} dpr={[1, 1.75]}>
        <color attach="background" args={['#05070a']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 2.4, 3]} intensity={1.35} />
        <directionalLight position={[-3, -1, -2]} intensity={0.25} color="#8fb4c8" />
        <Earth mode={mode} depth={depth} dateId={dateId} />
        <OrbitControls enablePan={false} minDistance={1.7} maxDistance={4.2} enableDamping />
      </Canvas>
      {caption && <p className="globe-cap">{caption}</p>}
    </div>
  )
}
