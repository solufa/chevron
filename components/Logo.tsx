import styled from 'styled-components'

const StyledChevronDoubleLeft = styled.i`
  & {
    position: relative;
    box-sizing: border-box;
    display: inline-block;
    width: 22px;
    height: 22px;
    transform: translate(-15%, -50%) scale(4.5);
  }

  &::after,
  &::before {
    position: absolute;
    top: 7px;
    left: 6px;
    box-sizing: border-box;
    display: block;
    width: 8px;
    height: 8px;
    content: '';
    border-bottom: 2px solid;
    border-left: 2px solid;
    transform: rotate(45deg);
  }

  &::after {
    left: 11px;
  }
`

const StyledChevronDoubleRight = styled.i`
  & {
    position: relative;
    box-sizing: border-box;
    display: inline-block;
    width: 22px;
    height: 22px;
    transform: translate(20%, -50%) scale(4.5);
  }

  &::after,
  &::before {
    position: absolute;
    top: 7px;
    right: 6px;
    box-sizing: border-box;
    display: block;
    width: 8px;
    height: 8px;
    content: '';
    border-top: 2px solid;
    border-right: 2px solid;
    transform: rotate(45deg);
  }

  &::after {
    right: 11px;
  }
`

const BoldText = styled.span`
  font-weight: bold;
`

const LargeText = styled.span`
  font-size: 120%;
  color: #06c;
`

export const Logo = () => {
  return (
    <BoldText>
      <StyledChevronDoubleLeft /> CHE<LargeText>V</LargeText>RON <StyledChevronDoubleRight />
    </BoldText>
  )
}
