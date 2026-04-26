import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { TemplateProps } from '../types'

function Crystal({ palette }: { palette: TemplateProps['palette'] }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [r1, g1, b1] = palette.primary
  const [r2, g2, b2] = palette.secondary

  const color1 = useMemo(() => new THREE.Color(r1 / 255, g1 / 255, b1 / 255), [r1, g1, b1])
  const color2 = useMemo(() => new THREE.Color(r2 / 255, g2 / 255, b2 / 255), [r2, g2, b2])

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.2
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.8, 1]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.5}
          chromaticAberration={0.3}
          anisotropy={0.3}
          distortion={0.5}
          distortionScale={0.3}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          color={color1}
        />
      </mesh>
      {/* Inner glow */}
      <mesh scale={0.6}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshBasicMaterial color={color2} transparent opacity={0.15} />
      </mesh>
    </Float>
  )
}

function FloatingParticles({ palette }: { palette: TemplateProps['palette'] }) {
  const count = 100
  const ref = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 10
      arr[i + 1] = (Math.random() - 0.5) * 10
      arr[i + 2] = (Math.random() - 0.5) * 10
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.05
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={new THREE.Color(palette.accent[0] / 255, palette.accent[1] / 255, palette.accent[2] / 255)}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

export default function CrystalPrism({ palette, track, message, senderName, isPreview }: TemplateProps) {
  const [r, g, b] = palette.background
  return (
    <div className="relative w-full h-full min-h-[300px]" style={{ background: `rgb(${Math.min(r, 20)},${Math.min(g, 20)},${Math.min(b, 25)})` }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color={new THREE.Color(palette.primary[0] / 255, palette.primary[1] / 255, palette.primary[2] / 255)} />
        <Crystal palette={palette} />
        <FloatingParticles palette={palette} />
        <Environment preset="night" />
      </Canvas>
      {!isPreview && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none z-10">
          <img
            src={track.albumCoverUrl}
            alt={track.albumName}
            className="w-24 h-24 rounded-xl shadow-2xl mb-4 border border-white/10"
          />
          <p className="text-white font-semibold text-lg drop-shadow-lg">{track.name}</p>
          <p className="text-white/70 text-sm drop-shadow">{track.artist}</p>
          {message && (
            <p className="text-white/90 text-center mt-4 max-w-xs px-4 italic drop-shadow">
              "{message}"
            </p>
          )}
          {senderName && (
            <p className="text-white/60 text-sm mt-2 drop-shadow">—— {senderName}</p>
          )}
        </div>
      )}
    </div>
  )
}
