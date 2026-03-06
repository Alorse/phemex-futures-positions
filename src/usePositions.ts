import { useEffect, useState } from "react";
import axios from "axios";
import { showToast, Toast, LocalStorage } from "@raycast/api";
import CryptoJS from "crypto-js";
import { AccountInfo, AccountPosition, PhemexAccountPositionsResponse } from "./types";

export function usePositions(apiKey: string, apiSecret: string) {
  const [state, setState] = useState<{
    positions: AccountPosition[];
    account?: AccountInfo;
    isLoading: boolean;
    error?: string;
  }>({
    positions: [],
    account: undefined,
    isLoading: true,
  });

  const generateSignature = (
    apiSecret: string,
    path: string,
    query: string,
    expiry: number,
    body: string = ""
  ) => {
    const message = path + query + expiry.toString() + body;
    return CryptoJS.HmacSHA256(message, apiSecret).toString();
  };

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const currency = "USDT";
        const path = "/g-accounts/positions";
        const query = `currency=${currency}`;
        const expiry = Math.floor(Date.now() / 1000) + 60;
        const signature = generateSignature(apiSecret, path, query, expiry);
        const url = `https://api.phemex.com${path}?${query}`;
        const { data } = await axios.get<PhemexAccountPositionsResponse>(url, {
          headers: {
            "x-phemex-access-token": apiKey,
            "x-phemex-request-expiry": expiry.toString(),
            "x-phemex-request-signature": signature,
          },
        });
        if (data.code !== 0) {
          throw new Error(data.msg);
        }
        setState({
          positions: data.data.positions ?? [],
          account: data.data.account,
          isLoading: false,
        });
      } catch (error) {
        let errorMsg = "Unknown error";
        if (axios.isAxiosError(error) && error.response?.data) {
          errorMsg = error.response.data.msg || JSON.stringify(error.response.data);
        } else if (error instanceof Error) {
          errorMsg = error.message;
        }
        console.error("Error fetching positions:", errorMsg);
        if (errorMsg === "Invalid API key") {
          await LocalStorage.removeItem("phemexApiKey");
        }
        setState({
          positions: [],
          isLoading: false,
          error: errorMsg,
        });
        showToast({ style: Toast.Style.Failure, title: "Error", message: errorMsg });
      }
    };

    fetchPositions();
  }, [apiKey, apiSecret]);

  return state;
}
