export interface AccountPosition {
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

export interface AccountInfo {
  currency: string;
  accountBalanceRv: string;
  totalUsedBalanceRv: string;
}

export interface PhemexAccountPositionsResponse {
  code: number;
  msg: string;
  data: {
    account: AccountInfo;
    positions: AccountPosition[];
  };
}
