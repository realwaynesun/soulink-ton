import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  // TON contract
  OPERATOR_MNEMONIC: z.string().min(1),
  REGISTRY_ADDRESS: z.string().min(1),
  TON_ENDPOINT: z.string().url().default('https://testnet.toncenter.com/api/v2/jsonRPC'),
  TON_API_KEY: z.string().optional(),
  TON_NETWORK: z.enum(['mainnet', 'testnet']).default('testnet'),

  // Server
  PORT: z.coerce.number().default(4022),
  DB_PATH: z.string().default('./soulink-ton.db'),
  CORS_ORIGIN: z.string().default('*'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Pricing (in TON)
  PRICE_SHORT_TON: z.coerce.number().default(1),
  PRICE_STANDARD_TON: z.coerce.number().default(0.2),
})

const parsed = envSchema.parse(process.env)

export const config = {
  operatorMnemonic: parsed.OPERATOR_MNEMONIC,
  registryAddress: parsed.REGISTRY_ADDRESS,
  tonEndpoint: parsed.TON_ENDPOINT,
  tonApiKey: parsed.TON_API_KEY,
  tonNetwork: parsed.TON_NETWORK,
  port: parsed.PORT,
  dbPath: parsed.DB_PATH,
  corsOrigin: parsed.CORS_ORIGIN,
  telegramBotToken: parsed.TELEGRAM_BOT_TOKEN,
  telegramChatId: parsed.TELEGRAM_CHAT_ID,
  priceShortTon: parsed.PRICE_SHORT_TON,
  priceStandardTon: parsed.PRICE_STANDARD_TON,
} as const
