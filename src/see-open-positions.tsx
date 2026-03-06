import { List, showToast, Toast, Color, ActionPanel, Action, getPreferenceValues } from "@raycast/api";
import { PositionDetail } from "./PositionDetail";
import { usePositions } from "./usePositions";

export default function Command() {
  const preferences = getPreferenceValues<{ apiKey: string; apiSecret: string }>();

  if (!preferences.apiKey || !preferences.apiSecret) {
    showToast({
      style: Toast.Style.Failure,
      title: "Credentials required",
      message: "Please set your API Key and Secret in the extension preferences.",
    });
    return <List isLoading={false} searchBarPlaceholder="Set your credentials in the extension preferences." />;
  }

  const state = usePositions(preferences.apiKey, preferences.apiSecret);
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
            const pnlPercent = entry > 0 && size > 0 ? (pnl / (entry * size)) * 100 * Number(pos.leverageRr) : 0;
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
                icon={{
                  tintColor: isLong ? Color.Green : Color.Red,
                  source: isLong ? "arrow-up-circle" : "arrow-down-circle",
                }}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="Show Details"
                      target={<PositionDetail pos={pos} pnl={pnl} pnlPercent={pnlPercent} leverageLabel={leverageLabel} />}
                    />
                    <Action.OpenInBrowser title="Open in Phemex" url={`https://phemex.com/trade/${pos.symbol}`} />
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>
    </List>
  );
}
