import { TonClient, WalletContractV5R1, internal, SendMode } from '@ton/ton'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { Address, toNano, beginCell, TupleBuilder } from '@ton/core'
import { config } from './config.js'

let client: TonClient | null = null
let operatorCache: {
  wallet: WalletContractV5R1
  keyPair: { publicKey: Buffer; secretKey: Buffer }
} | null = null

export function getTonClient(): TonClient {
  if (!client) {
    client = new TonClient({
      endpoint: config.tonEndpoint,
      apiKey: config.tonApiKey,
    })
  }
  return client
}

async function getOperator() {
  if (!operatorCache) {
    const mnemonic = config.operatorMnemonic.split(' ')
    const keyPair = await mnemonicToPrivateKey(mnemonic)
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey })
    operatorCache = { wallet, keyPair }
  }
  return operatorCache
}

export async function getOperatorAddress(): Promise<string> {
  const { wallet } = await getOperator()
  return wallet.address.toRawString()
}

export interface RegistrationResult {
  txHash: string
  registeredAt: number
}

export async function registerOnChain(
  name: string,
  agentOwner: string,
  soulHash: string,
  paymentAddress: string,
): Promise<RegistrationResult> {
  const tonClient = getTonClient()
  const { wallet, keyPair } = await getOperator()
  const contract = tonClient.open(wallet)
  const seqno = await contract.getSeqno()

  // Record the lt of the latest transaction before sending, so we can identify our tx after
  const preTxs = await tonClient.getTransactions(wallet.address, { limit: 1 })
  const preLt = preTxs.length > 0 ? preTxs[0].lt : 0n

  const registryAddress = Address.parse(config.registryAddress)
  const ownerAddress = Address.parse(agentOwner)
  const payAddr = Address.parse(paymentAddress)

  // Pre-send check: don't waste operator gas if name already taken on-chain
  const alreadyTaken = await isNameTakenOnChain(name)
  if (alreadyTaken) {
    throw new Error('Name already registered on-chain')
  }

  // Opcode: sha256("RegisterAgent{name:^string,agentOwner:address,soulHash:uint256,paymentAddress:address}") >> 224
  const body = beginCell()
    .storeUint(0xbbafb7e3, 32)
    .storeStringTail(name)
    .storeAddress(ownerAddress)
    .storeUint(BigInt(soulHash), 256)
    .storeAddress(payAddr)
    .endCell()

  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [
      internal({
        to: registryAddress,
        value: toNano('0.15'),
        body,
        bounce: true,
      }),
    ],
  })

  // Wait for tx confirmation by polling seqno
  const ownerAddr = Address.parse(agentOwner)
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const currentSeqno = await contract.getSeqno()
    if (currentSeqno > seqno) {
      // Verify the on-chain owner matches — not just "is name taken"
      const resolved = await resolveOnChain(name)
      if (!resolved) {
        throw new Error('Transaction confirmed but name not registered — contract rejected')
      }
      const sbtData = await readSbtData(resolved.sbtAddress)
      if (!sbtData) {
        throw new Error('Transaction confirmed but SBT not initialized')
      }
      if (!Address.parse(sbtData.owner).equals(ownerAddr)) {
        throw new Error('Name registered to different owner — registration was rejected or preempted')
      }
      // soul_hash is the unique fingerprint — proves THIS specific registration succeeded
      if (sbtData.soulHash !== BigInt(soulHash)) {
        throw new Error('Name registered with different soul hash — not our registration')
      }
      const tx = await findOutboundTxHash(wallet.address, registryAddress, preLt)
      return { txHash: tx.hash, registeredAt: tx.timestamp }
    }
  }

  throw new Error('TIMEOUT: Transaction confirmation timeout after 60s')
}

