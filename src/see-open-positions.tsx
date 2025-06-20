import { List, showToast, Toast, Color, ActionPanel, Action, getPreferenceValues } from "@raycast/api";
import axios from "axios";
import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

interface Trade {
  createdAt: number;
  symbol: string;
  currency: string;
  execQtyRq: string;
  execPriceRp: string;
  side: number;
  orderQtyRq: string;
  priceRp: string;
  execValueRv: string;
  execFeeRv: string;
  execId: string;
}

interface PhemexTradeResponse {
  code: number;
  msg: string;
  data: Trade[];
}

interface AccountPosition {
  symbol: string;
  currency: string;
  side: string;
  leverageRr: string;
  sizeRq: string;
  valueRv: string;
  avgEntryPriceRp: string;
  markPriceRp: string;
  unRealisedPnlRv: string;
  posSide: string;
  posMode: string;
}

interface PhemexAccountPositionsResponse {
  code: number;
  msg: string;
  data: {
    positions: AccountPosition[];
  };
}

export default function Command() {
  const preferences = getPreferenceValues<{ apiKey: string; apiSecret: string }>();

  if (!preferences.apiKey || !preferences.apiSecret) {
    showToast({
      style: Toast.Style.Failure,
      title: "Credenciales requeridas",
      message: "Por favor configura tu API Key y Secret en las preferencias de la extensión.",
    });
    return (
      <List isLoading={false} searchBarPlaceholder="Configura tus credenciales en las preferencias de la extensión." />
    );
  }

  const [state, setState] = useState<{
    positions: AccountPosition[];
    isLoading: boolean;
    error?: string;
  }>({
    positions: [],
    isLoading: true,
  });

  const generateSignature = (apiSecret: string, path: string, query: string, expiry: number, body: string = "") => {
    // La firma es HMAC_SHA256(path + query + expiry + body)
    const message = path + query + expiry.toString() + body;
    return CryptoJS.HmacSHA256(message, apiSecret).toString();
  };

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const apiKey = preferences.apiKey;
        const apiSecret = preferences.apiSecret;
        const currency = "USDT";
        const path = "/g-accounts/positions";
        const query = `currency=${currency}`;
        const expiry = Math.floor(Date.now() / 1000) + 60;
        const body = "";
        const signature = generateSignature(apiSecret, path, query, expiry, body);
        const url = `https://api.phemex.com${path}?${query}`;
        const { data } = await axios.get<PhemexAccountPositionsResponse>(
          url,
          {
            headers: {
              "x-phemex-access-token": apiKey,
              "x-phemex-request-expiry": expiry.toString(),
              "x-phemex-request-signature": signature,
            },
          }
        );
        console.log("Response data:", data);
        if (data.code !== 0) {
          throw new Error(data.msg);
        }
        let positions: AccountPosition[] = [];
        if (data.data && Array.isArray(data.data.positions)) {
          positions = data.data.positions;
        }
        setState({
          positions,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching positions:", error);
        let errorMsg = "Error desconocido";
        if (axios.isAxiosError(error) && error.response && error.response.data) {
          errorMsg = error.response.data.msg || JSON.stringify(error.response.data);
        } else if (error instanceof Error) {
          errorMsg = error.message;
        }
        setState({
          positions: [],
          isLoading: false,
          error: errorMsg,
        });
      }
    };
    fetchPositions();
  }, []);

  useEffect(() => {
    if (state.error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: state.error,
      });
    }
  }, [state.error]);

  // Calcular sumatoria total de PNL no realizado
  const totalPnl = state.positions
    .filter((pos) => pos.symbol && pos.sizeRq && pos.side !== "None")
    .reduce((acc, pos) => acc + parseFloat(pos.unRealisedPnlRv || "0"), 0);
  const totalPnlColor = totalPnl >= 0 ? Color.Green : Color.Red;

  return (
    <List isLoading={state.isLoading} searchBarPlaceholder="Filtra por símbolo o lado">
      <List.Section
        title={`Total PNL: ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(4)}`}
        subtitle="Suma de PNL no realizado"
      >
        <List.Item
          key="total-pnl"
          title="Total PNL"
          accessories={[
            {
              tag: {
                value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(4)}`,
                color: totalPnlColor,
              },
            },
          ]}
        />
      </List.Section>
      <List.Section title="Posiciones abiertas">
        {state.positions
          .filter((pos) => pos.symbol && pos.sizeRq && pos.side !== "None")
          .map((pos) => {
            const pnl = parseFloat(pos.unRealisedPnlRv || "0");
            const pnlColor = pnl >= 0 ? Color.Green : Color.Red;
            return (
              <List.Item
                key={`${pos.symbol}-${pos.posSide}`}
                title={pos.symbol}
                subtitle={`${pos.side} ${pos.sizeRq}`}
                accessories={[
                  {
                    tag: {
                      value: `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)}`,
                      color: pnlColor,
                    },
                  },
                  { text: `Entry: ${pos.avgEntryPriceRp}` },
                  { text: `Mark: ${pos.markPriceRp}` },
                  { text: `Leverage: ${pos.leverageRr}` },
                  { text: `Mode: ${pos.posMode}` },
                ]}
                actions={
                  <ActionPanel>
                    <Action.OpenInBrowser
                      title="Open in Phemex"
                      url={`https://phemex.com/trade/${pos.symbol}`}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>
    </List>
  );
}