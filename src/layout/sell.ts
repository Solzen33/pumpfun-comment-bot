import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js"
import { solanaConnection, DEX_PLATFORM } from "../constants"
import { mainKp, swap } from "./buy"
import { logger, readSettings } from "../utils"
import { fetchDLMMPoolId, mainMenuWaiting } from "../.."
import { getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token"
import { BN } from "bn.js"
import DLMM from "@meteora-ag/dlmm"
import { TradeResult } from "../types"

export const sell_token = async (): Promise<TradeResult | null> => {
    const solBalance = (await solanaConnection.getBalance(mainKp.publicKey)) / LAMPORTS_PER_SOL

    logger.info(`Starting token sell operation`);
    logger.info(`Wallet address: ${mainKp.publicKey.toBase58()}`);
    logger.info(`SOL balance: ${solBalance.toFixed(6)} SOL`);

    try {
        const settings = readSettings();
        const slippage = Number(settings.slippage!);
        const TOKEN_CA = new PublicKey(settings.mint!);

        // Get pool ID based on DEX platform
        let poolId: string;
        if (DEX_PLATFORM === "meteora") {
            poolId = await fetchDLMMPoolId(settings.mint!);
            if (!poolId) {
                throw new Error("Could not find pool ID for the token");
            }
        } else {
            // For other platforms, use the configured pool ID
            poolId = settings.poolId!;
        }

        logger.info(`Using pool ID: ${poolId}`);
        const POOL_ID = new PublicKey(poolId);

        // Create DEX pool instance
        const dlmmPool = await DLMM.create(solanaConnection, POOL_ID);
        const ata = await getAssociatedTokenAddress(TOKEN_CA, mainKp.publicKey);

        logger.info(`Token account address: ${ata.toBase58()}`);

        // Get token balance
        const tokenInfo = await solanaConnection.getTokenAccountBalance(ata);
        const tokenAmount = Number(tokenInfo.value.amount!);
        
        if (tokenAmount === 0) {
            logger.warn("No tokens to sell");
            return {
                success: false,
                error: "No tokens to sell",
                amountIn: 0,
                amountOut: 0,
                timestamp: Date.now()
            };
        }

        logger.info(`Selling ${tokenAmount} tokens`);

        // Execute sell swap
        const result = await swap(dlmmPool, POOL_ID, TOKEN_CA, NATIVE_MINT, new BN(tokenAmount), slippage, mainKp);
        
        if (result.success) {
            logger.info(`Sell transaction successful: ${result.signature}`);
        } else {
            logger.error(`Sell transaction failed: ${result.error}`);
        }

        return result;

    } catch (error: any) {
        logger.error("Sell operation failed:", error);
        return {
            success: false,
            error: error.message,
            amountIn: 0,
            amountOut: 0,
            timestamp: Date.now()
        };
    } finally {
        mainMenuWaiting();
    }
}