async function findOutboundTxHash(
  walletAddress: Address,
  registryAddress: Address,
  preLt: bigint,
): Promise<{ hash: string; timestamp: number }> {
  const tonClient = getTonClient()
  const PAGE = 30
  let cursor: { lt: string; hash: string } | undefined

  // Paginate until we hit preLt (guaranteed termination) or empty page
  for (;;) {
    const opts: { limit: number; lt?: string; hash?: string } = { limit: PAGE }
    if (cursor) { opts.lt = cursor.lt; opts.hash = cursor.hash }

    const transactions = await tonClient.getTransactions(walletAddress, opts)
    if (transactions.length === 0) break

    for (const tx of transactions) {
      if (tx.lt <= preLt) {
        throw new Error('No outbound transaction to registry found after send')
      }
      for (const outMsg of tx.outMessages.values()) {
        if (outMsg.info.type !== 'internal') continue
        if (outMsg.info.dest.equals(registryAddress)) {
          const hashBuf: Buffer = typeof tx.hash === 'function' ? tx.hash() : tx.hash as Buffer
          return { hash: hashBuf.toString('base64'), timestamp: tx.now }
        }
      }
    }

    const last = transactions[transactions.length - 1]
    const lastHash: Buffer = typeof last.hash === 'function' ? last.hash() : last.hash as Buffer
    cursor = { lt: last.lt.toString(), hash: lastHash.toString('base64') }
  }

  throw new Error('No outbound transaction to registry found after send')
}

export async function isNameTakenOnChain(name: string): Promise<boolean> {
  const tonClient = getTonClient()
  const registryAddress = Address.parse(config.registryAddress)

  const args = new TupleBuilder()
  args.writeString(name)

  const result = await tonClient.runMethod(
    registryAddress,
    'isNameTaken',
    args.build(),
  )
  return result.stack.readBoolean()
}

export async function resolveOnChain(name: string): Promise<{
  index: bigint
  sbtAddress: string
} | null> {
  const tonClient = getTonClient()
  const registryAddress = Address.parse(config.registryAddress)

  const args = new TupleBuilder()
  args.writeString(name)

  const indexResult = await tonClient.runMethod(
    registryAddress,
    'getIndexByName',
    args.build(),
  )

  const index = indexResult.stack.readBigNumberOpt()
  if (index === null) return null

  const addrArgs = new TupleBuilder()
  addrArgs.writeNumber(index)

  const addrResult = await tonClient.runMethod(
    registryAddress,
    'get_nft_address_by_index',
    addrArgs.build(),
  )
  const sbtAddress = addrResult.stack.readAddress()

  return { index, sbtAddress: sbtAddress.toString() }
}

export async function readSbtData(sbtAddress: string): Promise<{
  owner: string
  soulHash: bigint
  paymentAddress: string
  isRevoked: boolean
} | null> {
  const tonClient = getTonClient()
  const addr = Address.parse(sbtAddress)

  const nftData = await tonClient.runMethod(addr, 'get_nft_data')
  const isInitialized = nftData.stack.readBoolean()
  if (!isInitialized) return null

  nftData.stack.readNumber() // index
  nftData.stack.readAddress() // collection
  const owner = nftData.stack.readAddress()
  nftData.stack.readCell() // content

  const soulResult = await tonClient.runMethod(addr, 'getSoulHash')
  const soulHash = soulResult.stack.readBigNumber()

  const payResult = await tonClient.runMethod(addr, 'getPaymentAddress')
  const paymentAddress = payResult.stack.readAddress()

  const revokeResult = await tonClient.runMethod(addr, 'isRevoked')
  const isRevoked = revokeResult.stack.readBoolean()

  return {
    owner: owner.toString(),
    soulHash,
    paymentAddress: paymentAddress.toString(),
    isRevoked,
  }
}

export interface PaymentMatch {
  lt: string
  hash: string
  soulHash: string
}

