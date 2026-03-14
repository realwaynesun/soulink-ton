export {
  getTonClient,
  getOperatorAddress,
  getPrice,
  getPriceNanoton,
  getPriceInfo,
  registerOnChain,
  isNameTakenOnChain,
  resolveOnChain,
  readSbtData,
  findMatchingPayment,
  cleanGhostOnChain,
  getWalletPublicKey,
} from './ton-contract.js'
export type { PaymentMatch, RegistrationResult } from './ton-contract.js'
