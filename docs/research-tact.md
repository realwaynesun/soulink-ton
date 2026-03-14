# Tact Smart Contract Research

## Tact Language Basics

### Types
- `Int`: 257-bit signed at runtime. Use `as uint32`, `as uint64`, `as coins` for storage.
- `Bool`: 1 bit. `Address`: 267 bits. `Cell`: up to 1023 bits + 4 refs.
- `map<K, V>`: Keys: `Int`, `Address`. Max ~30K entries.
- `String`, `StringBuilder` for text.

### Structs vs Messages
```tact
struct AgentData { name: String; owner: Address; }
message(0x12345678) RegisterAgent { name: String; owner: Address; }
```
Messages have 32-bit opcode header. Structs are pure data.

### Contract Pattern
```tact
import "@stdlib/ownable";
contract Registry with Ownable {
    owner: Address;
    init(owner: Address) { self.owner = owner; }
    receive(msg: RegisterAgent) { self.requireOwner(); }
    get fun totalSupply(): Int { return self.nextIndex; }
}
```

### Traits
- `Ownable`: `requireOwner()` throws exit code 132.
- `OwnableTransferable`: two-step ownership transfer.
- `Deployable`: deprecated since Tact 1.6.

### Receivers
- `receive(msg: Type)` — typed message
- `receive("Mint")` — string comment
- `receive()` — empty (accepts TON)
- `bounced(msg: bounced<Type>)` — bounce handler

## TON NFT Architecture (TEP-62)

**Two-contract pattern** — each NFT is its own contract:
- Collection: stores `next_item_index`, deploys items
- Item: individual contract per NFT

Collection required getters:
- `get_collection_data()` → (next_item_index, content, owner)
- `get_nft_address_by_index(index)` → Address (deterministic via `initOf`)
- `get_nft_content(index, individual_content)` → Cell

Item required getter:
- `get_nft_data()` → (is_initialized, index, collection, owner, content)

Standard opcodes:
- `0x5fcc3d14` Transfer
- `0x05138d91` OwnershipAssigned
- `0xd53276db` Excesses
- `0x2fcb26a2` GetStaticData

## SBT Standard (TEP-85)

Extends TEP-62 — non-transferable, with:
- `authority_address` — can revoke
- `ProveOwnership` (0x04ded148) — agent proves identity to other contracts
- `OwnershipProof` (0x0524c7ae) — proof response
- `Revoke` (0x6f89f5e3) — authority revokes
- `Destroy` (0x1f04537a) — owner burns own SBT

**Agent identity = SBT.** Non-transferable, revocable by operator, with on-chain ownership proof.

## Metadata (TEP-64)

Off-chain (prefix `0x01` + URL) — recommended for hackathon.
On-chain (prefix `0x00` + dictionary) — more complex.

## Name Uniqueness

Use `map<Int as uint256, Int as uint64>` on collection:
- Key: `sha256(name)` computed as `beginCell().storeSlice(name.asSlice()).endCell().hash()`
- Value: item index
- Check: `self.nameHashes.exists(nameHash)` before minting

## On-Chain Signature Verification

```tact
fun checkSignature(hash: Int, signature: Slice, publicKey: Int): Bool;
```
First 10 calls: ~26 gas. 11th+: 4000+ gas.

## Blueprint Commands

```bash
npm create ton@latest -- ProjectName --type tact-empty --contractName ContractName
npx blueprint build
npx blueprint test
npx blueprint run deployScript --testnet --tonconnect
```

## Storage Limits

| Metric | Limit |
|--------|-------|
| Bits per cell | 1,023 |
| Refs per cell | 4 |
| Cells per contract | ~65,536 |
| Max map entries | ~30,000 |
| Gas per map update | ~500 |
