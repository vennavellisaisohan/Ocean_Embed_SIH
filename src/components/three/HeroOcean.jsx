import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

const SUN_ELEVATION = 48
const SUN_AZIMUTH = 85

function setSunVector(target) {
  const phi = THREE.MathUtils.degToRad(90 - SUN_ELEVATION)
  const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH)
  target.setFromSphericalCoords(1, phi, theta)
  return target
}

function OceanWorld({ progressRef, onReady }) {
  const { gl, scene } = useThree()
  const sun = useMemo(() => setSunVector(new THREE.Vector3()), [])
  const normals = useLoader(THREE.TextureLoader, '/waternormals.jpg')
  const readyOnce = useRef(false)

  const water = useMemo(() => {
    normals.wrapS = normals.wrapT = THREE.RepeatWrapping
    normals.anisotropy = 8
    normals.needsUpdate = true
    const mesh = new Water(new THREE.PlaneGeometry(10000, 10000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: sun.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e28,
      distortionScale: 3.4,
      fog: false,
      side: THREE.FrontSide,
    })
    mesh.rotation.x = -Math.PI / 2
    mesh.material.uniforms.size.value = 3.2
    return mesh
  }, [normals, sun])

  const sky = useMemo(() => {
    const s = new Sky()
    s.scale.setScalar(10000)
    const u = s.material.uniforms
    u.turbidity.value = 3.4
    u.rayleigh.value = 2.4
    u.mieCoefficient.value = 0.004
    u.mieDirectionalG.value = 0.7
    u.cloudCoverage.value = 0.12
    u.cloudDensity.value = 0.18
    u.cloudElevation.value = 0.42
    u.sunPosition.value.copy(sun)
    return s
  }, [sun])

  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const envScene = new THREE.Scene()
    const parent = sky.parent
    const showSun = sky.material.uniforms.showSunDisc
    if (showSun) showSun.value = 0
    envScene.add(sky)
    const rt = pmrem.fromScene(envScene, 0.04)
    if (parent) parent.add(sky)
    if (showSun) showSun.value = 1
    scene.environment = rt.texture
    water.material.uniforms.sunDirection.value.copy(sun).normalize()

    return () => {
      scene.environment = null
      rt.dispose()
      pmrem.dispose()
    }
  }, [gl, scene, sky, water, sun])

  useEffect(() => () => {
    water.geometry.dispose()
    water.material.dispose()
    sky.geometry.dispose()
    sky.material.dispose()
  }, [water, sky])

  useFrame((state, delta) => {
    water.material.uniforms.time.value += delta * 1.15
    if (sky.material.uniforms.time) {
      sky.material.uniforms.time.value = state.clock.elapsedTime
    }
    const p = progressRef.current
    sky.visible = p < 0.72
    const under = Math.min(1, Math.max(0, (p - 0.58) / 0.28))
    gl.toneMappingExposure = THREE.MathUtils.lerp(0.24, 0.1, under)
    water.material.side = p > 0.62 ? THREE.DoubleSide : THREE.FrontSide
    if (!readyOnce.current) {
      readyOnce.current = true
      onReady?.()
    }
  })

  return (
    <>
      <primitive object={sky} />
      <primitive object={water} />
      <directionalLight position={sun.clone().multiplyScalar(100)} intensity={2.4} color="#ffffff" />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#6eb6ea', '#16343c', 0.4]} />
      <SurfaceBuoy />
      <DiveParticles />
      <CameraDive progressRef={progressRef} />
    </>
  )
}

function SurfaceBuoy() {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    ref.current.position.y = Math.sin(t * 0.9) * 0.55 + 0.35
    ref.current.rotation.z = Math.sin(t * 0.6) * 0.08
    ref.current.rotation.x = Math.cos(t * 0.5) * 0.05
  })
  return (
    <group ref={ref} position={[6, 0.4, -4]}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 2.4, 16]} />
        <meshStandardMaterial color="#e2b84a" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.6, 8]} />
        <meshStandardMaterial color="#f4eee2" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#c4a574" emissive="#c4a574" emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

function makeBubbleTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
  g.addColorStop(0, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.22, 'rgba(220,245,255,0.55)')
  g.addColorStop(0.55, 'rgba(180,220,235,0.18)')
  g.addColorStop(0.78, 'rgba(160,210,230,0.06)')
  g.addColorStop(1, 'rgba(160,210,230,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

function DiveParticles({ count = 420 }) {
  const pointsRef = useRef()
  const bubbleMap = useMemo(() => makeBubbleTexture(), [])
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 70
      positions[i * 3 + 1] = -Math.random() * 55 - 0.4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70
      speeds[i] = 0.012 + Math.random() * 0.035
    }
    return { positions, speeds }
  }, [count])

  useFrame((state) => {
    const pts = pointsRef.current
    if (!pts) return
    const arr = pts.geometry.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3] += Math.sin(t * 0.6 + i) * 0.006
      arr[i3 + 1] += speeds[i]
      if (arr[i3 + 1] > -0.15) {
        arr[i3] = (Math.random() - 0.5) * 70
        arr[i3 + 1] = -55
        arr[i3 + 2] = (Math.random() - 0.5) * 70
      }
    }
    pts.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={bubbleMap}
        alphaMap={bubbleMap}
        size={0.55}
        color="#d7f3ff"
        transparent
        opacity={0.85}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        alphaTest={0.02}
        toneMapped={false}
      />
    </points>
  )
}

function CameraDive({ progressRef }) {
  const { camera, scene } = useThree()
  const pLerp = useRef(0)
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const target = THREE.MathUtils.clamp(progressRef.current, 0, 1)
    pLerp.current = THREE.MathUtils.damp(pLerp.current, target, 4.2, delta)
    const p = pLerp.current
    const t = state.clock.elapsedTime
    const idle = Math.max(0, 1 - p * 2.1)

    let camX = 22 + Math.sin(t * 0.08) * idle * 10
    let camY = 16
    let camZ = 62 + Math.cos(t * 0.08) * idle * 10
    let lookY = 3.2
    let lookZ = 0

    if (p < 0.55) {
      const n = p / 0.55
      camY = THREE.MathUtils.lerp(16, 7.2, n)
      camZ = THREE.MathUtils.lerp(62, 28, n)
      camX = THREE.MathUtils.lerp(22, 14, n) + Math.sin(t * 0.08) * idle * 8
      lookY = THREE.MathUtils.lerp(3.2, 1.1, n)
    } else if (p < 0.7) {
      const n = (p - 0.55) / 0.15
      const s = n * n * (3 - 2 * n)
      camY = THREE.MathUtils.lerp(7.2, -2.4, s)
      camZ = THREE.MathUtils.lerp(28, 16, s)
      camX = THREE.MathUtils.lerp(14, 6, s)
      lookY = THREE.MathUtils.lerp(1.1, 1.8, s)
      lookZ = THREE.MathUtils.lerp(0, -8, s)
    } else {
      const n = (p - 0.7) / 0.3
      camY = THREE.MathUtils.lerp(-2.4, -11, n)
      camZ = THREE.MathUtils.lerp(16, 14, n)
      camX = THREE.MathUtils.lerp(6, 3, n)
      lookY = THREE.MathUtils.lerp(1.8, 4.5, n)
      lookZ = THREE.MathUtils.lerp(-8, -18, n)
    }

    camera.position.x = THREE.MathUtils.damp(camera.position.x, camX, 5, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, camY, 5, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camZ, 5, delta)
    look.set(0, lookY, lookZ)
    camera.lookAt(look)

    if (scene.fog) {
      const under = Math.min(1, Math.max(0, (p - 0.58) / 0.3))
      scene.fog.color.lerpColors(new THREE.Color('#6eb4e0'), new THREE.Color('#06222c'), under)
      scene.fog.near = THREE.MathUtils.lerp(800, 8, under)
      scene.fog.far = THREE.MathUtils.lerp(8000, 90, under)
      if (under > 0.25) scene.background = scene.fog.color
    }
  })

  return null
}

export default function HeroOcean({ progressRef }) {
  const wrapRef = useRef(null)

  const markReady = () => {
    wrapRef.current?.classList.add('is-ready')
  }

  return (
    <div className="hero-ocean" ref={wrapRef}>
      <Canvas
        camera={{ position: [22, 16, 62], fov: 55, near: 0.5, far: 20000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.24,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.75]}
      >
        <color attach="background" args={['#4f9fd4']} />
        <fog attach="fog" args={['#6eb4e0', 800, 8000]} />
        <Suspense fallback={null}>
          <OceanWorld progressRef={progressRef} onReady={markReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}
