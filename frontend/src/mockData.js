// Mock data for US macroeconomic indicators
// This data will be used as a fallback if API requests fail

import moment from 'moment';

export const mockData = {
  gdpGrowth: {
    title: "GDP Growth Rate",
    data: [2.1, 2.2, 1.8, 1.1, 0.2, 0.1, 0.5, 1.3, 1.9, 2.3, 2.7, 2.9],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 2.9,
    previousValue: 2.7,
    change: 0.2,
    unit: "%",
    source: "FRED"
  },
  unemployment: {
    title: "Unemployment Rate",
    data: [4.2, 4.1, 4.0, 3.9, 3.9, 3.8, 3.7, 3.7, 3.6, 3.7, 3.8, 3.7],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 3.7,
    previousValue: 3.8,
    change: -0.1,
    unit: "%",
    source: "FRED"
  },
  inflationRate: {
    title: "Inflation (CPI)",
    data: [2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.3, 3.2, 3.1, 3.0, 2.9, 2.8],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 2.8,
    previousValue: 2.9,
    change: -0.1,
    unit: "%",
    source: "FRED"
  },
  federalFundsRate: {
    title: "Federal Funds Rate",
    data: [5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.0, 4.75, 4.5],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 4.5,
    previousValue: 4.75,
    change: -0.25,
    unit: "%",
    source: "FRED"
  },
  sp500: {
    title: "S&P 500",
    data: [4200, 4250, 4300, 4350, 4400, 4450, 4500, 4550, 4600, 4650, 4700, 4750],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 4750,
    previousValue: 4700,
    change: 50,
    unit: "",
    source: "FRED"
  },
  housing: {
    title: "Median Home Price",
    data: [380000, 382000, 385000, 387000, 390000, 392000, 395000, 398000, 400000, 403000, 405000, 408000],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 408000,
    previousValue: 405000,
    change: 3000,
    unit: "$",
    source: "FRED"
  },
  tradeBalance: {
    title: "Trade Balance",
    data: [-65, -63, -62, -60, -58, -57, -55, -54, -52, -51, -49, -48],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: -48,
    previousValue: -49,
    change: 1,
    unit: "$ Billion",
    source: "FRED"
  },
  manufacturing: {
    title: "Manufacturing PMI",
    data: [49, 48.5, 48.8, 49.2, 49.5, 50.1, 50.3, 50.5, 50.8, 51.2, 51.5, 51.8],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 51.8,
    previousValue: 51.5,
    change: 0.3,
    unit: "",
    source: "FRED"
  },
  beaGDP: {
    title: "GDP (BEA)",
    data: [22300, 22500, 22700, 22900, 23100, 23300, 23500, 23700, 23900, 24100, 24300, 24500],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 24500,
    previousValue: 24300,
    change: 200,
    unit: "$ Billion",
    source: "BEA"
  },
  beaTradeBalance: {
    title: "Trade Balance (BEA)",
    data: [-70, -68, -67, -65, -63, -62, -60, -59, -57, -56, -54, -53],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: -53,
    previousValue: -54,
    change: 1,
    unit: "$ Billion",
    source: "BEA"
  },
  blsUnemployment: {
    title: "Unemployment Rate (BLS)",
    data: [4.1, 4.0, 3.9, 3.8, 3.8, 3.7, 3.6, 3.6, 3.5, 3.6, 3.7, 3.6],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 3.6,
    previousValue: 3.7,
    change: -0.1,
    unit: "%",
    source: "BLS"
  },
  blsCPI: {
    title: "Consumer Price Index (BLS)",
    data: [280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 291,
    previousValue: 290,
    change: 1,
    unit: "Index",
    source: "BLS"
  },
  blsWages: {
    title: "Average Hourly Earnings (BLS)",
    data: [30.2, 30.4, 30.6, 30.8, 31.0, 31.2, 31.4, 31.6, 31.8, 32.0, 32.2, 32.4],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 32.4,
    previousValue: 32.2,
    change: 0.2,
    unit: "$",
    source: "BLS"
  },
  wb_NY_GDP_MKTP_KD_ZG: {
    title: "GDP Growth (World Bank)",
    data: [2.3, 2.5, 2.7, 2.9, 3.1, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.8],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 1.8,
    previousValue: 2.0,
    change: -0.2,
    unit: "%",
    source: "World Bank"
  },
  wb_FP_CPI_TOTL_ZG: {
    title: "Inflation (World Bank)",
    data: [3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.4, 3.3, 3.2, 3.1, 3.0, 2.9],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 2.9,
    previousValue: 3.0,
    change: -0.1,
    unit: "%",
    source: "World Bank"
  },
  wb_NV_IND_MANF_ZS: {
    title: "Manufacturing (World Bank)",
    data: [11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.6, 11.5, 11.4, 11.3, 11.2, 11.1],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 11.1,
    previousValue: 11.2,
    change: -0.1,
    unit: "%",
    source: "World Bank"
  }
};
