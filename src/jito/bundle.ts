import bs58 from 'bs58';

import { logger } from '../utils/logger';

// import { newTokenTimestampPerf } from '../streaming/raydium';

import {
    PRIVATE_KEY,
    BLOCKENGINE_URL,
    JITO_TIP,
    RPC_ENDPOINT,
    RPC_WEBSOCKET_ENDPOINT
} from '../constants';

import {
    PublicKey,
    Keypair,
    VersionedTransaction,
    MessageV0,
    Connection
} from '@solana/web3.js';

import { Bundle } from 'jito-ts/dist/sdk/block-engine/types';
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';

const SIGNER_WALLET = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY!));

const blockEngineUrl = BLOCKENGINE_URL || '';
// console.log('BLOCK_ENGINE_URL:', blockEngineUrl);
const c = searcherClient(blockEngineUrl, undefined);

const solanaConnection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment: "processed"
})

// Get Tip Accounts
let tipAccounts: string[] = [];
(async () => {
    try {
        const result = await c.getTipAccounts(); // Result<string[], SearcherClientError>
        if (result.ok) {
            tipAccounts = result.value; // Access the successful value
            // console.log('Result:', tipAccounts);
        } else {
            console.error('Error:', result.error); // Access the error
        }
    } catch (error) {
        console.error('Unexpected Error:', error); // Handle unexpected errors
    }
})();

export async function sendBundle(poolId: string, latestBlockhash: string, message: MessageV0, mint: PublicKey) {

    try {

        const transaction = new VersionedTransaction(message);

        transaction.sign([SIGNER_WALLET]);

        console.log("simulation => ", await solanaConnection.simulateTransaction(transaction, { sigVerify: true }))

        const _tipAccount = tipAccounts[Math.floor(Math.random() * 6)];
        const tipAccount = new PublicKey(_tipAccount);
        const tipAmount: number = Number(JITO_TIP);


        const b = new Bundle([transaction], 2);
        b.addTipTx(
            SIGNER_WALLET,
            tipAmount,      // Adjust Jito tip amount here
            tipAccount,
            latestBlockhash
        );


        const bundleResult = await c.sendBundle(b);

        const bundleTimestampPerf = performance.now()
        const bundleTimestampDate = new Date();
        const bundleTimeFormatted = `${bundleTimestampDate.getHours().toString().padStart(2, '0')}:${bundleTimestampDate.getMinutes().toString().padStart(2, '0')}:${bundleTimestampDate.getSeconds().toString().padStart(2, '0')}.${bundleTimestampDate.getMilliseconds().toString().padStart(3, '0')}`;
        // const elapsedStreamToBundlePerf = bundleTimestampPerf - newTokenTimestampPerf;

        // logger.warn(`Time Elapsed (Streamed > Bundle send): ${elapsedStreamToBundlePerf}ms`);
        logger.info(`Time bundle sent: ${bundleTimeFormatted} | bundleResult = ${bundleResult}`);
        logger.info(`https://dexscreener.com/solana/${poolId}?maker=${SIGNER_WALLET.publicKey}`);
        logger.info(`https://dexscreener.com/solana/${poolId}`);

    } catch (error) {
        logger.error(error);
    }

}