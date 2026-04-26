/// <reference types="vite/client" />

declare module '*.glsl' {
  const value: string
  export default value
}
declare module '*.vert' {
  const value: string
  export default value
}
declare module '*.frag' {
  const value: string
  export default value
}
declare module 'colorthief' {
  export default class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): [number, number, number]
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): Array<[number, number, number]>
  }
}
