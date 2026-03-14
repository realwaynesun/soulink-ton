# TON Auth & Contract Interaction Research

## TON Proof (ton_proof) — Equivalent of EIP-191

### How It Works
Wallet signs structured message with Ed25519. Backend reconstructs and verifies.

### Signed Message Format
```
message = utf8("ton-proof-item-v2/")
        ++ workchain       (4 bytes, big-endian)
        ++ address_hash    (32 bytes)
        ++ domain_length   (4 bytes, little-endian)
        ++ domain_string   (UTF-8)
        ++ timestamp       (8 bytes, little-endian)
        ++ payload         (UTF-8, the nonce)

signature = Ed25519Sign(privkey, sha256(0xffff ++ "ton-connect" ++ sha256(message)))
```

### Verification Steps
1. Parse `stateInit` from proof → extract ed25519 public key
2. Verify `contractAddress(workchain, stateInit) == claimed address`
3. Match stateInit code against known wallet versions (V1R1–V5R1)
4. Reconstruct message, double SHA-256, `nacl.sign.detached.verify`

### Public Key Extraction from stateInit
Each wallet version stores public key at different offset:
- V1-V2: seqno(32) + publicKey(256)
- V3: seqno(32) + walletId(32) + publicKey(256)
- V4: seqno(32) + walletId(32) + publicKey(256) + plugins(ref?)
- V5: isSignatureAuthAllowed(1) + seqno(32) + walletId(32) + publicKey(256)

Fallback: call `get_public_key` get-method on deployed wallet.

### Packages Needed
```
@ton/ton        — TonClient, WalletContractV4, wallet version matching
@ton/core       — Address, Cell, Slice, beginCell, TupleBuilder
@ton/crypto     — sha256, mnemonicToPrivateKey
tweetnacl       — nacl.sign.detached.verify for Ed25519
```

### Reference Implementation
`github.com/ton-connect/demo-dapp-with-react-ui/blob/master/src/server/services/ton-proof-service.ts`

## Reading Smart Contract State

```typescript
import { TonClient } from '@ton/ton'
import { Address, TupleBuilder } from '@ton/core'

const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' })

// No params
const result = await client.runMethod(Address.parse('EQ...'), 'totalSupply')
const value = result.stack.readNumber()

// With params
const args = new TupleBuilder()
args.writeString('alice')
const result2 = await client.runMethod(addr, 'isNameTaken', args.build())
const taken = result2.stack.readBoolean()

// Stack readers: readNumber(), readBigNumber(), readAddress(), readCell(), readBoolean()
```

## Sending Transactions (Operator Pattern)

```typescript
import { TonClient, WalletContractV4, internal } from '@ton/ton'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { toNano, beginCell } from '@ton/core'

const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '))
const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey })
const contract = client.open(wallet)

const seqno = await contract.getSeqno()
await contract.sendTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [
    internal({
      to: registryAddress,
      value: toNano('0.15'),
      body: someCell, // beginCell()...endCell()
      bounce: true,
    }),
  ],
})
```

V4 wallets support 4 messages per transaction. V5 supports 255.

## EVM → TON Mapping

| EVM (current Soulink) | TON |
|---|---|
| `viem.verifyMessage()` | Double SHA-256 + `nacl.sign.detached.verify` |
| `OPERATOR_PRIVATE_KEY` (hex) | `OPERATOR_MNEMONIC` (24 words) |
| Viem public client | `@ton/ton` TonClient |
| Viem wallet client | WalletContractV4 + `sendTransfer` |
| `0x`-prefixed addresses | Workchain:hash (base64 or raw) |
| USDC (ERC-20) | TON native or USDT jetton (TEP-74) |
| EIP-191 signed message | ton_proof or custom `soulink:{name}:{ts}` |

## API Providers

| Provider | Endpoint | Free Limit |
|---|---|---|
| Toncenter | `https://toncenter.com/api/v2/jsonRPC` | 1 req/sec |
| TonAPI | `https://tonapi.io` | 1 req/4sec |

Use Toncenter with TonClient for contract interaction. TonAPI for indexed queries (NFTs, events).
