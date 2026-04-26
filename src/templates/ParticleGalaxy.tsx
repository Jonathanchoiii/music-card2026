import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { TemplateProps } from '../types'

function rgbToVec3(c: [number, number, number]): THREE.Color {
  return new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255)
}

const vertexShader = `
uniform float uTime;
uniform float uSize;
attribute float aScale;
attribute vec3 aRandomness;
varying vec3 vColor;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float angle = atan(modelPosition.x, modelPosition.z);
  float distanceToCenter = length(modelPosition.xz);
  float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
  angle += angleOffset;
  modelPosition.x = cos(angle) * distanceToCenter;
  modelPosition.z = sin(angle) * distanceToCenter;

  modelPosition.xyz += aRandomness * sin(uTime * 0.5 + distanceToCenter);

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  gl_PointSize = uSize * aScale * (1.0 / -viewPosition.z);

  vColor = color;
}
`

const fragmentShader = `
varying vec3 vColor;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;

  float strength = 1.0 - (d * 2.0);
  strength = pow(strength, 1.5);

  vec3 finalColor = vColor * strength;
  gl_FragColor = vec4(finalColor, strength);
}
`

function Particles({ palette }: { palette: TemplateProps['palette'] }) {
  const pointsRef = useRef<THREE.Points>(null!)
  const count = 5000
  const radius = 5

  const { positions, colors, scales, randomness } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const randomness = new Float32Array(count * 3)

    const color1 = rgbToVec3(palette.primary)
    const color2 = rgbToVec3(palette.secondary)
    const color3 = rgbToVec3(palette.accent)
    const mixedColor = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const r = Math.random() * radius
      const spinAngle = r * 3
      const branchAngle = ((i % 3) / 3) * Math.PI * 2

      positions[i3] = Math.cos(branchAngle + spinAngle) * r
      positions[i3 + 1] = (Math.random() - 0.5) * 0.5 * r * 0.3
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r

      const randomRadius = Math.pow(Math.random(), 3) * r * 0.5
      randomness[i3] = (Math.random() - 0.5) * randomRadius
      randomness[i3 + 1] = (Math.random() - 0.5) * randomRadius
      randomness[i3 + 2] = (Math.random() - 0.5) * randomRadius

      const mixRatio = r / radius
      if (mixRatio < 0.33) mixedColor.copy(color1).lerp(color2, mixRatio * 3)
      else if (mixRatio < 0.66) mixedColor.copy(color2).lerp(color3, (mixRatio - 0.33) * 3)
      else mixedColor.copy(color3).lerp(color1, (mixRatio - 0.66) * 3)

      colors[i3] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b

      scales[i] = Math.random()
    }

    return { positions, colors, scales, randomness }
  }, [palette])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 30 * window.devicePixelRatio },
    }),
    []
  )

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aRandomness" args={[randomness, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent
      />
    </points>
  )
}

export default function ParticleGalaxy({ palette, track, message, senderName, isPreview }: TemplateProps) {
  const [r, g, b] = palette.background
  return (
    <div className="relative w-full h-full min-h-[300px]" style={{ background: `rgb(${r},${g},${b})` }}>
      <Canvas
        camera={{ position: [0, 3, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Particles palette={palette} />
      </Canvas>
      {!isPreview && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none z-10">
          <img
            src={track.albumCoverUrl}
            alt={track.albumName}
            className="w-24 h-24 rounded-xl shadow-2xl mb-4"
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
