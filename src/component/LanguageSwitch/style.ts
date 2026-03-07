import styled from "styled-components";

const LanguageSwitcherWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  .img-wrapper {
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.7rem;
    height: 1.7rem;
    margin-right: 0.3rem;
    overflow: hidden;
    cursor: pointer;

    img {
      width: 2.7rem;
      height: 1.7rem;
      object-fit: conver;
    }
  }
`;

const MenuIconWrapper = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;

  .img-wrapper {
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 1.6rem;
    margin-right: 1rem;
    overflow: hidden;

    img {
      width: 2.5rem;
      height: 1.6rem;
      object-fit: conver;
    }
  }
`;

export { LanguageSwitcherWrapper, MenuIconWrapper };
