import { PublicKey } from "@solana/web3.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { TradingConfig, DEXPlatform, TradingStrategy } from "../types";

const CONFIG_FILE = "settings.json";
const ENV_FILE = ".env";

export interface BotConfig {
  trading: TradingConfig;
  platform: DEXPlatform;
  strategy: TradingStrategy;
  marketCap: {
    lowerInterval: number;
    higherInterval: number;
    lowerTPInterval: number;
    higherTPInterval: number;
  };
  tradingParams: {
    buyAmount: number;
    sellTimer: number;
    stopLoss: number;
    slippage: number;
  };
}

export const defaultConfig: BotConfig = {
  trading: {
    mint: "",
    poolId: "",
    amount: 0.01,
    slippage: 50,
    isPump: false,
    platform: "meteora"
  },
  platform: "meteora",
  strategy: "market_cap_monitor",
  marketCap: {
    lowerInterval: 5,
    higherInterval: 10,
    lowerTPInterval: 5,
    higherTPInterval: 10
  },
  tradingParams: {
    buyAmount: 0.01,
    sellTimer: 30000,
    stopLoss: 10,
    slippage: 50
  }
};

export const loadConfig = (): BotConfig => {
  try {
    if (existsSync(CONFIG_FILE)) {
      const configData = readFileSync(CONFIG_FILE, "utf8");
      const parsed = JSON.parse(configData);
      return { ...defaultConfig, ...parsed };
    }
  } catch (error) {
    console.warn("Failed to load config file, using defaults:", error);
  }
  return defaultConfig;
};

export const saveConfig = (config: BotConfig): void => {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Failed to save config:", error);
  }
};

export const loadEnvConfig = (): Partial<BotConfig> => {
  const envConfig: Partial<BotConfig> = {};
  
  try {
    if (existsSync(ENV_FILE)) {
      const envData = readFileSync(ENV_FILE, "utf8");
      const lines = envData.split("\n");
      
      for (const line of lines) {
        const [key, value] = line.split("=");
        if (key && value) {
          switch (key.trim()) {
            case "BUY_AMOUNT":
              envConfig.tradingParams = { ...envConfig.tradingParams, buyAmount: Number(value) };
              break;
            case "SLIPPAGE":
              envConfig.tradingParams = { ...envConfig.tradingParams, slippage: Number(value) };
              break;
            case "SELL_TIMER":
              envConfig.tradingParams = { ...envConfig.tradingParams, sellTimer: Number(value) };
              break;
            case "STOP_LOSS":
              envConfig.tradingParams = { ...envConfig.tradingParams, stopLoss: Number(value) };
              break;
            case "LOWER_MC_INTERVAL":
              envConfig.marketCap = { ...envConfig.marketCap, lowerInterval: Number(value) };
              break;
            case "HIGHER_MC_INTERVAL":
              envConfig.marketCap = { ...envConfig.marketCap, higherInterval: Number(value) };
              break;
            case "LOWER_TP_INTERVAL":
              envConfig.marketCap = { ...envConfig.marketCap, lowerTPInterval: Number(value) };
              break;
            case "HIGHER_TP_INTERVAL":
              envConfig.marketCap = { ...envConfig.marketCap, higherTPInterval: Number(value) };
              break;
            case "DEX_PLATFORM":
              envConfig.platform = value.trim() as DEXPlatform;
              break;
            case "TRADING_STRATEGY":
              envConfig.strategy = value.trim() as TradingStrategy;
              break;
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to load environment config:", error);
  }
  
  return envConfig;
};

export const mergeConfigs = (base: BotConfig, env: Partial<BotConfig>): BotConfig => {
  return {
    ...base,
    ...env,
    trading: { ...base.trading, ...env.trading },
    marketCap: { ...base.marketCap, ...env.marketCap },
    tradingParams: { ...base.tradingParams, ...env.tradingParams }
  };
};

export const validateConfig = (config: BotConfig): string[] => {
  const errors: string[] = [];
  
  if (!config.trading.mint) {
    errors.push("Token mint address is required");
  }
  
  if (!config.trading.poolId && config.platform !== "meteora") {
    errors.push("Pool ID is required for non-Meteora platforms");
  }
  
  if (config.trading.amount <= 0) {
    errors.push("Trading amount must be greater than 0");
  }
  
  if (config.trading.slippage < 0 || config.trading.slippage > 100) {
    errors.push("Slippage must be between 0 and 100");
  }
  
  if (config.tradingParams.buyAmount <= 0) {
    errors.push("Buy amount must be greater than 0");
  }
  
  if (config.tradingParams.sellTimer <= 0) {
    errors.push("Sell timer must be greater than 0");
  }
  
  if (config.tradingParams.stopLoss < 0 || config.tradingParams.stopLoss > 100) {
    errors.push("Stop loss must be between 0 and 100");
  }
  
  return errors;
};

export const getConfig = (): BotConfig => {
  const baseConfig = loadConfig();
  const envConfig = loadEnvConfig();
  const mergedConfig = mergeConfigs(baseConfig, envConfig);
  
  const errors = validateConfig(mergedConfig);
  if (errors.length > 0) {
    console.warn("Configuration validation warnings:");
    errors.forEach(error => console.warn(`- ${error}`));
  }
  
  return mergedConfig;
};
