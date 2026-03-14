# Soulink on TON

**AI Agent Identity on TON** — Register `.agent` names as Soulbound Tokens (SBTs). Built for the [TON AI Hackathon](https://identityhub.app/contests/ai-hackathon).

## What is Soulink?

Soulink gives AI agents verifiable, on-chain identities on TON. Agents register `.agent` domain names (e.g. `alice.agent`) as non-transferable Soulbound Tokens, then use those identities for verification and reputation across the ecosystem.

**No agent identity standard exists on TON today.** TON DNS is for humans, TON ID is for people. Soulink fills this gap.

## Architecture

```
Agent/User → Telegram Mini App → TON Connect payment → Express API → Smart Contract (TON testnet)
                                                            ↓
AI Agent → MCP Server (7 tools) ─────────────────→ Express API → Smart Contract
```

### Four packages:

| Package | Tech | Purpose |
|---------|------|---------|
| `contracts/` | Tact (TEP-62/85) | SBT Collection + SBT Item contracts |
| `server/` | Express + better-sqlite3 | API server, registration worker, chain interaction |
| `mini-app/` | React + Vite + TON Connect | Telegram Mini App for human users |
| `mcp-server/` | MCP SDK | 7 tools for AI agent integration |

## Features

- **Register** `.agent` names as Soulbound Tokens (non-transferable)
- **Verify** agent identity via Ed25519 signatures
- **Credit** scoring — agents rate each other, scores are public
- **Discover** agents via search API
- **MCP-native** — AI agents self-register via MCP tools
- **Telegram-first** — Mini App with TON Connect wallet integration

## Quick Start

```bash
# Install dependencies
cd contracts && npm install --legacy-peer-deps
cd ../server && npm install --legacy-peer-deps
cd ../mini-app && npm install
cd ../mcp-server && npm install --legacy-peer-deps

# Build & test contracts
cd contracts && npx blueprint build && npx blueprint test

# Configure server
cp server/.env.example server/.env
# Edit .env with your operator mnemonic and registry address

# Run server
cd server && npx tsx src/index.ts

# Run mini-app
cd mini-app && npm run dev
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/names/search?q=` | GET | Search available names |
| `/register` | POST | Register a .agent name (requires TON payment) |
| `/registrations/:id` | GET | Poll registration status |
| `/names/:name` | GET | Resolve agent identity |
| `/verify` | POST | Verify agent identity via signed message |
| `/credit/:name` | GET | Check agent credit score |
| `/credit/report` | POST | Submit behavior report |
| `/agents/:name/profile` | GET/POST | Agent profile CRUD |

## Smart Contract

- **AgentRegistry** (SBT Collection) — manages name uniqueness via `nameHashes` map
- **AgentSBT** (Soulbound Token Item) — stores owner, soulHash, paymentAddress
- Names: 3-32 chars, lowercase alphanumeric + hyphens
- Non-transferable (TEP-85 Soulbound)
- Operator pattern: only the server wallet can mint

## MCP Tools

AI agents interact via 7 MCP tools:
- `soulink_search` — search available names
- `soulink_resolve` — look up agent identity
- `soulink_verify` — verify agent identity
- `soulink_credit` — check credit score
- `soulink_reports` — view behavior reports
- `soulink_report` — submit a report
- `soulink_profile` — get agent profile

## Testnet Deployment

- **Contract**: `EQAo7zpfOghtz1F8p4CWU_SqibSnEMZSslIVTHMW7i8iQnWR` (TON testnet)
- **Telegram Bot**: [@soulinktestbot](https://t.me/soulinktestbot)

## License

MIT
