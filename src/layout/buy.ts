import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { readSettings, sleep } from "../utils/utils";
import { HIGHER_MC_INTERVAL, HIGHER_TP_INTERVAL, LOWER_MC_INTERVAL, LOWER_TP_INTERVAL, PRIVATE_KEY, DYNAMIC_AMM_PROGRAM_ID, SELL_TIMER, solanaConnection, STOP_LOSS } from "../constants";
import base58 from "bs58";
import { logger, wrapSol } from "../utils";
import { createAssociatedTokenAccountIdempotentInstruction, getAccount, getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";
import BN from "bn.js";
import AmmImpl from "@meteora-ag/dynamic-amm-sdk";
import { mainMenuWaiting } from "../..";
import { sendBundle } from "../jito/bundle";

export const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY!))

export const buy_monitor_autosell = async () => {
    const data = readSettings();
    const BUY_AMOUNT = Number(data.amount);
    const TOKEN_CA = new PublicKey(data.mint!);
    const SLIPPAGE = Number(data.slippage);
    const POOL_ID = new PublicKey(data.poolId!);

    let settings = {
        mint: new PublicKey(data.mint!),
        poolId: new PublicKey(data.poolId!),
        amount: Number(data.amount),
        slippage: Number(data.slippage)
    }

    const ammImpl = await AmmImpl.create(solanaConnection, POOL_ID);

    const vaultALp = ammImpl.poolState.aVaultLp;
    const vaultBLp = ammImpl.poolState.bVaultLp;

    console.log("🚀 ~ constbuy_monitor_autosell= ~ Bal:", vaultALp)
    console.log("🚀 ~ constbuy_monitor_autosell= ~ Bal:", vaultBLp)

    const solBalance = (await solanaConnection.getBalance(mainKp.publicKey)) / LAMPORTS_PER_SOL;

    if (solBalance < Number(BUY_AMOUNT)) {
        logger.error(`There is not enough balance in your wallet. Please deposit some more solana to continue.`)
        return
    }
    logger.info(`Pumpswap Trading bot is running`)
    logger.info(`Wallet address: ${mainKp.publicKey.toBase58()}`)
    logger.info(`Balance of the main wallet: ${solBalance}Sol`)

    // await wrapSol(mainKp, Number(BUY_AMOUNT) * 2)

    let middleMC = await getTokenMC(settings.mint)
    let mc = Math.floor(middleMC)
    let lowerMC = mc * (1 - LOWER_MC_INTERVAL / 100)
    let higherMC = mc * (1 + HIGHER_MC_INTERVAL / 100)
    const mcCheckInterval = 1000
    let mcChecked = 0
    let bought = false
    let processingToken = false

    logger.info(`Starting MarketCap monitoring, initial MC is ${middleMC}Sol ...`)

    while (1) {

        let changedSolBalance: number | null = 0;
        let tpInterval
        processingToken = true

        while (1) {
            if (mcChecked != 0) {
                middleMC = await getTokenMC(settings.mint)
                // middleHolderNum = (await findHolders(mintStr)).size
            }
            if (mcChecked > 100000) {
                bought = false
                processingToken = false
                break;
            }
            if (middleMC < 35) {
                bought = false
                processingToken = false
                break;
            }

            logger.info(`Current MC: ${middleMC}Sol, LMC: ${lowerMC}Sol, HMC: ${higherMC}Sol`)

            if (middleMC < lowerMC) {
                logger.info(`Market Cap keep decreasing now, reached ${lowerMC}Sol, keep monitoring...`)
                mc = Math.floor(middleMC)
                lowerMC = mc * (1 - LOWER_MC_INTERVAL / 100)
                higherMC = mc * (1 + HIGHER_MC_INTERVAL / 100)
            } else if (middleMC > higherMC) {
                logger.fatal(`Market Cap start increasing now, reached ${higherMC}Sol, can buy now...`)

                await customSwap(ammImpl, NATIVE_MINT, BUY_AMOUNT * 10 ** 9, 5)
                // await buy(mainKp, baseMint, BUY_AMOUNT, poolId)
                bought = true
                break;
            } else {
                logger.info(`Market Cap not changing a lot now, reached ${middleMC}Sol, keep monitoring...`)
                await sleep(mcCheckInterval)
                mcChecked++
                continue;
            }

            await sleep(mcCheckInterval)
            mcChecked++

        }

        if (bought) {
            mcChecked = 0
            if (middleMC > 1000) tpInterval = 1
            else tpInterval = 1
            // Waiting for the AssociatedTokenAccount is confirmed
            const maxRetries = 50
            const delayBetweenRetries = 1000
            let tokenAccountInfo
            const ata = await getAssociatedTokenAddress(TOKEN_CA, mainKp.publicKey)

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    tokenAccountInfo = await getAccount(solanaConnection, ata, "processed");
                    const tokenAmount = Number((await solanaConnection.getTokenAccountBalance(ata)).value.amount);

                    // Monitoring pnl
                    attempt = maxRetries
                    const amountIn = tokenAmount

                    try {

                        logger.info("Showing pnl monitoring...")
                        const priceCheckInterval = 200
                        const timesToCheck = SELL_TIMER / priceCheckInterval
                        let TP_LEVEL = 1.5
                        let higherTP = TP_LEVEL + HIGHER_TP_INTERVAL
                        let lowerTP = TP_LEVEL - LOWER_TP_INTERVAL

                        const SolOnSl = Number((Number(BUY_AMOUNT) * (100 - STOP_LOSS) / 100).toFixed(6))
                        console.log("🚀 ~ constbuy_monitor_autosell= ~ SolOnSl:", SolOnSl)
                        let timesChecked = 0
                        let tpReached = false
                        do {

                            try {
                                // Quote to Base swap (⬇️)
                                console.log("getSwapQuote for PNL monitoring...")
                                const amountOut = await ammImpl.getSwapQuote(TOKEN_CA, new BN(amountIn), SLIPPAGE);
                                console.log("🚀 ~ constbuy_monitor_autosell= ~ amountOut:", Number(amountOut.swapOutAmount))

                                changedSolBalance = (await solanaConnection.getBalance(mainKp.publicKey)) / LAMPORTS_PER_SOL;

                                console.log("🚀 ~ constbuy_monitor_autosell= ~ solBalance:", solBalance)
                                console.log("🚀 ~ constbuy_monitor_autosell= ~ changedSolBalance:", changedSolBalance)
                                console.log("🚀 ~ constbuy_monitor_autosell= ~ wrapSolBalance! - changedWrapSolBalance!:", solBalance! - changedSolBalance!)
                                const pnl = (Number(Number(amountOut.swapOutAmount) / 10 ** 9) - (solBalance! - changedSolBalance!)) / BUY_AMOUNT * 100
                                console.log("🚀 ~ constbuy_monitor_autosell= ~ pnl:", pnl)

                                if (pnl > TP_LEVEL && !tpReached) {
                                    tpReached = true
                                    logger.info(`PNL is reached to the lowest Profit level ${TP_LEVEL}%`)
                                }

                                if (pnl < 0) {
                                    tpReached = false
                                    TP_LEVEL = 1
                                    higherTP = TP_LEVEL + HIGHER_TP_INTERVAL
                                    lowerTP = TP_LEVEL - LOWER_TP_INTERVAL
                                }

                                logger.info(`Current: ${amountOut.minSwapOutAmount} SOL | PNL: ${pnl}% | HTP: ${higherTP.toFixed(2)}% | LTP: ${lowerTP.toFixed(2)}% | SL: ${SolOnSl}`)
                                const amountOutNum = Number(amountOut.minSwapOutAmount) / 10 ** 9

                                if (amountOutNum < SolOnSl) {
                                    logger.fatal("Token is on stop loss level, will sell with loss")
                                    try {
                                        // const latestBlockHash = await (await solanaConnection.getLatestBlockhash()).blockhash
                                        await customSwap(ammImpl, TOKEN_CA, amountIn, SLIPPAGE)
                                        bought = false
                                        break;
                                    } catch (err) {
                                        logger.info("Fail to sell tokens ...")
                                    }
                                }

                                if (pnl > 0)
                                    if (pnl > higherTP) {
                                        // TP_LEVEL = Math.floor(pnl / (tpInterval / 2)) * (tpInterval / 2)
                                        TP_LEVEL = pnl

                                        logger.info(`Token price goes up and up, so raising take profit from ${lowerTP + tpInterval / 2}% to ${TP_LEVEL}%`)

                                        higherTP = TP_LEVEL + HIGHER_TP_INTERVAL
                                        lowerTP = TP_LEVEL - LOWER_TP_INTERVAL
                                    } else if (pnl < lowerTP && tpReached) {
                                        logger.fatal("Token is on profit level, price starts going down, selling tokens...")
                                        try {
                                            await customSwap(ammImpl, TOKEN_CA, amountIn, SLIPPAGE)
                                            break;
                                        } catch (err) {
                                            logger.info("Fail to sell tokens ...")
                                        }
                                    }

                            } catch (e) {
                                // logger.error(e)
                            } finally {
                                timesChecked++
                            }
                            await sleep(priceCheckInterval)
                            if (timesChecked >= timesToCheck) {
                                await customSwap(ammImpl, TOKEN_CA, amountIn, SLIPPAGE)
                                break
                            }
                        } while (1)

                        logger.warn(`New pumpswap token ${TOKEN_CA.toBase58()} PNL processing finished once and continue monitoring MarketCap`)
                        // logger.info(`Waiting 5 seconds for new buying and selling...`)
                        await sleep(1000)
                        // await wrapSol(mainKp, BUY_AMOUNT * 1.1)

                        middleMC = await getTokenMC(settings.mint)
                        // middleHolderNum = (await findHolders(mintStr)).size
                        mc = Math.floor(middleMC)
                        lowerMC = mc * (1 - LOWER_MC_INTERVAL / 100)
                        higherMC = mc * (1 + HIGHER_MC_INTERVAL / 100)

                    } catch (error) {
                        logger.error("Error when setting profit amounts", error)
                        mainMenuWaiting()
                    }

                    // break; // Break the loop if fetching the account was successful
                } catch (error) {
                    if (error instanceof Error && error.name === 'TokenAccountNotFoundError') {
                        logger.info(`Attempt ${attempt + 1}/${maxRetries}: Associated token account not found, retrying...`);
                        if (attempt === maxRetries - 1) {
                            logger.error(`Max retries reached. Failed to fetch the token account.`);
                            mainMenuWaiting()
                        }
                        // Wait before retrying
                        await new Promise((resolve) => setTimeout(resolve, delayBetweenRetries));
                    } else if (error instanceof Error) {
                        // logger.error(`Unexpected error while fetching token account: ${error.message}`);
                        // throw error;
                        logger.info(`Attempt ${attempt + 1}/${maxRetries}: Associated token account not found, retrying...`);
                        if (attempt === maxRetries - 1) {
                            logger.error(`Max retries reached. Failed to fetch the token account.`);
                            mainMenuWaiting()
                        }
                        await new Promise((resolve) => setTimeout(resolve, delayBetweenRetries));

                    } else {
                        logger.error(`An unknown error occurred: ${String(error)}`);
                        throw error;
                    }
                }
            }
        }

        if (!processingToken) {
            mainMenuWaiting()
            break;
        }

    }
}

