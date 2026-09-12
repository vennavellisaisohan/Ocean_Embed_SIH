import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ══════════════════════════════════════════════════════════════
   1. PROCEDURAL OCEAN WATER SURFACE SHADER
   Multi-harmonic Gerstner waves, physical deep ocean absorption,
   Fresnel reflection, organic caustics, and infinite horizon fade.
   ══════════════════════════════════════════════════════════════ */
const oceanVertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElevation;

  struct Wave {
    vec2 dir;
    float amp;
    float freq;
    float speed;
    float steep;
  };

  void main() {
    vec3 pos = position;

    // 4 coherent wave harmonics
    Wave w1 = Wave(normalize(vec2(1.0, 0.35)), uAmplitude * 0.45, 1.4, 0.9, 0.5);
    Wave w2 = Wave(normalize(vec2(-0.6, 0.8)), uAmplitude * 0.28, 2.5, 0.75, 0.4);
    Wave w3 = Wave(normalize(vec2(0.4, -0.9)), uAmplitude * 0.14, 4.2, 1.2, 0.3);
    Wave w4 = Wave(normalize(vec2(-0.3, -0.6)), uAmplitude * 0.07, 7.0, 1.6, 0.2);

    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    vec3 p = pos;

    Wave waves[4];
    waves[0] = w1;
    waves[1] = w2;
    waves[2] = w3;
    waves[3] = w4;

    for (int i = 0; i < 4; i++) {
      float phase = dot(waves[i].dir, pos.xz) * waves[i].freq + uTime * waves[i].speed;
      float s = sin(phase);
      float c = cos(phase);
      float wa = waves[i].freq * waves[i].amp;

      p.x += waves[i].dir.x * (waves[i].amp * waves[i].steep * c);
      p.y += waves[i].amp * s;
      p.z += waves[i].dir.y * (waves[i].amp * waves[i].steep * c);

      tangent.x -= waves[i].dir.x * waves[i].dir.x * (wa * waves[i].steep * s);
      tangent.y += waves[i].dir.x * (wa * c);
      tangent.z -= waves[i].dir.x * waves[i].dir.y * (wa * waves[i].steep * s);

      binormal.x -= waves[i].dir.x * waves[i].dir.y * (wa * waves[i].steep * s);
      binormal.y += waves[i].dir.y * (wa * c);
      binormal.z -= waves[i].dir.y * waves[i].dir.y * (wa * waves[i].steep * s);
    }

    vec3 calcNormal = normalize(cross(binormal, tangent));

    vElevation = p.y;
    vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
    vNormal = normalize(normalMatrix * calcNormal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const oceanFragmentShader = `
  uniform float uTime;
  uniform vec3 uAbyssalColor;
  uniform vec3 uDeepColor;
  uniform vec3 uMidColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFresnelColor;
  uniform vec3 uSunDirection;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    // Fresnel reflection — kept modest so grazing views stay ink, not milk
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);

    // Depth extinction gradient based on wave height
    float depthFactor = smoothstep(-0.2, 0.3, vElevation);
    vec3 waterColor = mix(uAbyssalColor, uDeepColor, smoothstep(-0.35, 0.0, vElevation));
    waterColor = mix(waterColor, uMidColor, depthFactor * 0.65);
    waterColor = mix(waterColor, uShallowColor, smoothstep(0.12, 0.38, vElevation) * 0.55);

    // Specular solar glitter
    vec3 halfVec = normalize(uSunDirection + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 64.0) * 0.18;

    // Organic filament caustics (soft, natural ocean shimmer)
    float c1 = sin(vWorldPos.x * 1.5 + vWorldPos.z * 0.9 + uTime * 0.85) * 0.5 + 0.5;
    float c2 = cos(vWorldPos.z * 1.3 - vWorldPos.x * 0.8 + uTime * 0.7) * 0.5 + 0.5;
    float caustics = (c1 * c2) * 0.03;

    // Soft crest highlights
    float crestFoam = smoothstep(0.24, 0.38, vElevation) * 0.06;

    // Seamless horizon fade to background space/night #020202
    float dist = length(vWorldPos.xz);
    float horizonFade = 1.0 - smoothstep(18.0, 36.0, dist);

    vec3 finalColor = waterColor + uFresnelColor * (fresnel * 0.18) + vec3(spec) + vec3(caustics) + vec3(crestFoam);
    finalColor = mix(vec3(0.043, 0.078, 0.11), finalColor, horizonFade);

    gl_FragColor = vec4(finalColor, horizonFade * 0.95);
  }
`

export function OceanSurface({ amplitude = 0.12 }) {
  const materialRef = useRef()

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAmplitude: { value: amplitude },
    uAbyssalColor: { value: new THREE.Color('#03080c') },
    uDeepColor: { value: new THREE.Color('#071820') },
    uMidColor: { value: new THREE.Color('#0c3a3c') },
    uShallowColor: { value: new THREE.Color('#1a5c58') },
    uFresnelColor: { value: new THREE.Color('#3d6b66') },
    uSunDirection: { value: new THREE.Vector3(0.4, 0.9, 0.2).normalize() },
  }), [amplitude])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[80, 80, 256, 256]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
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
  g.addColorStop(0.25, 'rgba(220,245,255,0.5)')
  g.addColorStop(0.6, 'rgba(180,220,235,0.16)')
  g.addColorStop(1, 'rgba(160,210,230,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

/* ══════════════════════════════════════════════════════════════
   2. BIOLUMINESCENT MARINE SNOW & DEPTH PARTICLES
   ══════════════════════════════════════════════════════════════ */
export function DepthParticles({ count = 5000 }) {
  const pointsRef = useRef()
  const bubbleMap = useMemo(() => makeBubbleTexture(), [])

  const { positions, colors, randomSeeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const randomSeeds = new Float32Array(count)

    const cyan = new THREE.Color('#8fbfb4')
    const emerald = new THREE.Color('#c4a574')
    const deepBlue = new THREE.Color('#1a2a38')

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 30
      positions[i3 + 1] = -Math.random() * 10 - 0.1
      positions[i3 + 2] = (Math.random() - 0.5) * 30
      randomSeeds[i] = Math.random() * Math.PI * 2

      const depth = -positions[i3 + 1] / 10
      const col = new THREE.Color()
      if (depth < 0.25) {
        col.lerpColors(cyan, emerald, depth / 0.25)
      } else {
        col.lerpColors(emerald, deepBlue, (depth - 0.25) / 0.75)
      }

      colors[i3] = col.r
      colors[i3 + 1] = col.g
      colors[i3 + 2] = col.b
    }
    return { positions, colors, randomSeeds }
  }, [count])

  useFrame((state) => {
    if (pointsRef.current) {
      const pos = pointsRef.current.geometry.attributes.position.array
      const t = state.clock.elapsedTime
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const seed = randomSeeds[i]
        pos[i3] += Math.sin(t * 0.3 + seed) * 0.003
        pos[i3 + 1] += Math.cos(t * 0.2 + seed) * 0.002
        pos[i3 + 2] += Math.sin(t * 0.25 + seed * 1.5) * 0.003

        if (pos[i3 + 1] > 0.1) pos[i3 + 1] = -9.8
        if (pos[i3 + 1] < -10) pos[i3 + 1] = 0
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        vertexColors
        map={bubbleMap}
        alphaMap={bubbleMap}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        alphaTest={0.02}
        toneMapped={false}
      />
    </points>
  )
}

/* ══════════════════════════════════════════════════════════════
   3. AEROSPACE SATELLITE WITH DUAL SOLAR WINGS & SENSORS
   ══════════════════════════════════════════════════════════════ */
function AerospaceSatellite({ scale = 1, color = '#c4a574', orbitSpeed = 0.12, orbitRadius = 7, orbitOffset = 0 }) {
  const groupRef = useRef()
  const dishRef = useRef()
  const beaconRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime * orbitSpeed + orbitOffset
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * orbitRadius
      groupRef.current.position.z = Math.sin(t) * orbitRadius
      groupRef.current.position.y = 5.2 + Math.sin(t * 0.7) * 0.35
      groupRef.current.rotation.y = -t + Math.PI / 2
      groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.05
    }
    if (beaconRef.current) {
      const flash = Math.sin(state.clock.elapsedTime * 8) > 0.4 ? 1 : 0.1
      beaconRef.current.material.emissiveIntensity = flash * 2.5
    }
    if (dishRef.current) {
      dishRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Central Bus: Gold Foil MLI Thermal Shield */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.4, 8]} />
        <meshStandardMaterial
          color="#d4af37"
          emissive="#78350f"
          emissiveIntensity={0.25}
          metalness={0.92}
          roughness={0.22}
        />
      </mesh>

      {/* Equipment Deck (dark titanium) */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.21, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* High-Gain Parabolic Communications Dish */}
      <group ref={dishRef} position={[0, 0.32, 0]} rotation={[0.3, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.15} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#c4a574" emissive="#c4a574" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Nadir Altimeter Radar Horn */}
      <mesh position={[0, -0.26, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.09, 0.14, 8, 1, true]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.27, 0]}>
        <circleGeometry args={[0.07, 16]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Dual Photovoltaic Solar Array Wings */}
      {/* Port Wing */}
      <group position={[0.26, 0, 0]}>
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[0.42, 0, 0]}>
          <boxGeometry args={[0.42, 0.012, 0.22]} />
          <meshStandardMaterial
            color="#0b1b38"
            emissive="#1d4ed8"
            emissiveIntensity={0.35}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0.88, 0, 0]}>
          <boxGeometry args={[0.42, 0.012, 0.22]} />
          <meshStandardMaterial
            color="#0b1b38"
            emissive="#1d4ed8"
            emissiveIntensity={0.35}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Starboard Wing */}
      <group position={[-0.26, 0, 0]}>
        <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[-0.42, 0, 0]}>
          <boxGeometry args={[0.42, 0.012, 0.22]} />
          <meshStandardMaterial
            color="#0b1b38"
            emissive="#1d4ed8"
            emissiveIntensity={0.35}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[-0.88, 0, 0]}>
          <boxGeometry args={[0.42, 0.012, 0.22]} />
          <meshStandardMaterial
            color="#0b1b38"
            emissive="#1d4ed8"
            emissiveIntensity={0.35}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Blinking Navigation Beacon LED */}
      <mesh ref={beaconRef} position={[0, 0.24, 0.18]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#c4a574" emissive="#c4a574" emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   4. VOLUMETRIC LIDAR / RADAR SCANNING SWATH
   ══════════════════════════════════════════════════════════════ */
const swathVertexShader = `
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const swathFragmentShader = `
  uniform float uTime;
  uniform vec3 uBeamColor;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    float verticalFade = smoothstep(5.5, 0.05, vWorldPos.y);
    float topFade = smoothstep(5.6, 4.8, vWorldPos.y);

    float scanBand = fract(vWorldPos.y * 0.45 - uTime * 1.5);
    float pulse = smoothstep(0.0, 0.15, scanBand) * smoothstep(0.45, 0.15, scanBand);

    float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;

    float alpha = (0.02 + pulse * 0.08) * verticalFade * topFade * edge;

    vec3 col = uBeamColor + vec3(pulse * 0.35);
    gl_FragColor = vec4(col, alpha);
  }
