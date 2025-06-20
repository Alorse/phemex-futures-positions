import { List, showToast, Toast, Color, ActionPanel, Action, getPreferenceValues, Detail } from "@raycast/api";
import axios from "axios";
import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

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
  crossMargin?: boolean;
  usedBalanceRv?: string;
  cumClosedPnlRv?: string;
  liquidationPriceRp?: string;
  bankruptPriceRp?: string;
  assignedPosBalanceRv?: string;
  positionMarginRv?: string;
  cumFundingFeeRv?: string;
  cumTransactFeeRv?: string;
}

interface AccountInfo {
  currency: string;
  accountBalanceRv: string;
  totalUsedBalanceRv: string;
}

interface PhemexAccountPositionsResponse {
  code: number;
  msg: string;
  data: {
    account: AccountInfo;
    positions: AccountPosition[];
  };
}

function PositionDetail({ pos, pnl, pnlPercent, leverageLabel }: {
  pos: AccountPosition;
  pnl: number;
  pnlPercent: number;
  leverageLabel: string;
}) {
  const isLong = pos.side === "Buy";
  const pnlEmoji = pnl >= 0 ? "🟢" : "🔴";
  const sideLabel = isLong ? "Long" : "Short";
  const leverageEmoji = pos.crossMargin ? "⚖️" : "🎚️";

  return (
    <Detail
      navigationTitle={`${pos.symbol} (${sideLabel})`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Side" text={sideLabel} icon={isLong ? "⬆️" : "⬇️"} />
          <Detail.Metadata.Label title="Size" text={Number(pos.sizeRq).toString()} />
          <Detail.Metadata.Label title="Entry Price" text={Number(pos.avgEntryPriceRp).toFixed(4)} />
          <Detail.Metadata.Label title="Mark Price" text={Number(pos.markPriceRp).toFixed(4)} />
          <Detail.Metadata.Label title="Leverage" text={`${leverageEmoji} ${leverageLabel}`} />
          <Detail.Metadata.Label title="Margin" text={`${pos.usedBalanceRv ? Number(pos.usedBalanceRv).toFixed(4) : "-"} ${pos.currency}`} />
        </Detail.Metadata>
      }
      markdown={`| ${pos.symbol} | ${pnlEmoji} ${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} (${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%) |\n|---|---|\n| **Realized PNL** | ${Number(pos.cumClosedPnlRv || 0).toFixed(4)} |\n| **Liquidation Price** | ${Number(pos.liquidationPriceRp || 0).toFixed(4)} |\n| **Assigned Balance** | ${Number(pos.assignedPosBalanceRv || 0).toFixed(4)} |\n| **Position Margin** | ${Number(pos.positionMarginRv || 0).toFixed(4)} |\n| **Fees** | ${Number(pos.cumFundingFeeRv || 0).toFixed(4)} (funding), ${Number(pos.cumTransactFeeRv || 0).toFixed(4)} (transact) |\n| **Mode** | ${pos.posMode} |\n`}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open in Phemex" url={`https://phemex.com/trade/${pos.symbol}`} />
          <Action.CopyToClipboard title="Copy Symbol" content={pos.symbol} />
          <Action.CopyToClipboard title="Copy Position Size" content={Number(pos.sizeRq).toString()} />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const preferences = getPreferenceValues<{ apiKey: string; apiSecret: string }>();

  if (!preferences.apiKey || !preferences.apiSecret) {
    showToast({
      style: Toast.Style.Failure,
      title: "Credentials required",
      message: "Please set your API Key and Secret in the extension preferences.",
    });
    return (
      <List isLoading={false} searchBarPlaceholder="Set your credentials in the extension preferences." />
    );
  }

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
        if (data.code !== 0) {
          throw new Error(data.msg);
        }
        let positions: AccountPosition[] = [];
        let account: AccountInfo | undefined = undefined;
        if (data.data) {
          if (Array.isArray(data.data.positions)) {
            positions = data.data.positions;
          }
          if (data.data.account) {
            account = data.data.account;
          }
        }
        setState({
          positions,
          account,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching positions:", error);
        let errorMsg = "Unknown error";
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
    <List isLoading={state.isLoading} searchBarPlaceholder="Filter by symbol or side">
      {state.account && (
        <List.Section title="Account Balance">
          <List.Item
            key="account-balance"
            title={`Balance: ${parseFloat(state.account.accountBalanceRv).toFixed(2)} ${state.account.currency}`}
            accessories={[
              { text: `In Use: ${parseFloat(state.account.totalUsedBalanceRv).toFixed(2)} ${state.account.currency}` },
            ]}
          />
        </List.Section>
      )}
      <List.Section
        title={`Total PNL: ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(4)}`}
        subtitle="Unrealized PNL Sum"
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
      <List.Section title="Open Positions">
        {state.positions
          .filter((pos) => pos.symbol && pos.sizeRq && pos.side !== "None")
          .map((pos) => {
            const pnl = parseFloat(pos.unRealisedPnlRv || "0");
            const entry = parseFloat(pos.avgEntryPriceRp || "0");
            const size = parseFloat(pos.sizeRq || "0");
            const pnlPercent = entry > 0 && size > 0 ? (pnl / (entry * size)) * 100 : 0;
            const pnlColor = pnl >= 0 ? Color.Green : Color.Red;
            const isLong = pos.side === "Buy";
            const sideLabel = isLong ? "Long" : "Short";
            const leverageLabel = pos.crossMargin ? "Cross" : `Isolated ${Math.abs(Number(pos.leverageRr))}x`;
            const key = `${pos.symbol}-${pos.posSide}`;
            return (
              <List.Item
                key={key}
                title={`${pos.symbol} (${pos.sizeRq})`}
                subtitle={`${sideLabel}`}
                accessories={[
                  {
                    tag: {
                      value: `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} (${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%)`,
                      color: pnlColor,
                    },
                  },
                ]}
                icon={{ tintColor: isLong ? Color.Green : Color.Red, source: isLong ? "arrow-up-circle" : "arrow-down-circle" }}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="Show Details"
                      target={
                        <PositionDetail
                          pos={pos}
                          pnl={pnl}
                          pnlPercent={pnlPercent}
                          leverageLabel={leverageLabel}
                        />
                      }
                    />
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