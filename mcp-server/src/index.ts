#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = process.env.SOULINK_API ?? 'https://ton.soulink.dev/api/v1'

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'api_error', status: res.status, body: text.slice(0, 200) }
  }
}

const server = new McpServer({
  name: 'soulink-ton',
  version: '0.1.0',
})

// Tool: Search for available agent names
server.tool(
  'soulink_search',
  'Search for available .agent names on TON',
  { name: z.string().describe('Name to search (e.g. "alice")') },
  async ({ name }) => {
    const result = await apiCall(`/names/search?q=${encodeURIComponent(name)}`)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

// Tool: Resolve an agent identity
server.tool(
  'soulink_resolve',
  'Look up an agent identity on TON. Returns owner, soul hash, payment address, profile, and reputation.',
  { name: z.string().describe('Agent name without .agent suffix (e.g. "alice")') },
  async ({ name }) => {
    const result = await apiCall(`/names/${name}`)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

// Tool: Check agent credit score
server.tool(
  'soulink_credit',
  'Check an agent\'s credit score and reputation on TON',
  { name: z.string().describe('Agent name without .agent suffix') },
  async ({ name }) => {
    const result = await apiCall(`/credit/${name}`)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

// Tool: View credit reports
server.tool(
  'soulink_reports',
  'View behavior reports submitted about an agent',
  { name: z.string().describe('Agent name without .agent suffix') },
  async ({ name }) => {
    const result = await apiCall(`/credit/${name}/reports`)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

// Tool: Submit a credit report
server.tool(
  'soulink_report',
  'Submit a behavior report about another agent. Requires authentication.',
  {
    reporter: z.string().describe('Your agent name'),
    target: z.string().describe('Target agent name'),
    score: z.number().min(0).max(100).describe('Score 0-100 (50 = neutral, 100 = excellent)'),
    reason: z.string().optional().describe('Reason for the report'),
    public_key: z.string().describe('Your TON wallet public key (hex)'),
    signature: z.string().describe('Ed25519 signature (hex)'),
    message: z.string().describe('Write ops: "soulink:{name}:{action}:{body_digest}:{timestamp}". Read ops: "soulink:{name}:{action}:{timestamp}". body_digest = first 16 hex of SHA-256(canonical JSON of non-auth fields)'),
  },
  async (args) => {
    const result = await apiCall('/credit/report', {
      method: 'POST',
      body: JSON.stringify(args),
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

// Tool: Verify an agent's identity
server.tool(
  'soulink_verify',
  'Verify that a wallet owns a specific .agent name via signed message',
  {
    name: z.string().describe('Agent name to verify'),
    public_key: z.string().describe('TON wallet public key (hex)'),
    signature: z.string().describe('Ed25519 signature (hex)'),
    message: z.string().describe('Read ops: "soulink:{name}:verify:{timestamp}"'),
  },
  async (args) => {
    const result = await apiCall('/verify', {
      method: 'POST',
      body: JSON.stringify(args),
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

// Tool: Get agent profile
server.tool(
  'soulink_profile',
  'Get an agent\'s public profile (display name, tagline, tags, links)',
  { name: z.string().describe('Agent name without .agent suffix') },
  async ({ name }) => {
    const result = await apiCall(`/agents/${name}/profile`)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
