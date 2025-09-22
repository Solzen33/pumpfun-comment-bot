import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { solanaConnection } from "../constants"
import { mainKp, customSwap } from "./buy"
import { logger, readSettings } from "../utils"
import { mainMenuWaiting } from "../.."
import { getAssociatedTokenAddress } from "@solana/spl-token"
import AmmImpl from "@meteora-ag/dynamic-amm-sdk"

export const sell_token = async () => {
    console.log("SELLING...")

    const settings = readSettings()
    const POOL_ID = new PublicKey(settings.poolId!);
    const slippage = Number(settings.slippage!);
    const TOKEN_CA = new PublicKey(settings.mint!);

    const ammImpl = await AmmImpl.create(solanaConnection, POOL_ID);
    const solBalance = (await solanaConnection.getBalance(mainKp.publicKey)) / LAMPORTS_PER_SOL

    logger.info(`Token selling started`)
    logger.info(`Wallet address: ${mainKp.publicKey.toBase58()}`)
    logger.info(`Balance of the main wallet: ${solBalance}Sol`)

    const ata = await getAssociatedTokenAddress(TOKEN_CA, mainKp.publicKey)
    const tokenAmount = Number((await solanaConnection.getTokenAccountBalance(ata)).value.amount);
    console.log("🚀 ~ constsell_token= ~ tokenAmount:", tokenAmount)

    await customSwap(ammImpl, TOKEN_CA, tokenAmount, slippage)

    mainMenuWaiting()
}