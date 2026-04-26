import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Create from './pages/Create'
import View from './pages/View'
import Bloom from './pages/Bloom'

const Book3DGallery = lazy(() => import('./pages/Book3DGallery'))

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/card" element={<View />} />
        <Route path="/bloom" element={<Bloom />} />
        <Route
          path="/book"
          element={
            <Suspense fallback={<div className="p-6 text-center text-sm text-neutral-500">加载中…</div>}>
              <Book3DGallery />
            </Suspense>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}