export const customSwap = async (ammImpl: AmmImpl, inputTokenMint: PublicKey, amountIn: number, slippage: number) => {
    console.log("🚀 ~ customSwap ~ amountIn:", amountIn)
    const baseAta = await getAssociatedTokenAddress(inputTokenMint, mainKp.publicKey);
    try {
        const quoteAmount = await ammImpl.getSwapQuote(inputTokenMint, new BN(amountIn), slippage);
        const expectedAmount = quoteAmount.minSwapOutAmount;
        console.log("🚀 ~ customSwap ~ expectedAmount:", expectedAmount)
        const latestBlockHash = await (await solanaConnection.getLatestBlockhash()).blockhash

        const swapInstruction = await ammImpl.swap(mainKp.publicKey, inputTokenMint, new BN(amountIn), expectedAmount);

        const messageV0 = new TransactionMessage({
            payerKey: mainKp.publicKey,
            recentBlockhash: latestBlockHash,
            instructions: [
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }), // Set this to super small value since it is not taken into account when sending as bundle.
                ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }), // Calculated amount of units typically used in our transaction is about 70848. Setting limit slightly above.
                ...swapInstruction.instructions,
                createAssociatedTokenAccountIdempotentInstruction(mainKp.publicKey, baseAta, mainKp.publicKey, inputTokenMint),
            ],
        }).compileToV0Message();

        sendBundle(latestBlockHash, messageV0, inputTokenMint);
    } catch (error) {
        logger.error("Error in customSwap:", error);
        throw error;
    }
}

const getTokenPrice = async (mint: PublicKey) => {
    try {
        const response = await fetch(
            `https://api.jup.ag/price/v2?ids=${mint}`
        );
        const data: { data: { [key: string]: { price: number } } } =
            await response.json();
        const tokenPrice = Number(
            data.data[`${mint}`].price
        );
        return tokenPrice;
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

const getTokenMC = async (mint: PublicKey) => {
    const currentPrice = await getTokenPrice(mint)
    const totalSupply = (await solanaConnection.getTokenSupply(mint)).value.uiAmount
    console.log("🚀 ~ getTokenMC ~ totalSupply:", totalSupply)
    return currentPrice! * totalSupply!
}