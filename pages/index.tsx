import type { NextPage } from 'next'
import Head from 'next/head'
import styled from 'styled-components'
import { Logo } from '../components/Logo'
import { MapArea } from '../components/MapArea'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const Texts = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0 16px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 4rem;
  line-height: 1.15;
  text-align: center;

  a {
    color: #0070f3;
    text-decoration: none;
  }

  a:hover,
  a:focus,
  a:active {
    text-decoration: underline;
  }
`

const Description = styled.p`
  font-size: 1.5rem;
  line-height: 1.5;
  text-align: center;
`

const MapContainer = styled.div`
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

      <Texts>
        <Title>
          <Logo />
        </Title>

        <Description>People Flow OpenData Platform</Description>
      </Texts>

      <MapContainer>
        <MapArea />
      </MapContainer>
    </Container>
  )
}

export default Home
