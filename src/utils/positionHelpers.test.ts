import {
  calculatePnl,
  calculatePnlPercent,
  calculateTotalPnl,
  calculateMarkDiffPercent,
  getLeverageLabel,
  isLongPosition,
  formatCurrency,
  filterActivePositions,
} from "./positionHelpers";
import { AccountPosition } from "../types";

describe("positionHelpers", () => {
  const mockPosition: AccountPosition = {
    symbol: "BTCUSDT",
    currency: "USDT",
    side: "Buy",
    leverageRr: "10",
    sizeRq: "1.5",
    valueRv: "50000",
    avgEntryPriceRp: "40000",
    markPriceRp: "42000",
    unRealisedPnlRv: "3000",
    posSide: "Long",
    posMode: "OneWay",
    crossMargin: false,
    usedBalanceRv: "5000",
    cumClosedPnlRv: "1000",
    liquidationPriceRp: "35000",
    bankruptPriceRp: "36000",
    assignedPosBalanceRv: "5000",
    positionMarginRv: "5000",
    cumFundingFeeRv: "10",
    cumTransactFeeRv: "5",
  };

  describe("calculatePnl", () => {
    it("should calculate PNL correctly", () => {
      expect(calculatePnl(mockPosition)).toBe(3000);
    });

    it("should return 0 for empty PNL", () => {
      const position = { ...mockPosition, unRealisedPnlRv: "" };
      expect(calculatePnl(position)).toBe(0);
    });

    it("should handle negative PNL", () => {
      const position = { ...mockPosition, unRealisedPnlRv: "-1500" };
      expect(calculatePnl(position)).toBe(-1500);
    });
  });

  describe("calculatePnlPercent", () => {
    it("should calculate PNL percent correctly", () => {
      // pnl: 3000, entry: 40000, size: 1.5, leverage: 10
      // (3000 / (40000 * 1.5)) * 100 * 10 = 50%
      expect(calculatePnlPercent(mockPosition)).toBe(50);
    });

    it("should return 0 when entry price is 0", () => {
      const position = { ...mockPosition, avgEntryPriceRp: "0" };
      expect(calculatePnlPercent(position)).toBe(0);
    });

    it("should return 0 when size is 0", () => {
      const position = { ...mockPosition, sizeRq: "0" };
      expect(calculatePnlPercent(position)).toBe(0);
    });

    it("should return 0 when leverage is 0", () => {
      const position = { ...mockPosition, leverageRr: "0" };
      expect(calculatePnlPercent(position)).toBe(0);
    });
  });

  describe("calculateTotalPnl", () => {
    it("should calculate total PNL for multiple positions", () => {
      const positions = [
        mockPosition,
        { ...mockPosition, unRealisedPnlRv: "2000" },
        { ...mockPosition, unRealisedPnlRv: "-500" },
      ];
      expect(calculateTotalPnl(positions)).toBe(4500);
    });

    it("should filter out invalid positions", () => {
      const positions = [
        mockPosition,
        { ...mockPosition, symbol: "" }, // Invalid: no symbol
        { ...mockPosition, side: "None" }, // Invalid: side is None
      ];
      expect(calculateTotalPnl(positions)).toBe(3000);
    });

    it("should return 0 for empty array", () => {
      expect(calculateTotalPnl([])).toBe(0);
    });
  });

  describe("calculateMarkDiffPercent", () => {
    it("should calculate mark diff percent correctly", () => {
      // ((42000 - 40000) / 40000) * 100 = 5%
      expect(calculateMarkDiffPercent(42000, 40000)).toBe(5);
    });

    it("should handle negative difference", () => {
      expect(calculateMarkDiffPercent(38000, 40000)).toBe(-5);
    });

    it("should return 0 when entry price is 0", () => {
      expect(calculateMarkDiffPercent(42000, 0)).toBe(0);
    });
  });

  describe("getLeverageLabel", () => {
    it("should return 'Cross' for cross margin", () => {
      const position = { ...mockPosition, crossMargin: true };
      expect(getLeverageLabel(position)).toBe("Cross");
    });

    it("should return 'Isolated Xx' for isolated margin", () => {
      const position = { ...mockPosition, crossMargin: false, leverageRr: "20" };
      expect(getLeverageLabel(position)).toBe("Isolated 20x");
    });

    it("should handle absolute value for negative leverage", () => {
      const position = { ...mockPosition, crossMargin: false, leverageRr: "-5" };
      expect(getLeverageLabel(position)).toBe("Isolated 5x");
    });
  });

  describe("isLongPosition", () => {
    it("should return true for Buy side", () => {
      expect(isLongPosition(mockPosition)).toBe(true);
    });

    it("should return false for Sell side", () => {
      const position = { ...mockPosition, side: "Sell" };
      expect(isLongPosition(position)).toBe(false);
    });
  });

  describe("formatCurrency", () => {
    it("should format string to 4 decimals", () => {
      expect(formatCurrency("123.456789")).toBe("123.4568");
    });

    it("should format number to 4 decimals", () => {
      expect(formatCurrency(123.456789)).toBe("123.4568");
    });

    it("should handle empty string", () => {
      expect(formatCurrency("")).toBe("0.0000");
    });
  });

  describe("filterActivePositions", () => {
    it("should return only active positions", () => {
      const positions = [
        mockPosition,
        { ...mockPosition, symbol: "" },
        { ...mockPosition, sizeRq: "" },
        { ...mockPosition, side: "None" },
      ];
      const filtered = filterActivePositions(positions);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(mockPosition);
    });

    it("should return empty array for no active positions", () => {
      const positions = [
        { ...mockPosition, symbol: "" },
        { ...mockPosition, side: "None" },
      ];
      expect(filterActivePositions(positions)).toHaveLength(0);
    });
  });
});
