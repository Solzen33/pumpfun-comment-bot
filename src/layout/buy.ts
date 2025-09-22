import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, Transaction, TransactionMessage } from "@solana/web3.js";
import { readSettings, sleep } from "../utils/utils";
import { 
    HIGHER_MC_INTERVAL, 
    HIGHER_TP_INTERVAL, 
    LOWER_MC_INTERVAL, 
    LOWER_TP_INTERVAL, 
    PRIVATE_KEY, 
    SELL_TIMER, 
    solanaConnection, 
    STOP_LOSS,
    DEX_PLATFORM,
    PRICE_FEED_URL
} from "../constants";
import base58 from "bs58";
import { logger } from "../utils";
import { getAccount, getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";
import { mainMenuWaiting } from "../..";
import BN from "bn.js";
import DLMM, { getTokenDecimals } from "@meteora-ag/dlmm";
import { sendBundle } from "../jito/bundle";
import { TradeResult, MarketCapData, PnLData } from "../types";

export const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY!))

export const buy_monitor_autosell = async () => {
    const data = readSettings();
    const BUY_AMOUNT = Number(data.amount); // Convert to lamports
    const TOKEN_CA = new PublicKey(data.mint!);
    const IS_PUMPFUN = data.isPump!;
    const SLIPPAGE = Number(data.slippage);
    const POOL_ID = new PublicKey(data.poolId!);

    const dlmmPool = await DLMM.create(solanaConnection, POOL_ID);

    const solBalance = (await solanaConnection.getBalance(mainKp.publicKey)) / LAMPORTS_PER_SOL;

    const binArraysAccount = await dlmmPool.getBinArrays();
    const lpToken = await dlmmPool.getMaxPriceInBinArrays(binArraysAccount)
    console.log("🚀 ~ constbuy_monitor_autosell= ~ lpToken:", lpToken)

    // const baseAta = dlmmPool.tokenX.reserve;
    // const quoteAta = dlmmPool.tokenY.reserve;

    if (solBalance < Number(BUY_AMOUNT)) {
        logger.error(`There is not enough balance in your wallet. Please deposit some more solana to continue.`)
        return
    }
    logger.info(`Pumpswap Trading bot is running`)
    logger.info(`Wallet address: ${mainKp.publicKey.toBase58()}`)
    logger.info(`Balance of the main wallet: ${solBalance}Sol`)

    let middleMC = await getTokenMC(TOKEN_CA)
    let mc = Math.floor(middleMC)
    let lowerMC = mc * (1 - LOWER_MC_INTERVAL / 100)
    let higherMC = mc * (1 + HIGHER_MC_INTERVAL / 100)
    const mcCheckInterval = 1000
    let mcChecked = 0
    let bought = false
    let processingToken = false

    logger.info(`Starting MarketCap monitoring, initial MC is ${middleMC}Sol ...`)

    while (1) {

        let tpInterval
        processingToken = true

        while (1) {
            if (mcChecked != 0) {
                middleMC = await getTokenMC(TOKEN_CA)
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
                logger.info(`Buying ${BUY_AMOUNT} SOL`)
                // Quote to Base swap (⬆️)
                await swap(dlmmPool, POOL_ID, NATIVE_MINT, TOKEN_CA, new BN(BUY_AMOUNT * 1_000_000_000), 1000, mainKp);
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
            const ata = await getAssociatedTokenAddress(TOKEN_CA, mainKp.publicKey)
            const tokenDecimals = await getTokenDecimals(solanaConnection, TOKEN_CA)

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const tokenAmount = Number((await solanaConnection.getTokenAccountBalance(ata)).value.amount);

                    // Monitoring pnl
                    attempt = maxRetries
                    const amountIn = tokenAmount

                    try {

                        logger.info("Showing pnl monitoring...")
                        const priceCheckInterval = 200
                        const timesToCheck = SELL_TIMER / priceCheckInterval
                        let TP_LEVEL = 1.3
                        let higherTP = TP_LEVEL
                        let lowerTP = TP_LEVEL - LOWER_TP_INTERVAL

                        const SolOnSl = Number((BUY_AMOUNT * (100 - STOP_LOSS) / 100).toFixed(6))
                        let timesChecked = 0
                        let tpReached = false
                        do {

                            try {
                                // Swap quote
                                const swapYtoX = false;
                                const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

                                const swapQuote = await dlmmPool.swapQuote(new BN(amountIn), swapYtoX, new BN(SLIPPAGE), binArrays);
                                const amountOut = Number(swapQuote.outAmount);

                                console.log("🚀 ~ constbuy_monitor_autosell= ~ amountOut:", amountOut / tokenDecimals)

                                const pnl = (Number(amountOut / tokenDecimals) - BUY_AMOUNT) / BUY_AMOUNT * 100
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

                                logger.info(`Current: ${amountOut / 10 ** 9} SOL | PNL: ${pnl.toFixed(7)}% | HTP: ${higherTP.toFixed(2)}% | LTP: ${lowerTP.toFixed(2)}% | SL: ${SolOnSl}`)
                                const amountOutNum = Number(amountOut / 10 ** 9)

                                if (amountOutNum < SolOnSl) {
                                    logger.fatal("Token is on stop loss level, will sell with loss")
                                    try {
                                        // const latestBlockHash = await (await solanaConnection.getLatestBlockhash()).blockhash
                                        await swap(dlmmPool, POOL_ID, TOKEN_CA, NATIVE_MINT, new BN(tokenAmount), SLIPPAGE, mainKp);
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
                                            await swap(dlmmPool, POOL_ID, TOKEN_CA, NATIVE_MINT, new BN(tokenAmount), SLIPPAGE, mainKp);
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
                                await swap(dlmmPool, POOL_ID, TOKEN_CA, NATIVE_MINT, new BN(tokenAmount), SLIPPAGE, mainKp);
                                break
                            }
                        } while (1)

                        logger.warn(`New pumpswap token ${TOKEN_CA.toBase58()} PNL processing finished once and continue monitoring MarketCap`)
                        // logger.info(`Waiting 5 seconds for new buying and selling...`)
                        await sleep(2000)

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

export const swap = async (dlmmPool: DLMM, pool: PublicKey, inputMint: PublicKey, outputMint: PublicKey, buyAmount: BN, slippage: number, user: Keypair): Promise<TradeResult> => {
    logger.info(`Executing swap: ${buyAmount.toString()} lamports`);
    
    try {
        // Determine swap direction
        let swapYtoX: boolean = false;
        if (inputMint.equals(NATIVE_MINT)) {
            swapYtoX = true;
        }

        // Get bin arrays for swap
        const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
        logger.debug(`Bin arrays retrieved: ${binArrays.length} arrays`);

        // Get swap quote
        const swapQuote = dlmmPool.swapQuote(buyAmount, swapYtoX, new BN(slippage), binArrays);
        logger.info(`Swap quote - Input: ${buyAmount.toString()}, Output: ${swapQuote.outAmount.toString()}, Min Output: ${swapQuote.minOutAmount.toString()}`);

        // Create swap transaction
        const swapTransaction = await dlmmPool.swap({
            inToken: inputMint,
            outToken: outputMint,
            binArraysPubkey: swapQuote.binArraysPubkey,
            inAmount: buyAmount,
            lbPair: dlmmPool.pubkey,
            user: user.publicKey,
            minOutAmount: swapYtoX ? swapQuote.minOutAmount : new BN(0),
        });

        // Set transaction properties
        swapTransaction.feePayer = user.publicKey;
        const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash();
        swapTransaction.recentBlockhash = blockhash;
        swapTransaction.lastValidBlockHeight = lastValidBlockHeight;

        // Simulate transaction
        try {
            const simulationResult = await solanaConnection.simulateTransaction(swapTransaction);
            const { value } = simulationResult;
            
            if (value.err) {
                logger.error("Transaction simulation failed:", value.err);
                throw new Error(`Simulation failed: ${JSON.stringify(value.err)}`);
            } else {
                logger.info("Transaction simulation successful");
            }
        } catch (error: any) {
            throw new Error(`Transaction simulation failed: ${error.message}`);
        }

        // Execute transaction
        const signature = await sendAndConfirmTransaction(solanaConnection, swapTransaction, [user]);
        logger.info(`Swap transaction successful: https://solscan.io/tx/${signature}`);

        return {
            success: true,
            signature,
            amountIn: Number(buyAmount),
            amountOut: Number(swapQuote.outAmount),
            timestamp: Date.now()
        };

    } catch (error: any) {
        logger.error("Swap failed:", error);
        return {
            success: false,
            error: error.message,
            amountIn: Number(buyAmount),
            amountOut: 0,
            timestamp: Date.now()
        };
    }
}

const getTokenPrice = async (mint: PublicKey): Promise<number | null> => {
    try {
        const response = await fetch(`${PRICE_FEED_URL}?ids=${mint}`);
        const data: { data: { [key: string]: { price: number } } } = await response.json();
        const tokenPrice = Number(data.data[`${mint}`]?.price);
        
        if (isNaN(tokenPrice)) {
            logger.warn(`Invalid price data for token ${mint.toBase58()}`);
            return null;
        }
        
        return tokenPrice;
    } catch (error) {
        logger.error("Error fetching token price:", error);
        return null;
    }
}

const getTokenMC = async (mint: PublicKey): Promise<number | null> => {
    try {
        const currentPrice = await getTokenPrice(mint);
        if (!currentPrice) {
            logger.warn(`Could not fetch price for token ${mint.toBase58()}`);
            return null;
        }

        const tokenSupply = await solanaConnection.getTokenSupply(mint);
        const totalSupply = tokenSupply.value.uiAmount;
        
        if (!totalSupply) {
            logger.warn(`Could not fetch supply for token ${mint.toBase58()}`);
            return null;
        }

        const marketCap = currentPrice * totalSupply;
        logger.debug(`Token ${mint.toBase58()} - Price: $${currentPrice}, Supply: ${totalSupply}, MC: $${marketCap}`);
        
        return marketCap;
    } catch (error) {
        logger.error("Error calculating market cap:", error);
        return null;
    }
}

// Generic market cap monitoring function
export const getMarketCapData = async (mint: PublicKey): Promise<MarketCapData | null> => {
    try {
        const currentMC = await getTokenMC(mint);
        if (!currentMC) return null;

        const lowerMC = currentMC * (1 - LOWER_MC_INTERVAL / 100);
        const higherMC = currentMC * (1 + HIGHER_MC_INTERVAL / 100);

        return {
            current: currentMC,
            lower: lowerMC,
            higher: higherMC,
            change: 0, // Could be calculated with previous value
            timestamp: Date.now()
        };
    } catch (error) {
        logger.error("Error getting market cap data:", error);
        return null;
    }
}