export async function findMatchingPayment(
  senderAddress: string,
  expectedNanoton: bigint,
  usedLts: Set<string>,
  name: string,
): Promise<PaymentMatch | null> {
  const tonClient = getTonClient()
  const { wallet } = await getOperator()
  const sender = Address.parse(senderAddress)
  const cutoff = Math.floor(Date.now() / 1000) - 600 // 10 min window
  const PAGE = 30
  let cursor: { lt: string; hash: string } | undefined

  // Paginate until we hit the 10-min cutoff (guaranteed termination) or empty page
  for (;;) {
    const opts: { limit: number; lt?: string; hash?: string } = { limit: PAGE }
    if (cursor) { opts.lt = cursor.lt; opts.hash = cursor.hash }

    const transactions = await tonClient.getTransactions(wallet.address, opts)
    if (transactions.length === 0) break

    for (const tx of transactions) {
      if (tx.now < cutoff) return null // past 10-min window — stop all pagination

      const inMsg = tx.inMessage
      if (!inMsg || inMsg.info.type !== 'internal') continue
      if (!inMsg.info.src.equals(sender)) continue
      if (inMsg.info.value.coins < expectedNanoton) continue

      const lt = tx.lt.toString()
      if (usedLts.has(lt)) continue

      // Comment format: "name:soul_hash" — both values committed on-chain by the payer
      const comment = parseTextComment(inMsg.body)
      if (!comment) continue

      const colonIdx = comment.indexOf(':')
      if (colonIdx === -1) continue

      const commentName = comment.slice(0, colonIdx)
      const commentSoulHash = comment.slice(colonIdx + 1)
      if (commentName !== name) continue
      if (!isValidSoulHash(commentSoulHash)) continue

      const hashBuf: Buffer = typeof tx.hash === 'function' ? tx.hash() : tx.hash as Buffer
      return { lt, hash: hashBuf.toString('base64'), soulHash: commentSoulHash }
    }

    const last = transactions[transactions.length - 1]
    const lastHash: Buffer = typeof last.hash === 'function' ? last.hash() : last.hash as Buffer
    cursor = { lt: last.lt.toString(), hash: lastHash.toString('base64') }
  }

  return null
}

function parseTextComment(body: import('@ton/core').Cell): string | null {
  try {
    const slice = body.beginParse()
    const opcode = slice.loadUint(32)
    if (opcode !== 0) return null // not a text comment
    return slice.loadStringTail()
  } catch {
    return null
  }
}

const SOUL_HASH_RE = /^0x[0-9a-f]{64}$/

function isValidSoulHash(s: string): boolean {
  if (!SOUL_HASH_RE.test(s)) return false
  try { BigInt(s); return true } catch { return false }
}

export async function cleanGhostOnChain(itemIndex: bigint): Promise<void> {
  const tonClient = getTonClient()
  const { wallet, keyPair } = await getOperator()
  const contract = tonClient.open(wallet)
  const seqno = await contract.getSeqno()
  const registryAddress = Address.parse(config.registryAddress)

  const body = beginCell()
    .storeUint(0xc1ea9067, 32) // CleanGhostName opcode
    .storeUint(itemIndex, 64)
    .endCell()

  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [
      internal({
        to: registryAddress,
        value: toNano('0.05'),
        body,
        bounce: true,
      }),
    ],
  })

  // Wait for confirmation
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const currentSeqno = await contract.getSeqno()
    if (currentSeqno > seqno) return
  }
  throw new Error('Ghost cleanup transaction confirmation timeout')
}

export async function getWalletPublicKey(walletAddress: string): Promise<bigint> {
  const tonClient = getTonClient()
  const addr = Address.parse(walletAddress)
  const result = await tonClient.runMethod(addr, 'get_public_key')
  return result.stack.readBigNumber()
}

export function getPrice(name: string): number {
  return name.length <= 4 ? config.priceShortTon : config.priceStandardTon
}

export function getPriceNanoton(name: string): bigint {
  const ton = getPrice(name)
  return BigInt(Math.round(ton * 1_000_000_000))
}

export function getPriceInfo() {
  return {
    short_ton: config.priceShortTon,
    standard_ton: config.priceStandardTon,
    short_nanoton: BigInt(Math.round(config.priceShortTon * 1e9)).toString(),
    standard_nanoton: BigInt(Math.round(config.priceStandardTon * 1e9)).toString(),
  }
}
