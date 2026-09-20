'use client'

import dynamic from 'next/dynamic'
import { TextsArea } from './TextsArea'

const MapArea = dynamic(() => import('./MapArea').then((module) => module.MapArea), {
  ssr: false,
})

export const Home = () => (
  <div
    className="flex h-screen flex-col bg-[url('/images/background.png')] bg-cover bg-center"
    onContextMenu={(event) => event.preventDefault()}
  >
    <TextsArea />
    <div className="relative flex-1">
      <MapArea />
    </div>
  </div>
)
