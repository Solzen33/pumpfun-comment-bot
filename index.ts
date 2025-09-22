import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
    main_menu_display, 
    rl, 
    screen_clear, 
    settings_display,
    market_cap_settings_display,
    dex_platform_display,
    trading_strategy_display,
    display_welcome,
    display_error,
    display_success,
    display_info
} from "./src/menu";
import { readSettings, saveSettingsToFile, sleep } from "./src/utils/utils";
import { swap, buy_monitor_autosell, mainKp } from "./src/layout/buy";
import { sell_token } from "./src/layout/sell";
import { solanaConnection, DEX_PLATFORM, PRICE_FEED_URL } from "./src/constants";
import DLMM from '@meteora-ag/dlmm'
import { BN } from "bn.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { DEXPlatform, TradingStrategy } from "./src/types";

export async function fetchDLMMPoolId(tokenAddress: string) {
    const url = `https://dlmm-api.meteora.ag/pair/all_by_groups?sort_key=tvl&order_by=desc&search_term=${tokenAddress}`;
    // console.log(url);
    const response = await (await fetch(url)).json();

    const listOfGroups = response.groups;
    for (const group of listOfGroups) {
        for (const pair of group.pairs) {
            if (pair.mint_x === tokenAddress || pair.mint_y === tokenAddress) {
                console.log("Found matching pool address:", pair.address);
                return pair.address;
            }
        }
    }

    return "";
}

const testBuy = async () => {
    const data = readSettings();
    const BUY_AMOUNT = Number(data.amount); // Convert to lamports
    const TOKEN_CA = new PublicKey(data.mint!);
    // const POOL_ID = new PublicKey(data.poolId!);

    const poolId = await fetchDLMMPoolId(data.mint!);
    console.log("🚀 ~ testBuy ~ POOL_ID:", poolId)
    const POOL_ID = new PublicKey(poolId);

    const dlmmPool = await DLMM.create(solanaConnection, POOL_ID);
    console.log("🚀 ~ testBuy ~ dlmmPool:", dlmmPool)

    const result = await swap(dlmmPool, POOL_ID, NATIVE_MINT, TOKEN_CA, new BN(BUY_AMOUNT * 10 ** 9), 1000, mainKp);
    console.log("🚀 ~ testBuy ~ result:", result)
}

export const init = () => {
    screen_clear();
    display_welcome();
    main_menu_display();

    rl.question("\t[Main] - Choice: ", async (answer: string) => {
        let choice = parseInt(answer);
        switch (choice) {
            case 1:
                show_settings();
                break;
            case 2:
                settings();
                break;
            case 3:
                start_automated_trading();
                break;
            case 4:
                sell_token();
                break;
            case 5:
                show_wallet_balance();
                break;
            case 6:
                process.exit(0);
            default:
                display_error("Invalid choice! Please select a valid option.");
                await sleep(1500);
                init();
                break;
        }
    })
}

export const mainMenuWaiting = () => {
    rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
        init()
    })
}

const show_settings = async () => {
    let data = readSettings()

    console.log("Current settings of Trading bot...")
    console.log(data)
    mainMenuWaiting()
}

const settings = () => {
    screen_clear();
    settings_display();

    rl.question("\t[Settings] - Choice: ", (answer: string) => {
        let choice = parseInt(answer);
        switch (choice) {
            case 1:
                set_mint();
                break;
            case 2:
                set_poolid();
                break;
            case 3:
                set_amount();
                break;
            case 4:
                set_slippage();
                break;
            case 5:
                set_dex_platform();
                break;
            case 6:
                market_cap_settings();
                break;
            case 7:
                trading_strategy_settings();
                break;
            case 8:
                init();
                break;
            case 9:
                process.exit(0);
            default:
                display_error("Invalid choice! Please select a valid option.");
                sleep(1500);
                settings();
                break;
        }
    })
}

const settingsWaiting = () => {
    rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
        settings()
    })
}

const set_mint = () => {
    screen_clear();
    let data = readSettings()
    let settings = {
        mint: new PublicKey(data.mint!),
        poolId: new PublicKey(data.poolId!),
        isPump: data.isPump!,
        amount: Number(data.amount),
        slippage: Number(data.slippage)
    }
    console.log(`Please Enter the contract address of the token you want, current mint is ${settings.mint}`)
    rl.question("\t[Contract Address of the token] - Address: ", (answer: string) => {
        if (answer == 'c') {
            settingsWaiting()
            return
        }
        let choice = new PublicKey(answer);
        settings.mint = choice
        saveSettingsToFile(settings)
        console.log(`Mint ${answer} is set correctly!`)
        settingsWaiting()
    })
}

const set_poolid = () => {
    screen_clear();
    let data = readSettings()
    let settings = {
        mint: new PublicKey(data.mint!),
        poolId: new PublicKey(data.poolId!),
        isPump: data.isPump!,
        amount: Number(data.amount),
        slippage: Number(data.slippage)
    }
    console.log(`Please Enter the Pool address of the token you want, current poolId is ${settings.poolId}`)
    rl.question("\t[Pool Address of the token] - Address: ", (answer: string) => {
        if (answer == 'c') {
            settingsWaiting()
            return
        }
        let choice = new PublicKey(answer);
        settings.poolId = choice
        saveSettingsToFile(settings)
        console.log(`PoolId ${answer} is set correctly!`)
        settingsWaiting()
    })
}

const set_amount = () => {
    screen_clear();
    let data = readSettings()
    let settings = {
        mint: new PublicKey(data.mint!),
        poolId: new PublicKey(data.poolId!),
        isPump: data.isPump!,
        amount: Number(data.amount),
        slippage: Number(data.slippage)
    }
    console.log(`Please Enter the amount you want, current amount is ${settings.amount}`)
    rl.question("\t[Number of Wallets] - Number: ", (answer: string) => {
        if (answer == 'c') {
            settingsWaiting()
            return
        }
        let choice = Number(answer);
        settings.amount = choice
        saveSettingsToFile(settings)
        console.log(`Buy amount ${answer} is set correctly!`)
        settingsWaiting()
    })
}

