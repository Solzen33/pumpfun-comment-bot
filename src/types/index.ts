// Trading Direction Types
export type Direction = "quoteToBase" | "baseToQuote"
export type TradeType = "buy" | "sell"

// DEX Platform Types
export type DEXPlatform = "meteora" | "raydium" | "orca" | "jupiter"

// Trading Strategy Types
export type TradingStrategy = "market_cap_monitor" | "price_monitor" | "manual"

// Configuration Types
export interface TradingConfig {
  mint: string
  poolId: string
  amount: number
  slippage: number
  isPump?: boolean
  platform?: DEXPlatform
}

export interface MarketCapConfig {
  lowerInterval: number
  higherInterval: number
  lowerTPInterval: number
  higherTPInterval: number
}

export interface TradingParams {
  buyAmount: number
  sellTimer: number
  stopLoss: number
  slippage: number
}

// Price Feed Types
export interface PriceData {
  price: number
  timestamp: number
  source: string
}

export interface TokenInfo {
  mint: string
  symbol?: string
  name?: string
  decimals: number
  supply?: number
}

// Trading Result Types
export interface TradeResult {
  success: boolean
  signature?: string
  error?: string
  amountIn: number
  amountOut: number
  timestamp: number
}

// Monitoring Types
export interface MarketCapData {
  current: number
  lower: number
  higher: number
  change: number
  timestamp: number
}

export interface PnLData {
  current: number
  percentage: number
  takeProfit: number
  stopLoss: number
  timestamp: number
}