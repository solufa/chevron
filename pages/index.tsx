import type { NextPage } from 'next'
import Head from 'next/head'
import styled from 'styled-components'
import { MapArea } from '../components/MapArea'
import { TextsArea } from '../components/TextsArea'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: center/cover url('images/background.png');
`

const MainContainer = styled.div`
  position: relative;
  flex: 1;
`

const Home: NextPage = () => {
  return (
    <Container onContextMenu={(e) => e.preventDefault()}>
      <Head>
        <title>{'<< CHEVRON >> | People Flow OpenData Platform'}</title>
        <meta name="description" content="<< CHEVRON >> | People Flow OpenData Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <TextsArea />

      <MainContainer>
        <MapArea />
      </MainContainer>
    </Container>
  )
}

export default Home
