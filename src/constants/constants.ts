import { Connection, PublicKey } from "@solana/web3.js"
import dotenv from 'dotenv';

dotenv.config();

export const PRIVATE_KEY = process.env.PRIVATE_KEY
export const RPC_ENDPOINT = process.env.RPC_ENDPOINT!
export const RPC_WEBSOCKET_ENDPOINT = process.env.RPC_WEBSOCKET_ENDPOINT
export const solanaConnection = new Connection(RPC_ENDPOINT, "confirmed")
export const DYNAMIC_AMM_PROGRAM_ID = process.env.DYNAMIC_AMM_PROGRAM_ID

export const SELL_TIMER = Number(process.env.SELL_TIMER)
export const STOP_LOSS = Number(process.env.STOP_LOSS)

export const BLOCKENGINE_URL = process.env.BLOCKENGINE_URL
export const JITO_KEY = Number(process.env.JITO_KEY)
export const JITO_TIP = Number(process.env.JITO_TIP)

export const LOWER_MC_INTERVAL = Number(process.env.LOWER_MC_INTERVAL)
export const HIGHER_MC_INTERVAL = Number(process.env.HIGHER_MC_INTERVAL)
export const LOWER_TP_INTERVAL = Number(process.env.LOWER_TP_INTERVAL)
export const HIGHER_TP_INTERVAL = Number(process.env.HIGHER_TP_INTERVAL)

export const GLOBAL_CONFIG_SEED = 'global_config'
export const LP_MINT_SEED = 'pool_lp_mint'
export const POOL_SEED = 'pool'
export const PROTOCOL_FEE_RECIPIENT = new PublicKey("12e2F4DKkD3Lff6WPYsU7Xd76SHPEyN9T8XSsTJNF8oT")
export const PROTOCOL_FEE_RECIPIENT_MAINNET = new PublicKey("7hTckgnGnLQR6sdH7YkqFTAA7VwTfYFaZ6EhEsU3saCX")