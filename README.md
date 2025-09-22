# pumpswap-sdk for trading bot

PumpSwap SDK for trading bot.

PumpSwap SDK is upgrading now.

`npm i pump-swap-core-v1`

`yarn add pump-swap-core-v1`

# How to use

### Buy Instruction

```
 const buyTx = new Transaction()
        .add(
            createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, user_base_token_account, payer.publicKey, base_mint),
            createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, user_quote_token_account, payer.publicKey, NATIVE_MINT),
            SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: user_quote_token_account,
                lamports: Number(quote_amt),
            }),
            createSyncNativeInstruction(user_quote_token_account)
        );

    buyTx.add(
        await pSwap.getBuyInstruction(base_amt, quote_amt, {
            pool,
            baseMint: base_mint,
            quoteMint: NATIVE_MINT,
            baseTokenProgram: TOKEN_PROGRAM_ID,
            quoteTokenProgram: TOKEN_PROGRAM_ID,
            user: payer.publicKey
        })
    )
```

# Preference

You can find example file for Transaction in [Here](https://github.com/vvizardev/pumpswap-sdk/tree/main/src/example)

[Contact](https://github.com/vvizardev) for debug & report
