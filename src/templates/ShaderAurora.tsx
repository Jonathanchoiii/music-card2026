import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { TemplateProps } from '../types'

const auroraVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const auroraFragment = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uResolution;
varying vec2 vUv;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.3;
  
  float n1 = snoise(vec2(uv.x * 3.0 + t, uv.y * 1.5 + t * 0.5));
  float n2 = snoise(vec2(uv.x * 2.0 - t * 0.7, uv.y * 2.0 + t * 0.3));
  float n3 = snoise(vec2(uv.x * 4.0 + t * 0.5, uv.y * 3.0 - t * 0.2));
  
  // Aurora bands
  float band1 = smoothstep(0.0, 0.15, abs(sin(uv.y * 6.0 + n1 * 2.0 + t))) * 
                 smoothstep(1.0, 0.3, uv.y);
  float band2 = smoothstep(0.0, 0.1, abs(sin(uv.y * 8.0 + n2 * 3.0 + t * 1.3))) * 
                 smoothstep(1.0, 0.4, uv.y);
  float band3 = smoothstep(0.0, 0.12, abs(sin(uv.y * 5.0 + n3 * 2.5 + t * 0.8))) * 
                 smoothstep(0.9, 0.2, uv.y);
  
  vec3 aurora = uColor1 * band1 * 0.6 + 
                uColor2 * band2 * 0.5 + 
                uColor3 * band3 * 0.4;
  
  // Add glow
  aurora += uColor1 * smoothstep(0.8, 0.2, uv.y) * 0.1;
  
  // Dark sky background
  vec3 sky = mix(vec3(0.02, 0.02, 0.06), vec3(0.05, 0.02, 0.1), uv.y);
  
  // Stars
  float star = pow(snoise(uv * 50.0), 20.0) * smoothstep(0.5, 1.0, uv.y) * 0.5;
  sky += vec3(star);
  
  vec3 finalColor = sky + aurora;
  gl_FragColor = vec4(finalColor, 1.0);
}
`

function AuroraPlane({ palette }: { palette: TemplateProps['palette'] }) {
  const meshRef = useRef<THREE.Mesh>(null!)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(palette.primary[0] / 255, palette.primary[1] / 255, palette.primary[2] / 255) },
      uColor2: { value: new THREE.Color(palette.secondary[0] / 255, palette.secondary[1] / 255, palette.secondary[2] / 255) },
      uColor3: { value: new THREE.Color(palette.accent[0] / 255, palette.accent[1] / 255, palette.accent[2] / 255) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }),
    [palette]
  )

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        vertexShader={auroraVertex}
        fragmentShader={auroraFragment}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default function ShaderAurora({ palette, track, message, senderName, isPreview }: TemplateProps) {
  return (
    <div className="relative w-full h-full min-h-[300px] bg-[#050510]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <AuroraPlane palette={palette} />
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
