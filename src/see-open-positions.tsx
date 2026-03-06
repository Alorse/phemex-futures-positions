import { List, Color, ActionPanel, Action } from "@raycast/api";
import { PositionDetail } from "./PositionDetail";
import { usePositions } from "./hooks/usePositions";
import { useCredentials } from "./hooks/useCredentials";
import {
  calculatePnl,
  calculatePnlPercent,
  calculateTotalPnl,
  filterActivePositions,
  getLeverageLabel,
  isLongPosition,
  formatCurrency,
} from "./utils/positionHelpers";
import { PHEMEX_WEB } from "./utils/constants";

export default function Command() {
  const { credentials, isValid } = useCredentials();

  if (!isValid) {
    return (
      <List isLoading={false} searchBarPlaceholder="Set your credentials in the extension preferences.">
        <List.EmptyView
          title="Credentials Required"
          description="Please set your API Key and Secret in the extension preferences."
        />
      </List>
    );
  }

  const state = usePositions(credentials!.apiKey, credentials!.apiSecret);
  const activePositions = filterActivePositions(state.positions);
  const totalPnl = calculateTotalPnl(state.positions);
  const totalPnlColor = totalPnl >= 0 ? Color.Green : Color.Red;

  return (
    <List isLoading={state.isLoading} searchBarPlaceholder="Filter by symbol or side">
      {state.account && (
        <List.Section title="Account Balance">
          <List.Item
            key="account-balance"
            title={`Balance: ${formatCurrency(state.account.accountBalanceRv)} ${state.account.currency}`}
            accessories={[
              { text: `In Use: ${formatCurrency(state.account.totalUsedBalanceRv)} ${state.account.currency}` },
            ]}
          />
        </List.Section>
      )}
      <List.Section
        title={`Total PNL: ${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`}
        subtitle="Unrealized PNL Sum"
      >
        <List.Item
          key="total-pnl"
          title="Total PNL"
          accessories={[
            {
              tag: {
                value: `${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`,
                color: totalPnlColor,
              },
            },
          ]}
        />
      </List.Section>
      <List.Section title={`Open Positions (${activePositions.length})`}>
        {activePositions.map((pos) => {
          const pnl = calculatePnl(pos);
          const pnlPercent = calculatePnlPercent(pos);
          const pnlColor = pnl >= 0 ? Color.Green : Color.Red;
          const leverageLabel = getLeverageLabel(pos);
          const key = `${pos.symbol}-${pos.posSide}`;

          return (
            <List.Item
              key={key}
              title={`${pos.symbol} (${pos.sizeRq})`}
              subtitle={isLongPosition(pos) ? "Long" : "Short"}
              accessories={[
                {
                  tag: {
                    value: `${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)} (${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%)`,
                    color: pnlColor,
                  },
                },
              ]}
              icon={{
                tintColor: isLongPosition(pos) ? Color.Green : Color.Red,
                source: isLongPosition(pos) ? "arrow-up-circle" : "arrow-down-circle",
              }}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Show Details"
                    target={
                      <PositionDetail pos={pos} pnl={pnl} pnlPercent={pnlPercent} leverageLabel={leverageLabel} />
                    }
                  />
                  <Action.OpenInBrowser title="Open in Phemex" url={PHEMEX_WEB.TRADE(pos.symbol)} />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
