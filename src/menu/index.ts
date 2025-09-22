import readline from "readline"

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

export const screen_clear = () => {
    console.clear();
}

export const main_menu_display = () => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    Solana Trading Bot                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('\t[1] - Show Current Settings');
    console.log('\t[2] - Configure Settings');
    console.log('\t[3] - Start Automated Trading');
    console.log('\t[4] - Manual Sell Token');
    console.log('\t[5] - Show Wallet Balance');
    console.log('\t[6] - Exit');
    console.log('\n' + '═'.repeat(70));
}

export const settings_display = () => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      Configuration                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('\t[1] - Token Contract Address');
    console.log('\t[2] - Pool ID');
    console.log('\t[3] - Trading Amount (SOL)');
    console.log('\t[4] - Slippage (%)');
    console.log('\t[5] - DEX Platform');
    console.log('\t[6] - Market Cap Settings');
    console.log('\t[7] - Trading Strategy');
    console.log('\t[8] - Back to Main Menu');
    console.log('\t[9] - Exit');
    console.log('\n' + '═'.repeat(70));
}

export const market_cap_settings_display = () => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                  Market Cap Settings                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('\t[1] - Lower MC Interval (%)');
    console.log('\t[2] - Higher MC Interval (%)');
    console.log('\t[3] - Lower Take Profit Interval (%)');
    console.log('\t[4] - Higher Take Profit Interval (%)');
    console.log('\t[5] - Stop Loss (%)');
    console.log('\t[6] - Sell Timer (ms)');
    console.log('\t[7] - Back to Settings');
    console.log('\t[8] - Exit');
    console.log('\n' + '═'.repeat(70));
}

export const dex_platform_display = () => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    DEX Platform Selection                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('\t[1] - Meteora DLMM');
    console.log('\t[2] - Raydium');
    console.log('\t[3] - Orca');
    console.log('\t[4] - Jupiter Aggregator');
    console.log('\t[5] - Back to Settings');
    console.log('\t[6] - Exit');
    console.log('\n' + '═'.repeat(70));
}

export const trading_strategy_display = () => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                   Trading Strategy                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('\t[1] - Market Cap Monitoring');
    console.log('\t[2] - Price Monitoring');
    console.log('\t[3] - Manual Trading');
    console.log('\t[4] - Back to Settings');
    console.log('\t[5] - Exit');
    console.log('\n' + '═'.repeat(70));
}

export const display_welcome = () => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║              Welcome to Solana Trading Bot                   ║');
    console.log('║                                                              ║');
    console.log('║         Advanced automated trading for Solana DEXs           ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

export const display_error = (message: string) => {
    console.log('\n❌ Error:', message);
    console.log('═'.repeat(70));
}

export const display_success = (message: string) => {
    console.log('\n✅ Success:', message);
    console.log('═'.repeat(70));
}

export const display_info = (message: string) => {
    console.log('\nℹ️  Info:', message);
    console.log('═'.repeat(70));
}