`

export function VolumetricSwathBeam({ color = '#c4a574', orbitSpeed = 0.12, orbitRadius = 7, orbitOffset = 0 }) {
  const meshRef = useRef()
  const ringsRef = useRef()

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBeamColor: { value: new THREE.Color(color) },
  }), [color])

  useFrame((state) => {
    const t = state.clock.elapsedTime * orbitSpeed + orbitOffset
    const satX = Math.cos(t) * orbitRadius
    const satZ = Math.sin(t) * orbitRadius
    const satY = 5.2 + Math.sin(t * 0.7) * 0.35

    if (meshRef.current) {
      meshRef.current.position.set(satX, satY / 2, satZ)
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
    if (ringsRef.current) {
      ringsRef.current.position.set(satX, 0.04, satZ)
      const pulse = (state.clock.elapsedTime * 1.4) % 1.0
      ringsRef.current.scale.set(1 + pulse * 2.0, 1 + pulse * 2.0, 1)
      ringsRef.current.material.opacity = (1.0 - pulse) * 0.45
    }
  })

  return (
    <group>
      {/* Volumetric Laser Fan Swath */}
      <mesh ref={meshRef} position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.06, 1.6, 5.2, 24, 1, true]} />
        <shaderMaterial
          vertexShader={swathVertexShader}
          fragmentShader={swathFragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Surface Radar Ring Pulse at Nadir */}
      <mesh ref={ringsRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.85, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function SatelliteConstellation() {
  return (
    <group>
      {/* Flagship Sentinel-3 / Jason Altimeter Satellite */}
      <AerospaceSatellite scale={1.15} color="#c4a574" orbitSpeed={0.12} orbitRadius={7.0} orbitOffset={0} />
      <VolumetricSwathBeam color="#c4a574" orbitSpeed={0.12} orbitRadius={7.0} orbitOffset={0} />

      {/* Secondary SMOS / Aquarius Salinity Satellite */}
      <AerospaceSatellite scale={0.95} color="#8fbfb4" orbitSpeed={0.09} orbitRadius={8.8} orbitOffset={2.2} />
      <VolumetricSwathBeam color="#8fbfb4" orbitSpeed={0.09} orbitRadius={8.8} orbitOffset={2.2} />

      {/* Tertiary GHRSST Thermal Infrared Satellite */}
      <AerospaceSatellite scale={0.9} color="#d08258" orbitSpeed={0.15} orbitRadius={6.0} orbitOffset={4.1} />
      <VolumetricSwathBeam color="#d08258" orbitSpeed={0.15} orbitRadius={6.0} orbitOffset={4.1} />
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   5. UNDERWATER IN-SITU ARGO FLOAT & SUN RAYS (HERO DIVE)
   ══════════════════════════════════════════════════════════════ */
export function UnderwaterArgoProbe() {
  const probeRef = useRef()
  const pingRef = useRef()
  const beaconRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (probeRef.current) {
      probeRef.current.position.y = -2.6 + Math.sin(t * 0.8) * 0.12
      probeRef.current.rotation.y = t * 0.2
      probeRef.current.rotation.z = Math.sin(t * 0.5) * 0.05
    }
    if (pingRef.current) {
      const p = (t * 1.3) % 1.0
      pingRef.current.scale.set(1 + p * 4.5, 1 + p * 4.5, 1)
      pingRef.current.material.opacity = (1.0 - p) * 0.65
    }
    if (beaconRef.current) {
      beaconRef.current.material.emissiveIntensity = Math.sin(t * 7) > 0.3 ? 2.5 : 0.2
    }
  })

  return (
    <group ref={probeRef} position={[1.4, -2.6, 2.0]}>
      {/* Hull Yellow Body */}
      <mesh>
        <cylinderGeometry args={[0.11, 0.11, 0.75, 16]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Bottom Buoyancy Engine */}
      <mesh position={[0, -0.41, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* CTD Sensor Head */}
      <mesh position={[0, 0.41, 0]}>
        <cylinderGeometry args={[0.065, 0.085, 0.1, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.38, 8]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.95} />
      </mesh>
      {/* Beacon LED */}
      <mesh ref={beaconRef} position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#c4a574" emissive="#c4a574" emissiveIntensity={1.6} />
      </mesh>
      {/* Acoustic Sonar Ping */}
      <mesh ref={pingRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.32, 32]} />
        <meshBasicMaterial
          color="#c4a574"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

const rayVertexShader = `
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const rayFragmentShader = `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    float topFade = smoothstep(0.2, -1.0, vWorldPos.y);
    float bottomFade = smoothstep(-8.0, -2.0, vWorldPos.y);
    float shimmer = sin(vWorldPos.y * 0.8 - uTime * 1.2 + vUv.x * 6.28) * 0.2 + 0.8;
    float alpha = 0.035 * topFade * bottomFade * shimmer;
    gl_FragColor = vec4(0.72, 0.62, 0.38, alpha);
  }
`

