import { Detail, ActionPanel, Action } from "@raycast/api";
import { AccountPosition } from "./types";
import { isLongPosition, calculateMarkDiffPercent, formatCurrency } from "./utils/positionHelpers";
import { PHEMEX_WEB } from "./utils/constants";

interface PositionDetailProps {
  pos: AccountPosition;
  pnl: number;
  pnlPercent: number;
  leverageLabel: string;
}

export function PositionDetail({ pos, pnl, pnlPercent, leverageLabel }: PositionDetailProps) {
  const sideLabel = isLongPosition(pos) ? "Long" : "Short";
  const pnlEmoji = pnl >= 0 ? "🟢" : "🔴";
  const leverageEmoji = pos.crossMargin ? "⚖️" : "🎚️";

  const entryPrice = Number(pos.avgEntryPriceRp);
  const markPrice = Number(pos.markPriceRp);
  const markDiffPercent = calculateMarkDiffPercent(markPrice, entryPrice);
  const markDiffStr = `${formatCurrency(markPrice)} (${markDiffPercent >= 0 ? "+" : ""}${markDiffPercent.toFixed(2)}%)`;

  const formattedPnl = `${pnlEmoji} ${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}`;
  const formattedPnlPercent = `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`;

  return (
    <Detail
      navigationTitle={`${pos.symbol} (${sideLabel})`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Side" text={sideLabel} icon={isLongPosition(pos) ? "⬆️" : "⬇️"} />
          <Detail.Metadata.Label title="Size" text={Number(pos.sizeRq).toString()} />
          <Detail.Metadata.Label title="Entry Price" text={formatCurrency(pos.avgEntryPriceRp)} />
          <Detail.Metadata.Label title="Mark Price" text={markDiffStr} />
          <Detail.Metadata.Label title="Leverage" text={`${leverageEmoji} ${leverageLabel}`} />
          <Detail.Metadata.Label
            title="Margin"
            text={`${pos.usedBalanceRv ? formatCurrency(pos.usedBalanceRv) : "-"} ${pos.currency}`}
          />
        </Detail.Metadata>
      }
      markdown={`| ${pos.symbol} | ${formattedPnl} (${formattedPnlPercent}) |
|---|---|
| **Realized PNL** | ${formatCurrency(pos.cumClosedPnlRv || 0)} |
| **Liquidation Price** | ${formatCurrency(pos.liquidationPriceRp || 0)} |
| **Assigned Balance** | ${formatCurrency(pos.assignedPosBalanceRv || 0)} |
| **Position Margin** | ${formatCurrency(pos.positionMarginRv || 0)} |
| **Fees** | ${formatCurrency(pos.cumFundingFeeRv || 0)} (funding), ${formatCurrency(pos.cumTransactFeeRv || 0)} (transact) |
| **Mode** | ${pos.posMode} |
`}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open in Phemex" url={PHEMEX_WEB.TRADE(pos.symbol)} />
          <Action.CopyToClipboard title="Copy Symbol" content={pos.symbol} />
          <Action.CopyToClipboard title="Copy Position Size" content={Number(pos.sizeRq).toString()} />
        </ActionPanel>
      }
    />
  );
}
