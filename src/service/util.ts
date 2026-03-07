import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import debankImg from "@/asset/debank.svg";
import suiImg from "@/asset/chain/sui.png";
import aptosImg from "@/asset/chain/aptos.png";
import ethImg from "@/asset/chain/eth.png";
import solImg from "@/asset/chain/sol.svg";
import {
  CHAIN_TYPE,
  PORTFOLIO_APP,
  PORTFOLIO_APP_URL,
  CHAIN_TYPE_NAME_EN,
} from "@/electron/constant";
import { LOCALE } from "@/language";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const formatTime = (timestamp: number, _locale?: string) => {
  const currentTime = new Date().getTime();
  const oneDayDuration = 24 * 60 * 60 * 1000;

  if (currentTime - timestamp < oneDayDuration) {
    return dayjs(timestamp).fromNow();
  }

  return dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");
};

const formatTimeToDate = (timestamp: number) => {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");
};

const formatDurationBetween = (startTime: number, endTime: number): string => {
  const dur = dayjs.duration(dayjs(endTime).diff(dayjs(startTime)));
  const parts: string[] = [];
  const years = dur.years();
  const months = dur.months();
  const days = dur.days();
  const hours = dur.hours();
  const minutes = dur.minutes();
  const seconds = dur.seconds();

  if (years) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }
  if (months) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }
  if (days) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }
  if (hours) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (minutes) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }
  if (seconds) {
    parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }
  return parts.join(" ") || "0 seconds";
};

export const sleep = async (millisecond: number) => {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
};

const getTranslateContent = (content: string, locale?: string): string => {
  if (!content) {
    return "";
  }

  const contentPair = content?.split("-");

  if (locale === LOCALE.EN) {
    return contentPair?.[1]?.trim() || contentPair?.[0]?.trim();
  } else {
    return contentPair?.[0]?.trim();
  }
};

const getMoneyString = (amount: string | number) => {
  if (!amount) {
    return 0;
  }

  if (isNaN(Number(amount))) {
    return amount;
  }

  amount = Number(amount);
  if (amount > 10000) {
    amount = amount?.toFixed(0);
  } else if (amount > 1000) {
    amount = amount?.toFixed(1);
  } else if (amount > 100) {
    amount = amount?.toFixed(2);
  } else if (amount > 10) {
    amount = amount?.toFixed(3);
  } else if (amount > 1) {
    amount = amount?.toFixed(5);
  }

  return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const updateItemInList = (indexOfData: number, listData: any[], data?: any) => {
  const tempListData = [...listData];

  if (indexOfData !== -1) {
    tempListData.splice(indexOfData, 1, data);
  }

  return tempListData;
};

const deleteItemInList = (indexOfData: number, listData: any[]) => {
  const tempListData = [...listData];

  if (indexOfData !== -1) {
    tempListData.splice(indexOfData, 1);
  }

  return tempListData;
};

const addItemAtIndex = (indexOfData: number, listData: any[], data?: any) => {
  const tempListData = [...listData];

  if (indexOfData !== -1) {
    tempListData.splice(indexOfData, 0, data);
  }

  return tempListData;
};

const trimText = (str: string, maxLength: number) => {
  return str.length <= maxLength ? str : `${str?.slice(0, maxLength)}...`;
};

const formatByte = (bytes: number) => {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + " KB";
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }
};

const getChainImg = (chainType: string): string => {
  let image = "";
  if (chainType === CHAIN_TYPE.EVM) {
    image = ethImg;
  } else if (chainType === CHAIN_TYPE.APTOS) {
    image = aptosImg;
  } else if (chainType === CHAIN_TYPE.SUI) {
    image = suiImg;
  } else if (chainType === CHAIN_TYPE.SOLANA) {
    image = solImg;
  }

  return image;
};

const getPortfolioAppImg = (portfolioApp: string): string => {
  let image = "";
  if (portfolioApp === PORTFOLIO_APP.DEBANK) {
    image = debankImg;
  } else if (portfolioApp === PORTFOLIO_APP.SUI_VISION) {
    image = suiImg;
  } else if (portfolioApp === PORTFOLIO_APP.APTOS_EXPLORER) {
    image = aptosImg;
  } else if (portfolioApp === PORTFOLIO_APP.SOL_SCAN) {
    image = solImg;
  }

  return image;
};

const getPortfolioAppUrl = (
  walletAddress: string,
  portfolioApp: string,
): string => {
  let url = "";

  if (portfolioApp === PORTFOLIO_APP.DEBANK) {
    url = `${PORTFOLIO_APP_URL[portfolioApp]}/profile/${walletAddress}`;
  } else if (portfolioApp === PORTFOLIO_APP.SUI_VISION) {
    url = `${PORTFOLIO_APP_URL[portfolioApp]}/account/${walletAddress}`;
  } else if (portfolioApp === PORTFOLIO_APP.APTOS_EXPLORER) {
    url = `${PORTFOLIO_APP_URL[portfolioApp]}/account/${walletAddress}/coins?network=mainnet`;
  } else if (portfolioApp === PORTFOLIO_APP.SOL_SCAN) {
    url = `${PORTFOLIO_APP_URL[portfolioApp]}/account/${walletAddress}`;
  }

  return url;
};

export type IChainConfig = {
  name: string;
  image: string;
  key: CHAIN_TYPE;
};
const getChainConfig = (locale: string): IChainConfig[] => {
  return [
    {
      name:
        locale === LOCALE.EN
          ? CHAIN_TYPE_NAME_EN[CHAIN_TYPE.EVM]
          : CHAIN_TYPE_NAME_EN[CHAIN_TYPE.EVM],
      image: ethImg,
      key: CHAIN_TYPE.EVM,
    },
    {
      name:
        locale === LOCALE.EN
          ? CHAIN_TYPE_NAME_EN[CHAIN_TYPE.SOLANA]
          : CHAIN_TYPE_NAME_EN[CHAIN_TYPE.SOLANA],
      image: solImg,
      key: CHAIN_TYPE.SOLANA,
    },
    {
      name:
        locale === LOCALE.EN
          ? CHAIN_TYPE_NAME_EN[CHAIN_TYPE.APTOS]
          : CHAIN_TYPE_NAME_EN[CHAIN_TYPE.APTOS],
      image: aptosImg,
      key: CHAIN_TYPE.APTOS,
    },
    {
      name:
        locale === LOCALE.EN
          ? CHAIN_TYPE_NAME_EN[CHAIN_TYPE.SUI]
          : CHAIN_TYPE_NAME_EN[CHAIN_TYPE.SUI],
      image: suiImg,
      key: CHAIN_TYPE.SUI,
    },
  ];
};

export {
  formatTime,
  formatTimeToDate,
  formatDurationBetween,
  getTranslateContent,
  getMoneyString,
  updateItemInList,
  deleteItemInList,
  addItemAtIndex,
  trimText,
  formatByte,
  getPortfolioAppImg,
  getPortfolioAppUrl,
  getChainImg,
  getChainConfig,
};
