import { IStaticProxy } from "@/electron/type";

export type IProtocol = {
  value: string;
  prefix: string;
};

const getListIPAndPort = (str: string): IStaticProxy[] => {
  const listData: IStaticProxy[] = [];

  const listIP = str?.split(",") || [];
  for (let i = 0; i < listIP?.length; i++) {
    const item = listIP[i]?.trim();
    const parts = item?.split(":");
    const ip = parts?.[0];
    const port = parts?.[1];
    const username = parts?.[2];
    const password = parts?.[3];

    listData.push({
      ip,
      port: Number(port),
      username: username || undefined,
      password: password || undefined,
    });
  }

  return listData;
};

export { getListIPAndPort };