export function UnderwaterSunRays() {
  const raysRef = useRef()
  const matRef = useRef()

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  useFrame((state) => {
    if (raysRef.current) {
      raysRef.current.rotation.y = state.clock.elapsedTime * 0.025
    }
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <group ref={raysRef} position={[0, 0, 0]}>
      {[0, 1.05, 2.09, 3.14, 4.19, 5.24].map((angle, i) => {
        const x = Math.cos(angle) * 3.8
        const z = Math.sin(angle) * 3.8
        return (
          <mesh key={i} position={[x, -4.5, z]} rotation={[0.12 * Math.sin(angle), angle, 0.12 * Math.cos(angle)]}>
            <cylinderGeometry args={[0.2, 2.8, 8.0, 16, 1, true]} />
            <shaderMaterial
              ref={matRef}
              vertexShader={rayVertexShader}
              fragmentShader={rayFragmentShader}
              uniforms={uniforms}
              transparent
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   6. CAMERA RIG WITH CINEMATIC SCROLLYTELLING DIVE
   ══════════════════════════════════════════════════════════════ */
export function CameraRig({ scrollProgress = 0 }) {
  const { camera, scene } = useThree()
  const pLerpRef = useRef(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    // Smooth dampening to absorb sudden wheel ticks
    pLerpRef.current = THREE.MathUtils.damp(pLerpRef.current, scrollProgress, 5, delta)
    const p = pLerpRef.current

    // Idle orbital drift above water, smoothly decays as dive commences
    const idleFactor = Math.max(0, 1 - p * 2.0)
    const idleX = Math.sin(t * 0.08) * idleFactor * 3.2
    const idleZ = Math.cos(t * 0.08) * idleFactor * 3.2

    let camX = idleX
    let camY = 7.8
    let camZ = 12.0
    let lookY = 0

    if (p < 0.35) {
      // Phase 1: Space Orbit -> Approaching Sea Surface
      const normP = p / 0.35
      camY = THREE.MathUtils.lerp(7.8, 1.6, normP)
      camZ = THREE.MathUtils.lerp(12.0, 7.2, normP)
      lookY = THREE.MathUtils.lerp(0, -0.2, normP)
    } else if (p < 0.70) {
      // Phase 2: Surface Penetration -> Epipelagic & Thermocline Pass
      const normP = (p - 0.35) / 0.35
      // Smooth S-curve plunge through the waves
      const plungeCurve = normP * normP * (3 - 2 * normP)
      camY = THREE.MathUtils.lerp(1.6, -2.8, plungeCurve)
      camZ = THREE.MathUtils.lerp(7.2, 4.2, plungeCurve)
      camX = idleX + Math.sin(normP * Math.PI) * 0.5
      lookY = THREE.MathUtils.lerp(-0.2, -3.2, plungeCurve)
    } else {
      // Phase 3: Deep Thermocline -> Abyssal Sensor Lock
      const normP = (p - 0.70) / 0.30
      camY = THREE.MathUtils.lerp(-2.8, -5.8, normP)
      camZ = THREE.MathUtils.lerp(4.2, 3.4, normP)
      camX = THREE.MathUtils.lerp(0.5, 0.2, normP)
      lookY = THREE.MathUtils.lerp(-3.2, -6.5, normP)
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, camX, 0.12)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, camY, 0.12)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, camZ + idleZ, 0.12)
    camera.lookAt(0, lookY, 0)

    // Dynamic underwater atmospheric fog transition
    if (scene.fog) {
      if (p > 0.40) {
        const submergeP = Math.min(1, (p - 0.40) / 0.35)
        scene.fog.near = THREE.MathUtils.lerp(15, 3, submergeP)
        scene.fog.far = THREE.MathUtils.lerp(40, 18, submergeP)
        scene.fog.color.lerpColors(new THREE.Color('#0b141c'), new THREE.Color('#071018'), submergeP)
      } else {
        scene.fog.near = 15
        scene.fog.far = 40
        scene.fog.color.set('#0b141c')
      }
    }
  })

  return null
}

/* ══════════════════════════════════════════════════════════════
   6. 3D VOLUMETRIC OCEAN COLUMN SLICER (FOR EXPLORER SECTION)
   Centered, fully framed 3D bathymetric column, dynamic depth
   laser slicing plane, and diving ARGO float probe.
   ══════════════════════════════════════════════════════════════ */
function ColumnParticles({ count = 240, width = 2.4, height = 3.0, depth = 2.4 }) {
  const pointsRef = useRef()
  const bubbleMap = useMemo(() => makeBubbleTexture(), [])
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const cyan = new THREE.Color('#c4a574')
    const deep = new THREE.Color('#1a5854')

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * width
      positions[i3 + 1] = (Math.random() - 0.5) * height
      positions[i3 + 2] = (Math.random() - 0.5) * depth

      const depthNorm = 0.5 - (positions[i3 + 1] / height)
      const col = new THREE.Color().lerpColors(cyan, deep, THREE.MathUtils.clamp(depthNorm, 0, 1))
      colors[i3] = col.r
      colors[i3 + 1] = col.g
      colors[i3 + 2] = col.b
    }
    return { positions, colors }
  }, [count, width, height, depth])

  useFrame((state) => {
    if (pointsRef.current) {
      const pos = pointsRef.current.geometry.attributes.position.array
      const t = state.clock.elapsedTime
      const halfH = height / 2
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        pos[i3 + 1] += Math.sin(t * 0.5 + i) * 0.001
        if (pos[i3 + 1] > halfH) pos[i3 + 1] = -halfH
        if (pos[i3 + 1] < -halfH) pos[i3 + 1] = halfH
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        vertexColors
        map={bubbleMap}
        alphaMap={bubbleMap}
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        alphaTest={0.02}
        toneMapped={false}
      />
    </points>
  )
}

function tempToColor(t) {
  if (t == null || !Number.isFinite(t)) return '#214f4a'
  if (t >= 28) return '#e8c98a'
  if (t >= 26) return '#c4a574'
  if (t >= 22) return '#c45c26'
  if (t >= 16) return '#6aa8a0'
  if (t >= 10) return '#2f6b64'
  return '#16343f'
}

function depthToY(depth, colH) {
  return 1.2 - (Math.min(1000, Math.max(0, depth)) / 1000) * colH
}

export function VolumetricOceanColumn({
  activeDepth = 0,
  currentTemp = 28.5,
  profile = [],
  d26 = 80,
  d20 = 140,
}) {
  const laserRef = useRef()
  const probeRef = useRef()
  const pingRef = useRef()

  const colW = 1.85
  const colH = 2.55
  const colD = 1.85
  const targetY = depthToY(activeDepth, colH)
  const sliceColor = tempToColor(currentTemp)

  const slabs = useMemo(() => {
    const pts = (profile || [])
      .filter((p) => p && Number.isFinite(p.depth) && Number.isFinite(p.predicted ?? p.observed))
      .sort((a, b) => a.depth - b.depth)
    if (pts.length < 2) return []
    const out = []
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      const y0 = depthToY(a.depth, colH)
      const y1 = depthToY(b.depth, colH)
      const h = Math.max(0.02, y0 - y1)
      const mid = (y0 + y1) / 2
      const t = a.predicted ?? a.observed
      out.push({
        key: `${a.depth}-${b.depth}`,
        y: mid,
        h,
        color: tempToColor(t),
        thermo: a.depth >= 50 && a.depth < 200,
        opacity: a.depth >= 50 && a.depth < 200 ? 0.28 : 0.16,
      })
    }
    return out
  }, [profile, colH])

  useFrame((state) => {
    if (laserRef.current) {
      laserRef.current.position.y = THREE.MathUtils.lerp(laserRef.current.position.y, targetY, 0.12)
    }
    if (probeRef.current) {
      const probeTargetY = targetY + Math.sin(state.clock.elapsedTime * 2.5) * 0.02
      probeRef.current.position.y = THREE.MathUtils.lerp(probeRef.current.position.y, probeTargetY, 0.1)
    }
    if (pingRef.current) {
      const ping = (state.clock.elapsedTime * 1.6) % 1.0
      pingRef.current.scale.set(1 + ping * 2.4, 1 + ping * 2.4, 1)
      pingRef.current.material.opacity = (1 - ping) * 0.8
    }
  })

  return (
    <group position={[0, 0.02, 0]} rotation={[0.1, 0.42, 0]} scale={0.92}>
      {/* Temperature-colored water slabs from the real profile */}
      {slabs.map((s) => (
        <mesh key={s.key} position={[0, s.y, 0]}>
          <boxGeometry args={[colW - 0.08, s.h, colD - 0.08]} />
          <meshLambertMaterial
            color={s.color}
            transparent
            opacity={Math.min(0.55, s.opacity + 0.22)}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Thermocline band */}
      <mesh position={[0, (depthToY(50, colH) + depthToY(200, colH)) / 2, 0]}>
        <boxGeometry args={[colW + 0.04, Math.abs(depthToY(50, colH) - depthToY(200, colH)), colD + 0.04]} />
        <meshBasicMaterial
          color="#c45c26"
          transparent
          opacity={0.07}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(colW, colH, colD)]} />
        <lineBasicMaterial color="#d7c4a3" transparent opacity={0.55} />
      </lineSegments>

      {/* Surface cap */}
      <mesh position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[colW, colD]} />
        <meshBasicMaterial color="#7ec8c0" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {[
        { d: 0, col: '#e8c98a', op: 0.55 },
        { d: 50, col: '#c45c26', op: 0.28 },
        { d: 200, col: '#d08258', op: 0.32 },
        { d: 500, col: '#8fbfb4', op: 0.22 },
        { d: 1000, col: '#3d4a58', op: 0.35 },
      ].map((s) => (
        <group key={s.d} position={[0, depthToY(s.d, colH), 0]}>
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(colW, colD)]} />
            <lineBasicMaterial color={s.col} transparent opacity={s.op} />
          </lineSegments>
        </group>
      ))}

      {/* D26 / D20 isotherm planes */}
      {Number.isFinite(d26) && d26 > 0 && (
        <mesh position={[0, depthToY(d26, colH), 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[colW - 0.02, colD - 0.02]} />
          <meshBasicMaterial color="#f0e642" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {Number.isFinite(d20) && d20 > 0 && (
        <mesh position={[0, depthToY(d20, colH), 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[colW - 0.06, colD - 0.06]} />
          <meshBasicMaterial color="#c45c26" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Animated Laser Slicing Plane */}
      <group ref={laserRef} position={[0, targetY, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[colW - 0.04, colD - 0.04]} />
          <meshBasicMaterial
            color={sliceColor}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Glowing Laser Border */}
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(colW - 0.04, colD - 0.04)]} />
          <lineBasicMaterial color={sliceColor} linewidth={2} />
        </lineSegments>
      </group>

      {/* Autonomous 3D ARGO Float Probe Inside Column */}
      <group ref={probeRef} position={[0.25, targetY, 0.25]}>
        {/* Float Yellow Hull */}
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.24, 16]} />
          <meshStandardMaterial color="#facc15" roughness={0.25} metalness={0.5} />
        </mesh>
        {/* Dark Bottom Buoyancy Engine Cap */}
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.03, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        {/* CTD Sensor Head */}
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.028, 0.035, 0.04, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
        </mesh>
        {/* Antenna Mast */}
        <mesh position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.12, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.9} />
        </mesh>
        {/* Glowing Telemetry Ring */}
        <mesh position={[0, 0.14, 0]}>
          <torusGeometry args={[0.045, 0.006, 8, 20]} />
          <meshBasicMaterial color={sliceColor} />
        </mesh>
        {/* Acoustic Sonar Ping */}
        <mesh ref={pingRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.11, 24]} />
          <meshBasicMaterial
            color={sliceColor}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Bounded Marine Snow Particles Strictly Inside Column */}
      <ColumnParticles count={200} width={colW - 0.15} height={colH - 0.15} depth={colD - 0.15} />
    </group>
  )
}