const set_pump = () => {
    screen_clear();
    let data = readSettings()
    let settings = {
        mint: new PublicKey(data.mint!),
        poolId: new PublicKey(data.poolId!),
        isPump: data.isPump!,
        amount: Number(data.amount),
        slippage: Number(data.slippage)
    }
    console.log(`Please Enter 0 or 1 depends the token is Pumpfun token or not, current value is ${settings.isPump}`)
    rl.question("\t[Is Pumpfun token?] - Number: ", (answer: string) => {
        if (answer == 'c') {
            settingsWaiting()
            return
        }
        let choice: Boolean = parseInt(answer) == 0 ? false : true;
        settings.isPump = choice
        saveSettingsToFile(settings)
        console.log(`Take Profit ${answer}% is set correctly!`)
        settingsWaiting()
    })
}

const set_slippage = () => {
    screen_clear();
    let data = readSettings()
    let settings = {
        mint: new PublicKey(data.mint!),
        poolId: new PublicKey(data.poolId!),
        isPump: data.isPump!,
        amount: Number(data.amount),
        slippage: Number(data.slippage)
    }
    console.log(`Please Enter the Number for slippage you want, current value is ${settings.slippage}`)
    rl.question("\t[Percent of Slippage ] - Number: ", (answer: string) => {
        if (answer == 'c') {
            settingsWaiting()
            return
        }
        let choice = parseInt(answer);
        settings.slippage = choice
        saveSettingsToFile(settings)
        display_success(`Slippage ${answer}% is set correctly!`)
        settingsWaiting()
    })
}

// New functions for enhanced functionality
const start_automated_trading = async () => {
    screen_clear();
    display_info("Starting automated trading with market cap monitoring...");
    try {
        await buy_monitor_autosell();
    } catch (error) {
        display_error(`Trading failed: ${error}`);
        mainMenuWaiting();
    }
}

const show_wallet_balance = async () => {
    screen_clear();
    try {
        const balance = await solanaConnection.getBalance(mainKp.publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        display_info(`Wallet Address: ${mainKp.publicKey.toBase58()}`);
        display_info(`SOL Balance: ${solBalance.toFixed(6)} SOL`);
        mainMenuWaiting();
    } catch (error) {
        display_error(`Failed to fetch balance: ${error}`);
        mainMenuWaiting();
    }
}

const set_dex_platform = () => {
    screen_clear();
    dex_platform_display();
    
    rl.question("\t[DEX Platform] - Choice: ", (answer: string) => {
        let choice = parseInt(answer);
        let platform: DEXPlatform;
        
        switch (choice) {
            case 1:
                platform = "meteora";
                break;
            case 2:
                platform = "raydium";
                break;
            case 3:
                platform = "orca";
                break;
            case 4:
                platform = "jupiter";
                break;
            case 5:
                settings();
                return;
            case 6:
                process.exit(0);
            default:
                display_error("Invalid choice! Please select a valid option.");
                sleep(1500);
                set_dex_platform();
                return;
        }
        
        display_success(`DEX Platform set to: ${platform}`);
        settingsWaiting();
    })
}

const market_cap_settings = () => {
    screen_clear();
    market_cap_settings_display();
    
    rl.question("\t[Market Cap Settings] - Choice: ", (answer: string) => {
        let choice = parseInt(answer);
        switch (choice) {
            case 1:
                set_lower_mc_interval();
                break;
            case 2:
                set_higher_mc_interval();
                break;
            case 3:
                set_lower_tp_interval();
                break;
            case 4:
                set_higher_tp_interval();
                break;
            case 5:
                set_stop_loss();
                break;
            case 6:
                set_sell_timer();
                break;
            case 7:
                settings();
                break;
            case 8:
                process.exit(0);
            default:
                display_error("Invalid choice! Please select a valid option.");
                sleep(1500);
                market_cap_settings();
                break;
        }
    })
}

const trading_strategy_settings = () => {
    screen_clear();
    trading_strategy_display();
    
    rl.question("\t[Trading Strategy] - Choice: ", (answer: string) => {
        let choice = parseInt(answer);
        let strategy: TradingStrategy;
        
        switch (choice) {
            case 1:
                strategy = "market_cap_monitor";
                break;
            case 2:
                strategy = "price_monitor";
                break;
            case 3:
                strategy = "manual";
                break;
            case 4:
                settings();
                return;
            case 5:
                process.exit(0);
            default:
                display_error("Invalid choice! Please select a valid option.");
                sleep(1500);
                trading_strategy_settings();
                return;
        }
        
        display_success(`Trading strategy set to: ${strategy}`);
        settingsWaiting();
    })
}

// Placeholder functions for market cap settings
const set_lower_mc_interval = () => {
    display_info("Lower MC Interval setting - Implementation needed");
    settingsWaiting();
}

const set_higher_mc_interval = () => {
    display_info("Higher MC Interval setting - Implementation needed");
    settingsWaiting();
}

const set_lower_tp_interval = () => {
    display_info("Lower TP Interval setting - Implementation needed");
    settingsWaiting();
}

const set_higher_tp_interval = () => {
    display_info("Higher TP Interval setting - Implementation needed");
    settingsWaiting();
}

const set_stop_loss = () => {
    display_info("Stop Loss setting - Implementation needed");
    settingsWaiting();
}

const set_sell_timer = () => {
    display_info("Sell Timer setting - Implementation needed");
    settingsWaiting();
}

init()