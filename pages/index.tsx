import Head from 'next/head'
import { MapArea } from '../components/MapArea'
import { TextsArea } from '../components/TextsArea'

export default function Home() {
  return (
    <div
      className="flex h-screen flex-col bg-[url('/images/background.png')] bg-cover bg-center"
      onContextMenu={(event) => event.preventDefault()}
    >
      <Head>
        <title>{'<< CHEVRON >> | People Flow OpenData Platform'}</title>
        <meta name="description" content="<< CHEVRON >> | People Flow OpenData Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TextsArea />
      <div className="relative flex-1">
        <MapArea />
      </div>
    </div>
  )
}
