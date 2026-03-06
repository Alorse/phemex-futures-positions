import { Detail, ActionPanel, Action } from "@raycast/api";
import { AccountPosition } from "./types";

export function PositionDetail({
  pos,
  pnl,
  pnlPercent,
  leverageLabel,
}: {
  pos: AccountPosition;
  pnl: number;
  pnlPercent: number;
  leverageLabel: string;
}) {
  const isLong = pos.side === "Buy";
  const pnlEmoji = pnl >= 0 ? "🟢" : "🔴";
  const sideLabel = isLong ? "Long" : "Short";
  const leverageEmoji = pos.crossMargin ? "⚖️" : "🎚️";

  const entryPrice = Number(pos.avgEntryPriceRp);
  const markPrice = Number(pos.markPriceRp);
  const markDiffPercent = entryPrice > 0 ? ((markPrice - entryPrice) / entryPrice) * 100 : 0;
  const markDiffStr = `${markPrice.toFixed(4)} (${markDiffPercent >= 0 ? "+" : ""}${markDiffPercent.toFixed(2)}%)`;

  return (
    <Detail
      navigationTitle={`${pos.symbol} (${sideLabel})`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Side" text={sideLabel} icon={isLong ? "⬆️" : "⬇️"} />
          <Detail.Metadata.Label title="Size" text={Number(pos.sizeRq).toString()} />
          <Detail.Metadata.Label title="Entry Price" text={Number(pos.avgEntryPriceRp).toFixed(4)} />
          <Detail.Metadata.Label title="Mark Price" text={markDiffStr} />
          <Detail.Metadata.Label title="Leverage" text={`${leverageEmoji} ${leverageLabel}`} />
          <Detail.Metadata.Label
            title="Margin"
            text={`${pos.usedBalanceRv ? Number(pos.usedBalanceRv).toFixed(4) : "-"} ${pos.currency}`}
          />
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
