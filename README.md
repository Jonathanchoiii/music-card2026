# Music Card

用音乐传递心意 — 一个音乐贺卡生成平台。

选一首歌，挑一个视觉模板，写一句祝福语，生成一张独一无二的音乐贺卡，送给你在乎的人。

## Features

- **Spotify Music Search** — 搜索歌曲或随机推荐
- **5 Visual Templates** — 粒子星系、流光波纹、极光幻境、黑胶唱片、水晶棱镜
- **Album Color Extraction** — 自动从专辑封面提取主色调配色
- **Foldable Cover** — 3D 翻折封面，点击打开瞬间自动播放音乐 + 撒花动效
- **Customizable Cover** — 收件人名字、封面标题、祝福语、署名都可定制
- **Shareable Links** — 通过 URL 分享互动贺卡
- **Save as Image** — 接收方可保存贺卡为图片

## How the foldable card works

收件人打开 `/card#<encoded>` 链接时：

1. 一张折叠的「贺卡封面」从下方升起，使用根据专辑色生成的渐变 + album art badge + 收件人名字
2. 「Tap to open」呼吸动效提示用户点击
3. 点击后，封面以左侧为轴心 3D 翻折开启（rotateY -165°），同时撒落 60 颗彩色纸片
4. 隐藏的 `<audio>` 元素会播放 Spotify 30 秒预览（如果该曲目可用 `previewUrl`），并平滑 fade in
5. 翻折完成后，5 选 1 的视觉模板淡入显示，0.8 秒后控制栏自动滑出
6. Spotify embed 同时挂载并带 `autoplay=1` 参数，作为 30 秒预览之后的完整播放回退方案

封面字段通过 URL hash 编码（base64 JSON）：

```ts
{
  t: 'spotifyTrackId',
  tp: 'particle' | 'gradient' | 'aurora' | 'vinyl' | 'crystal',
  m?: '祝福语',
  f?: '署名',
  to?: '收件人',
  ct?: '封面标题',
}
```

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4
- **3D/Shaders**: Three.js + @react-three/fiber + @react-three/drei
- **Backend**: Express.js (Spotify auth proxy)
- **State**: Zustand
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

1. Create a [Spotify Developer App](https://developer.spotify.com/dashboard)
2. Copy the Client ID and Client Secret

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Spotify credentials

# Start development (frontend + backend)
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |

## Build

```bash
npm run build
npm run preview
```
# music-card2026
