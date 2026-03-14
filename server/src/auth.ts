import { Address } from '@ton/core'
import { sha256 } from '@ton/crypto'
import nacl from 'tweetnacl'
import { resolveOnChain, readSbtData, getWalletPublicKey } from './ton-contract.js'

const AUTH_MESSAGE_TTL_MS = 300_000 // 5 min

// Valid actions that can appear in signed messages
const VALID_ACTIONS = new Set(['profile', 'credit-report', 'verify'])

interface AuthResult {
  valid: boolean
  error?: string
}

/**
 * Build a body digest from the request payload for signature binding.
 * Deterministic: recursively sorted keys at all nesting levels. Returns hex SHA-256 prefix (16 chars).
 */
export async function bodyDigest(payload: Record<string, unknown>): Promise<string> {
  const { public_key: _, signature: _s, message: _m, ...rest } = payload
  const canonical = JSON.stringify(sortDeep(rest))
  const hash = await sha256(Buffer.from(canonical, 'utf-8'))
  return Buffer.from(hash).toString('hex').slice(0, 16)
}

function sortDeep(val: unknown): unknown {
  if (val === null || typeof val !== 'object') return val
  if (Array.isArray(val)) return val.map(sortDeep)
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(val as Record<string, unknown>).sort()) {
    sorted[key] = sortDeep((val as Record<string, unknown>)[key])
  }
  return sorted
}

function validateMessageFormat(
  agentName: string,
  action: string,
  message: string,
  expectedDigest?: string,
): { valid: true; timestamp: number } | { valid: false; error: string } {
  if (!VALID_ACTIONS.has(action)) {
    return { valid: false, error: `Invalid action "${action}". Valid: ${[...VALID_ACTIONS].join(', ')}` }
  }

  const parts = message.split(':')

  if (expectedDigest !== undefined) {
    // Write actions: "soulink:{name}:{action}:{digest}:{timestamp}"
    if (parts.length !== 5 || parts[0] !== 'soulink' || parts[1] !== agentName || parts[2] !== action) {
      return { valid: false, error: `Invalid message format. Expected "soulink:${agentName}:${action}:{digest}:{timestamp}".` }
    }
    if (parts[3] !== expectedDigest) {
      return { valid: false, error: 'Body digest mismatch — signature does not cover this request body.' }
    }
    const timestamp = parseInt(parts[4], 10)
    if (isNaN(timestamp)) return { valid: false, error: 'Invalid timestamp in message.' }
    const age = Date.now() - timestamp * 1000
    if (age < 0 || age > AUTH_MESSAGE_TTL_MS) return { valid: false, error: 'Message expired or has future timestamp.' }
    return { valid: true, timestamp }
  }

  // Read-only actions: "soulink:{name}:{action}:{timestamp}"
  if (parts.length !== 4 || parts[0] !== 'soulink' || parts[1] !== agentName || parts[2] !== action) {
    return { valid: false, error: `Invalid message format. Expected "soulink:${agentName}:${action}:{timestamp}".` }
  }
  const timestamp = parseInt(parts[3], 10)
  if (isNaN(timestamp)) return { valid: false, error: 'Invalid timestamp in message.' }
  const age = Date.now() - timestamp * 1000
  if (age < 0 || age > AUTH_MESSAGE_TTL_MS) return { valid: false, error: 'Message expired or has future timestamp.' }
  return { valid: true, timestamp }
}

export async function verifyAgentAuth(
  agentName: string,
  action: string,
  publicKeyHex: string,
  signatureHex: string,
  message: string,
  expectedDigest?: string,
): Promise<AuthResult> {
  const msgCheck = validateMessageFormat(agentName, action, message, expectedDigest)
  if (!msgCheck.valid) return msgCheck

  try {
    const messageBytes = Buffer.from(message, 'utf-8')
    const messageHash = await sha256(messageBytes)
    const pubKey = Buffer.from(publicKeyHex, 'hex')
    const sig = Buffer.from(signatureHex, 'hex')

    const isValid = nacl.sign.detached.verify(
      new Uint8Array(messageHash),
      new Uint8Array(sig),
      new Uint8Array(pubKey),
    )

    if (!isValid) {
      return { valid: false, error: 'Signature does not match public key.' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid signature format.' }
  }
}

export async function verifyAgentOwnership(
  agentName: string,
  publicKeyHex: string,
): Promise<AuthResult> {
  const resolved = await resolveOnChain(agentName)
  if (!resolved) {
    return { valid: false, error: 'Agent name not found on-chain.' }
  }

  const sbtData = await readSbtData(resolved.sbtAddress)
  if (!sbtData) {
    return { valid: false, error: 'Agent SBT not initialized.' }
  }

  if (sbtData.isRevoked) {
    return { valid: false, error: 'Agent SBT is revoked.' }
  }

  // Call get_public_key on the owner's wallet contract (works for V1-V5)
  const onChainPubKey = await getWalletPublicKey(sbtData.owner)
  const providedPubKey = BigInt('0x' + publicKeyHex)

  if (onChainPubKey !== providedPubKey) {
    return { valid: false, error: 'Public key does not match on-chain owner.' }
  }

  return { valid: true }
}

// ============================================================
// TON Connect ton_proof verification
// ============================================================

interface TonProofPayload {
  address: string
  proof: {
    timestamp: number
    domain: { value: string; lengthBytes: number }
    payload: string
    signature: string
    state_init?: string
  }
}

export async function verifyTonProof(
  payload: TonProofPayload,
  publicKey: Buffer,
): Promise<AuthResult> {
  try {
    const { address, proof } = payload

    const age = Date.now() / 1000 - proof.timestamp
    if (age < 0 || age > 300) {
      return { valid: false, error: 'Proof expired or has future timestamp.' }
    }

    const addr = Address.parse(address)
    const workchainBuf = Buffer.alloc(4)
    workchainBuf.writeInt32BE(addr.workChain)
    const addressHash = addr.hash

    const domainLenBuf = Buffer.alloc(4)
    domainLenBuf.writeUInt32LE(proof.domain.lengthBytes)
    const domainBuf = Buffer.from(proof.domain.value, 'utf-8')

    const tsBuf = Buffer.alloc(8)
    tsBuf.writeBigUInt64LE(BigInt(proof.timestamp))

    const payloadBuf = Buffer.from(proof.payload, 'utf-8')

    const message = Buffer.concat([
      Buffer.from('ton-proof-item-v2/', 'utf-8'),
      workchainBuf,
      addressHash,
      domainLenBuf,
      domainBuf,
      tsBuf,
      payloadBuf,
    ])

    const messageHash = await sha256(message)

    const prefix = Buffer.concat([
      Buffer.from('ffff', 'hex'),
      Buffer.from('ton-connect', 'utf-8'),
      messageHash,
    ])
    const finalHash = await sha256(prefix)

    const sig = Buffer.from(proof.signature, 'base64')

    const isValid = nacl.sign.detached.verify(
      new Uint8Array(finalHash),
      new Uint8Array(sig),
      new Uint8Array(publicKey),
    )

    if (!isValid) {
      return { valid: false, error: 'Invalid TON proof signature.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'TON proof verification failed.' }
  }
}
