import { WORKFLOW_TYPE } from "@/electron/constant";
import { MESSAGE } from "@/electron/constant";
import { DescriptionWrapper } from "./style";

const getNodeContent = (workflowType: string, translate?: any) => {
  const onOpenLink = (url: string) => {
    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url,
    });
  };

  switch (workflowType) {
    // Lanch token
    case WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.launchTokenPumpfun.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.LAUNCH_TOKEN_BONKFUN: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.launchTokenBonkfun.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Ask agent
    case WORKFLOW_TYPE.ASK_AGENT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.askAgent.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GENERATE_IMAGE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.generateImage.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Swap token
    case WORKFLOW_TYPE.SWAP_JUPITER: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.swapJupiter.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SWAP_KYBERSWAP: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.swapKyberswap.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SWAP_UNISWAP: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.swapUniswap.title")}</div>
            <div className="example">
              {translate("guide.swapUniswap.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SWAP_PANCAKESWAP: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.swapPancakeswap.title")}</div>
            <div className="example">
              {translate("guide.swapPancakeswap.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SWAP_CETUS: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.swapCetus.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // On chain
    case WORKFLOW_TYPE.GET_WALLET_BALANCE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.getWalletBalance.title")}</div>

            <div className="example">
              {translate("guide.getWalletBalance.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GET_TOKEN_PRICE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.getTokenPrice.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CHECK_TOKEN_PRICE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.checkTokenPrice.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CHECK_MARKETCAP: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.checkMarketcap.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.TRANSFER_TOKEN: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.transferToken.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.approveToken.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.EVM_SNIPE_CONTRACT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.contractSniper.title")}</div>
            <div className="example">
              {translate("guide.contractSniper.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.readContract.title")}</div>
            <div className="example">
              {translate("guide.readContract.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.writeToContract.title")}</div>
            <div className="example">
              {translate("guide.writeToContract.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.EXECUTE_TRANSACTION: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.executeTransaction.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.convertDecimal.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SELECT_TOKEN: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.selectToken.title")}</div>

            <div className="example">
              {translate("guide.selectToken.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SELECT_CHAIN: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.selectChain.title")}</div>

            <div className="example">
              {translate("guide.selectChain.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GET_GAS_PRICE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.getGasPrice.title")}</div>
            <div className="example">
              {translate("guide.getGasPrice.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GET_PRIORITY_FEE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.getPriorityFee.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.generateVanityAddress.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Browser
    case WORKFLOW_TYPE.OPEN_URL: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.openUrl.openNewTab")}</div>
            <div className="example">
              {translate("guide.openUrl.example")}{" "}
              <span
                className="link"
                onClick={() => onOpenLink("https://app.uniswap.org/")}
              >
                https://app.uniswap.org/
              </span>{" "}
              {translate("or")}{" "}
              <span
                className="link"
                onClick={() => onOpenLink("https://chainlist.org")}
              >
                https://chainlist.org
              </span>{" "}
              {translate("guide.openUrl.openAnyWeb")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SWITCH_WINDOW: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.switchWindow.desc1")}</div>

            <div className="example">
              {translate("guide.switchWindow.desc2")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.TYPE_TEXT: {
      return {
        description: (
          <DescriptionWrapper>
            <div> {translate("guide.typeText.title")}</div>
            <div className="example">{translate("guide.typeText.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CLICK: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.click.title")}</div>
            <div className="example">{translate("guide.click.desc")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.NEW_TAB: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.newTab.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SELECT_TAB: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.selectTab.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CLOSE_TAB: {
      return {
        description: (
          <DescriptionWrapper>
            <div> {translate("guide.closeTab.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GO_BACK: {
      return {
        description: (
          <DescriptionWrapper>
            <div> {translate("guide.goBack.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.RELOAD_PAGE: {
      return {
        description: (
          <DescriptionWrapper>
            <div> {translate("guide.reload.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SCROLL: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.scroll.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CRAWL_TEXT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.crawl.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CHECK_ELEMENT_EXIST: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.elementExist.title")}</div>
            <div className="example">
              {translate("guide.elementExist.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    // Adnvanced
    case WORKFLOW_TYPE.SAVE_LOG: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.saveHistory.title")}</div>

            <div className="example">
              {translate("guide.saveHistory.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CHECK_CONDITION: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.checkCondition.title")}</div>

            <div className="example">
              {translate("guide.checkCondition.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GET_RANDOM_VALUE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.getRandomValue.title")}</div>

            <div className="example">
              {translate("guide.getRandomValue.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.RANDOM_ON_OFF: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.randomOnOff.title")}</div>

            <div className="example">
              {translate("guide.randomOnOff.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SET_ATTRIBUTE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.setAttribute.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CALCULATE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.calculate.title")}</div>

            <div className="example">
              {translate("guide.calculate.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.HTTP_REQUEST: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.httpRequest.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.EXECUTE_CODE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.executeCode.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Rabby wallet
    case WORKFLOW_TYPE.IMPORT_RABBY_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.importRabby.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.UNLOCK_RABBY_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.unlockRabby.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CONNECT_RABBY_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.connectRabby.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CANCEL_RABBY_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.cancelRabby.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SIGN_RABBY_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.signAndSubmit.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.addNetworkRabby.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Phantom wallet
    case WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.importPhantom.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.unlockPhantom.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.connectPhantom.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.confirmPhantom.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Martian wallet
    case WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.importMartian.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.unlockMartian.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.approveMartian.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.switchMartian.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Metamask wallet
    case WORKFLOW_TYPE.IMPORT_METAMASK_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.importMetamask.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.unlockMetamask.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CONNECT_METAMASK_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.connectMetamask.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.APPROVE_METAMASK_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.approveMetamask.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.confirmMetamask.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CANCEL_METAMASK_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.cancelMetamask.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Twitter
    case WORKFLOW_TYPE.LOGIN_TWITTER: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.loginTwitter.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.FOLLOW_TWITTER: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.followTwitter.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.LIKE_TWITTER: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.likeTweet.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.RETWEET_TWITTER: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.reTweet.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.REPLY_TWITTER: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.replyTweet.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Telegram
    case WORKFLOW_TYPE.SEND_TELEGRAM: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.sendTelegram.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SNIPE_TELEGRAM: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.snipeTelegram.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    // Others
    case WORKFLOW_TYPE.UPDATE_PROFILE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.updateProfile.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.ON_OFF_PROFILE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.offOffProfile.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.GENERATE_PROFILE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.generateProfile.title")}</div>

            <div className="example">
              {translate("guide.generateProfile.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.LOOP: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.workflowType.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SOLVE_CAPTCHA: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.solveCaptcha.title")}</div>

            <div className="example">
              {translate("guide.solveCaptcha.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SAVE_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div> {translate("guide.saveWallet.saveWallet")}</div>
            <div className="example">
              {translate("guide.saveWallet.example")}
            </div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SELECT_WALLET: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.checkWallet.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.SAVE_RESOURCE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.resource.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.CHECK_RESOURCE: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.checkResource.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.STOP_SCRIPT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.stopWorkflow.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    case WORKFLOW_TYPE.COMMENT: {
      return {
        description: (
          <DescriptionWrapper>
            <div>{translate("guide.note.title")}</div>
          </DescriptionWrapper>
        ),
      };
    }

    default:
      return {
        description: "",
      };
  }
};

export { getNodeContent };
