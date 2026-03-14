# Soulink on TON — CLAUDE.md

## What This Is

TON port of Soulink for the TON AI Hackathon (identityhub.app). Brings AI agent identity, verification, and credit scoring to the TON/Telegram ecosystem.

## Architecture

- **`contracts/`** — Tact smart contracts. `AgentRegistry` (SBT Collection, TEP-62/85) + `AgentSBT` (Soulbound Token Item). Blueprint tooling.
- **`server/`** — Express 5 API. Adapted from Soulink EVM server. Uses `@ton/ton` + `@ton/crypto` for chain interaction, `tweetnacl` for ed25519 verification.
- **`mini-app/`** — Telegram Mini App. React 19 + Vite + `@tonconnect/ui-react` + `@telegram-apps/sdk-react`.
- **`mcp-server/`** — MCP server for AI agent integration. 7 tools: search, resolve, credit, reports, report, verify, profile.

## Build Commands

```bash
# Contracts (Tact + Blueprint)
cd contracts && npm install && npx blueprint build && npx blueprint test
cd contracts && npx blueprint run deployAgentRegistry --testnet --tonconnect

# Server
cd server && npm install && npm run dev     # port 4022
cd server && npm run test

# Mini App
cd mini-app && npm install && npm run dev   # port 5173

# MCP Server
cd mcp-server && npm install && npm run dev
```

## Key Patterns

- **SBT (Soulbound Token)**: Agent identities are non-transferable NFTs (TEP-85). Each registration deploys a new `AgentSBT` contract.
- **Operator pattern**: Server wallet is the only authorized caller of `RegisterAgent`. Agents pay TON to server, server calls contract.
- **Name uniqueness**: `nameHashes` map on the collection stores `sha256(name) → itemIndex`. Max ~30K names.
- **Auth**: Two modes — (1) Body-bound `soulink:{name}:{action}:{body_digest}:{timestamp}` for write ops, `soulink:{name}:{action}:{timestamp}` for read-only (actions: profile, credit-report, verify), (2) TON Connect `ton_proof` for Mini App auth. Body digest = first 16 hex chars of SHA-256 of canonical JSON (sorted keys, auth fields excluded).
- **Off-chain metadata**: TEP-64 prefix `0x01`. Collection content = `0x01 + base_url`. `get_nft_content()` concatenates base URL + item name. Server serves metadata at `GET /api/v1/nft/` (collection) and `GET /api/v1/nft/:name` (item).

## TON-specific Notes

- Addresses use `workchain:hash` format (not `0x`-prefixed like EVM)
- Ed25519 signatures (not secp256k1/ECDSA)
- Each NFT is its own contract (sharded pattern, unlike EVM's single-contract ERC-721)
- Gas is paid in TON (not a stablecoin)
- Wallet mnemonic is 24 words (not hex private key)

## Research Docs (read these before coding)

Deep technical research is saved in `docs/`:
- **`docs/research-tact.md`** — Tact language, TEP-62/85 NFT/SBT standards, Blueprint tooling, storage limits
- **`docs/research-ton-auth.md`** — ton_proof verification, contract interaction from Node.js, operator pattern, EVM→TON mapping
- **`docs/research-mini-app.md`** — Telegram SDK init, TON Connect, payment flow, BotFather setup, iOS gotchas

## Current Status (2026-03-13)

Scaffold complete. All 4 packages have source code written:
- Smart contract: `AgentRegistry` (SBT Collection) + `AgentSBT` (Item) in Tact
- Server: 7 route groups, auth (ed25519 + ton_proof), contract interaction layer
- Mini App: 3 pages (Home/Register/Agent), TON Connect, API hook
- MCP Server: 7 tools

**Next**: `npm install` in each package, compile contracts, fix issues, deploy testnet, wire end-to-end.

## Environment Variables (Server)

```
OPERATOR_MNEMONIC=word1 word2 ... word24
REGISTRY_ADDRESS=EQxxxx
TON_ENDPOINT=https://testnet.toncenter.com/api/v2/jsonRPC
TON_NETWORK=testnet
PORT=4022
```
