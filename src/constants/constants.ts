import { Connection, PublicKey } from "@solana/web3.js"
import dotenv from 'dotenv';

dotenv.config();

// Wallet Configuration
export const PRIVATE_KEY = process.env.PRIVATE_KEY
export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"
export const RPC_WEBSOCKET_ENDPOINT = process.env.RPC_WEBSOCKET_ENDPOINT
export const solanaConnection = new Connection(RPC_ENDPOINT, "confirmed")

// Trading Configuration
export const SELL_TIMER = Number(process.env.SELL_TIMER) || 30000
export const STOP_LOSS = Number(process.env.STOP_LOSS) || 10
export const BUY_AMOUNT = Number(process.env.BUY_AMOUNT) || 0.01
export const SLIPPAGE = Number(process.env.SLIPPAGE) || 50

// Market Cap Monitoring
export const LOWER_MC_INTERVAL = Number(process.env.LOWER_MC_INTERVAL) || 5
export const HIGHER_MC_INTERVAL = Number(process.env.HIGHER_MC_INTERVAL) || 10
export const LOWER_TP_INTERVAL = Number(process.env.LOWER_TP_INTERVAL) || 5
export const HIGHER_TP_INTERVAL = Number(process.env.HIGHER_TP_INTERVAL) || 10

// Jito Configuration (Optional)
export const BLOCKENGINE_URL = process.env.BLOCKENGINE_URL || "ny.mainnet.block-engine.jito.wtf"
export const JITO_KEY = process.env.JITO_KEY
export const JITO_TIP = Number(process.env.JITO_TIP) || 1000000

// DEX Platform Configuration
export const DEX_PLATFORM = process.env.DEX_PLATFORM || "meteora"
export const USE_JITO = process.env.USE_JITO === "true" || false

// Logging Configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || "info"

// Generic DEX Constants
export const GLOBAL_CONFIG_SEED = 'global_config'
export const LP_MINT_SEED = 'pool_lp_mint'
export const POOL_SEED = 'pool'

// Protocol Fee Recipients (can be configured per platform)
export const PROTOCOL_FEE_RECIPIENTS = {
  meteora: new PublicKey("12e2F4DKkD3Lff6WPYsU7Xd76SHPEyN9T8XSsTJNF8oT"),
  mainnet: new PublicKey("7hTckgnGnLQR6sdH7YkqFTAA7VwTfYFaZ6EhEsU3saCX")
}

// Price Feed Configuration
export const PRICE_FEED_URL = process.env.PRICE_FEED_URL || "https://api.jup.ag/price/v2"