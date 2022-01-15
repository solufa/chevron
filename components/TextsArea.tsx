import styled from 'styled-components'
import { Logo } from '../components/Logo'

const Texts = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0 16px;
`

const Title = styled.div`
  font-size: 4rem;
  line-height: 1.15;
  transform: scale(1.5);
`

const Description = styled.p`
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1.5;
  text-align: center;
`

export const TextsArea = () => {
  return (
    <Texts>
      <Title>
        <Logo />
      </Title>

      <Description>人流データプラットフォーム</Description>
    </Texts>
  )
}
