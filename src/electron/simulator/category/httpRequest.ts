import axios, { AxiosProxyConfig, AxiosRequestConfig, Method } from "axios";
import { logEveryWhere } from "@/electron/service/util";
import { IKeyValue } from "@/electron/type";

class HttpRequest {
  callAPI = async (
    method: string,
    url: string,
    requestBody: any,
    headers: IKeyValue[],
    params: IKeyValue[],
    timeout: number,
    proxy?: AxiosProxyConfig,
  ): Promise<[string | null, Error | null]> => {
    try {
      const requestHeaders = headers.reduce(
        (acc: { [key: string]: string }, curr) => {
          acc[curr.key] = String(curr.value);
          return acc;
        },
        {},
      );

      const queryParams = params.reduce(
        (acc: { [key: string]: string }, curr) => {
          acc[curr.key] = String(curr.value);
          return acc;
        },
        {},
      );

      const config: AxiosRequestConfig = {
        method: method as Method,
        url: url,
        data: requestBody,
        headers: requestHeaders,
        params: queryParams,
        timeout,
        proxy,
      };

      const response = await axios(config);
      const responseData = JSON.stringify(response?.data, null, 4);
      return [responseData, null];
    } catch (err: any) {
      logEveryWhere({ message: `callAPI() error: ${err?.message ?? err}` });
      return [null, err];
    }
  };
}

export { HttpRequest };
