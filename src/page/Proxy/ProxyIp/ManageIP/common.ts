import { IProxyIp } from "@/electron/type";

export type IProtocol = {
  value: string;
  prefix: string;
};

const getListIPAndPort = (str: string): IProxyIp[] => {
  const listData: IProxyIp[] = [];

  const listIP = str?.split(",") || [];
  for (let i = 0; i < listIP?.length; i++) {
    const item = listIP[i]?.trim();
    const ip = item?.split(":")?.[0];
    const port = item?.split(":")?.[1];

    listData.push({
      ip,
      port: Number(port),
    });
  }

  return listData;
};

export { getListIPAndPort };
