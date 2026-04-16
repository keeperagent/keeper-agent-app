import axios from "axios";
import { loadAuth } from "./authSafeStorage";

const GRAPHQL_ENDPOINT = "https://api.keeperagent.com/graphql";
const REFRESH_INTERVAL_MS = 55 * 60 * 1000; // 55 minutes
const REQUEST_TIMEOUT_MS = 10_000;
const STALE_GRACE_PERIOD_MS = 2 * 60 * 60 * 1000;

const GET_USER_INFO_QUERY = `
  query {
    getUserInfo {
      data {
        tierStatus {
          pricingTier {
            price
          }
          expiredAt
        }
      }
    }
  }
`;

interface ITierStatus {
  pricingTier: { price: number } | null;
  expiredAt: string | number | null;
}

class LicenseService {
  private tierStatus: ITierStatus | null = null;
  private lastSuccessfulFetch: number = 0;
  private refreshTimer: NodeJS.Timeout | null = null;
  private _isReady: boolean = false;

  get isReady(): boolean {
    return this._isReady;
  }

  get isFreeTier(): boolean {
    if (!this.tierStatus) {
      return true;
    }

    const price = this.tierStatus?.pricingTier?.price || 0;
    const isPaid = price > 0;

    const expiredAt = Number(this.tierStatus?.expiredAt || 0);
    const isExpired = expiredAt > 0 && Date.now() > expiredAt;

    return !isPaid || isExpired;
  }

  initialize = async (): Promise<void> => {
    await this.refresh();
    this.refreshTimer = setInterval(this.refresh, REFRESH_INTERVAL_MS);
  };

  shutdown = (): void => {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.tierStatus = null;
    this._isReady = false;
  };

  onAuthChange = async (): Promise<void> => {
    this.tierStatus = null;
    this._isReady = false;
    await this.refresh();
  };

  private refresh = async (): Promise<void> => {
    try {
      const auth = loadAuth();
      if (!auth?.token) {
        this.tierStatus = null;
        this._isReady = true;
        return;
      }

      const response = await axios.post(
        GRAPHQL_ENDPOINT,
        { query: GET_USER_INFO_QUERY },
        {
          headers: {
            "Content-Type": "application/json",
            authorization: auth.token,
          },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const tierStatus =
        response.data?.data?.getUserInfo?.data?.tierStatus || null;
      this.tierStatus = tierStatus;
      this.lastSuccessfulFetch = Date.now();
    } catch {
      const isWithinGrace =
        this.lastSuccessfulFetch > 0 &&
        Date.now() - this.lastSuccessfulFetch < STALE_GRACE_PERIOD_MS;

      if (!isWithinGrace) {
        this.tierStatus = null;
      }
    } finally {
      this._isReady = true;
    }
  };
}

export const licenseService = new LicenseService();
