import { PublicKey } from "@solana/web3.js";
import { main_menu_display, rl, screen_clear, settings_display } from "./src/menu";
import { buy_monitor_autosell, customSwap, mainKp } from "./src/layout/buy";
import { sell_token } from "./src/layout/sell";
import { readSettings, saveSettingsToFile, sleep, wrapSol } from "./src/utils";
import AmmImpl from "@meteora-ag/dynamic-amm-sdk";
import { solanaConnection } from "./src/constants";
import { getAccount, getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";

const testBuy = async () => {
    let data = readSettings()
    // await wrapSol(mainKp, Number(data.amount) * 2)
    const ammImpl = await AmmImpl.create(solanaConnection, new PublicKey(data.poolId!));

    const ata = await getAssociatedTokenAddress(new PublicKey(data.mint!), mainKp.publicKey)
    const tokenAmount = Number((await solanaConnection.getTokenAccountBalance(ata)).value.amount);

    // const result = await customSwap(ammImpl, NATIVE_MINT, Number(data.amount) * 10 ** 9, Number(data.slippage!));
    const result = await customSwap(ammImpl, new PublicKey(data.mint!), tokenAmount, Number(data.slippage!));
    console.log("🚀 ~ testBuy ~ result:", result)
}

// testBuy()

export const init = () => {
    screen_clear();
    console.log("Raydium Trading Bot");

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
                buy_monitor_autosell();
                break;
            case 4:
                sell_token();
                break;
            case 5:
                process.exit(1);
            default:
                console.log("\tInvalid choice!");
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
    console.log("Settings")
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
                init();
                break;
            case 6:
                process.exit(1);
            default:
                console.log("\tInvalid choice!");
                sleep(1500);
                settings_display();
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

const set_slippage = () => {
    screen_clear();
    let data = readSettings()
    let settings = {
        mint: new PublicKey(data.mint!),
        poolId: new PublicKey(data.poolId!),
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
        console.log(`Slippage ${answer}% is set correctly!`)
        settingsWaiting()
    })
}

init()