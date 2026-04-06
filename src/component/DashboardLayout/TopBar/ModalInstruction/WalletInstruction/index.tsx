import { useMemo } from "react";
import { RootState } from "@/redux/store";
import { connect } from "react-redux";
import HoverLink from "@/component/HoverLink";
import { useTranslation } from "@/hook";
import createWalletEnLightImg from "@/asset/create-wallet-en-light.png";
import createWalletEnDarkImg from "@/asset/create-wallet-en-dark.png";
import { LOCALE } from "@/language";
import { WALLET_VARIABLE } from "@/electron/constant";
import { Wrapper } from "./style";

type IProps = {
  isLightMode: boolean;
};

const WalletInstruction = (props: IProps) => {
  const { isLightMode } = props;
  const { locale } = useTranslation();

  const img = useMemo(() => {
    if (isLightMode) {
      return locale === LOCALE.EN
        ? createWalletEnLightImg
        : createWalletEnLightImg;
    }

    return locale === LOCALE.EN ? createWalletEnDarkImg : createWalletEnDarkImg;
  }, [isLightMode, locale]);

  const enContent = () => (
    <Wrapper>
      <div className="item">
        You can import existing wallets or use the feature{" "}
        <span className="highlight-text bold">Auto create</span>,{" "}
        <span className="highlight-text bold">From Phrase</span>.
      </div>

      <div className="item">
        KeeperAgent use the library{" "}
        <HoverLink
          prefixString=""
          postString=""
          textLink="ethers"
          link="https://github.com/ethers-io/ethers.js"
          isOpenNewTab={true}
        />
        , a very popular opensource library for interacting with blockchain. You
        can see the wallet creation logic{" "}
        <HoverLink
          prefixString=""
          postString=""
          textLink="here"
          link="https://github.com/ethers-io/ethers.js"
          isOpenNewTab={true}
        />
        .
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        Feature <span className="highlight-text bold">From Phrase</span> helps
        you get wallet information or create new wallets from an existing seed
        phrase. Just like in Metamask (a type of{" "}
        <HoverLink
          prefixString=""
          postString=""
          textLink="HD wallet"
          link="https://cointelegraph.com/explained/what-are-hierarchical-deterministic-hd-crypto-wallets"
          isOpenNewTab={true}
        />{" "}
        ), from the same seed phrase, you can create many different wallets.
      </div>

      <div className="image">
        <img src={img} alt="" />
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        All data, wallet creation operations are run and saved locally on your
        computer. KeeperAgent does not save any information about the wallets you
        import, nor does it know anything about the wallets you create. The mass
        wallet creation function only supports blockchains of the EVM type
        (Ethereum, Arbitrum, BNB chain, ...)
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        When saving your wallet, you should use an{" "}
        <span className="bold">Encrypt key</span>. When an encrypt key is set, the
        data will go through an encryption step before being saved to your
        computer. So if someone sees or gets information from your computer,
        they only get the encrypted data, and they can't see the original data,
        so your wallet information will be safe.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        Each wallet will create 3 variables, which will later be used in the
        Workflow: <strong>{WALLET_VARIABLE.WALLET_ADDRESS}</strong>,{" "}
        <strong>{WALLET_VARIABLE.WALLET_PHRASE}</strong>,{" "}
        <strong>{WALLET_VARIABLE.WALLET_PRIVATE_KEY}</strong>
      </div>

      <div className="item" style={{ marginTop: "2rem" }}>
        You download the sample file
        <HoverLink
          prefixString=""
          postString=""
          textLink="here"
          link="https://keeper-agent-app-public.s3.us-east-1.amazonaws.com/sample_wallet.xlsx"
          isOpenNewTab={true}
        />
      </div>
    </Wrapper>
  );

  return locale === LOCALE.EN ? enContent() : enContent();
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
  }),
  {}
)(WalletInstruction);
