import { config } from './config.js'
import { db } from './db.js'
import { getPrice, isNameTakenOnChain, resolveOnChain, readSbtData } from './ton-client.js'
import { getReputation } from './reputation.js'
import { randomUUID } from 'crypto'

const BOT_TOKEN = config.telegramBotToken
if (!BOT_TOKEN) {
  console.log('No TELEGRAM_BOT_TOKEN — bot disabled')
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendMessage(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  })
}

async function handleMessage(chatId: number, text: string) {
  const cmd = text.trim().toLowerCase()

  // /start or help
  if (cmd === '/start' || cmd === 'help') {
    await sendMessage(chatId,
      `🤖 <b>I'm soulink.agent</b> — an AI agent with a verified identity on TON.\n\n` +
      `I help other agents get their on-chain identity.\n\n` +
      `<b>Commands:</b>\n` +
      `• Type a name → Search availability\n` +
      `• <code>register alice</code> → Mint alice.agent\n` +
      `• <code>verify alice</code> → Check agent identity\n` +
      `• <code>trust alice</code> → View trust score\n` +
      `• <code>directory</code> → List all agents\n\n` +
      `<b>For AI agents:</b> Use the MCP server or API at /api/v1/`)
    return
  }

  // directory
  if (cmd === 'directory') {
    const agents = db.prepare(
      `SELECT name FROM registration_jobs WHERE status = 'completed' ORDER BY created_at DESC LIMIT 10`
    ).all() as { name: string }[]
    if (agents.length === 0) {
      await sendMessage(chatId, '📋 No agents registered yet. Be the first!\n\nType a name to search.')
      return
    }
    const list = agents.map((a, i) => `${i + 1}. <b>${a.name}.agent</b>`).join('\n')
    await sendMessage(chatId, `🌐 <b>Agent Directory</b>\n\n${list}\n\nType <code>verify name</code> to check any agent.`)
    return
  }

  // verify <name>
  if (cmd.startsWith('verify ')) {
    const name = cmd.slice(7).trim().replace('.agent', '')
    await sendMessage(chatId, `🔍 Looking up <b>${name}.agent</b>...`)
    try {
      const resolved = await resolveOnChain(name)
      if (!resolved) {
        await sendMessage(chatId, `❌ <b>${name}.agent</b> not found on-chain.`)
        return
      }
      const sbt = await readSbtData(resolved.sbtAddress)
      if (!sbt) {
        await sendMessage(chatId, `❌ <b>${name}.agent</b> — SBT not initialized.`)
        return
      }
      const rep = getReputation(name)
      const ownerShort = sbt.owner.slice(0, 10) + '...' + sbt.owner.slice(-6)
      await sendMessage(chatId,
        `✅ <b>${name}.agent</b> — Verified\n\n` +
        `┌─────────────────────────\n` +
        `│ 🤖 <b>${name}.agent</b>\n` +
        `│ Owner: <code>${ownerShort}</code>\n` +
        `│ Chain: TON (${config.tonNetwork})\n` +
        `│ Trust: <b>${rep.score}/100</b> (${rep.report_count} reports)\n` +
        `│ Type: Soulbound Token\n` +
        `└─────────────────────────`)
    } catch {
      await sendMessage(chatId, `⚠️ Could not verify — chain error. Try again.`)
    }
    return
  }

  // trust <name>
  if (cmd.startsWith('trust ') || cmd.startsWith('score ')) {
    const name = cmd.replace(/^(trust|score)\s+/, '').trim().replace('.agent', '')
    const rep = getReputation(name)
    const bar = '█'.repeat(Math.round(rep.score / 10)) + '░'.repeat(10 - Math.round(rep.score / 10))
    await sendMessage(chatId,
      `⭐ <b>${name}.agent</b> Trust Score\n\n` +
      `${bar} <b>${rep.score}/100</b>\n` +
      `${rep.report_count} report${rep.report_count !== 1 ? 's' : ''} from other agents`)
    return
  }

  // register <name>
  if (cmd.startsWith('register ')) {
    const name = cmd.slice(9).trim().replace('.agent', '').toLowerCase()
    if (name.length < 3 || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
      await sendMessage(chatId, '❌ Invalid name. Must be 3-32 chars, lowercase alphanumeric and hyphens.')
      return
    }
    // Check if already exists
    const existing = db.prepare(`SELECT name FROM registration_jobs WHERE name = ? AND status IN ('queued', 'registering', 'completed')`).get(name)
    if (existing) {
      await sendMessage(chatId, `❌ <b>${name}.agent</b> is already taken or in progress.`)
      return
    }
    // Demo register (testnet only)
    const soulHash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')
    const id = randomUUID()
    const { getOperatorAddress } = await import('./ton-client.js')
    const opAddr = await getOperatorAddress()
    db.prepare(`INSERT INTO registration_jobs (id, name, owner, soul_hash, payment_address, payment_tx, status) VALUES (?, ?, ?, ?, ?, ?, 'queued')`)
      .run(id, name, opAddr, soulHash, opAddr, 'demo-bot')
    await sendMessage(chatId, `🤖 Minting <b>${name}.agent</b> on TON...\n\nThis takes ~30 seconds.`)

    // Poll for completion
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const job = db.prepare('SELECT status, tx_hash, error FROM registration_jobs WHERE id = ?').get(id) as { status: string; tx_hash: string | null; error: string | null } | undefined
      if (!job) break
      if (job.status === 'completed') {
        await sendMessage(chatId,
          `✅ <b>${name}.agent</b> is live on TON!\n\n` +
          `┌─────────────────────────\n` +
          `│ 🤖 <b>${name}.agent</b>\n` +
          `│ Chain: TON (${config.tonNetwork})\n` +
          `│ Trust: <b>50/100</b>\n` +
          `│ Type: Soulbound Token (SBT)\n` +
          `└─────────────────────────\n\n` +
          `🔌 <b>Connect your agent via MCP:</b>\n` +
          `<pre>{"mcpServers":{"soulink":{"command":"npx","args":["soulink-ton-mcp"]}}}</pre>\n\n` +
          `📡 <b>Verify via API:</b>\n` +
          `<code>curl /api/v1/names/${name}</code>`)
        return
      }
      if (job.status === 'failed') {
        await sendMessage(chatId, `❌ Minting failed: ${job.error ?? 'Unknown error'}`)
        return
      }
    }
    await sendMessage(chatId, `⏳ Minting is taking longer than expected. Check back with <code>verify ${name}</code>`)
    return
  }

  // Default: treat as name search
  const name = cmd.replace('.agent', '').replace(/[^a-z0-9-]/g, '')
  if (name.length >= 3) {
    const price = getPrice(name)
    const existing = db.prepare(`SELECT name FROM registration_jobs WHERE name = ? AND status IN ('queued', 'registering', 'completed')`).get(name)
    if (existing) {
      await sendMessage(chatId, `❌ <b>${name}.agent</b> is already taken.\n\nTry <code>verify ${name}</code> to see details.`)
      return
    }
    try {
      const taken = await isNameTakenOnChain(name)
      if (taken) {
        await sendMessage(chatId, `❌ <b>${name}.agent</b> is taken on-chain.\n\nTry <code>verify ${name}</code>`)
        return
      }
    } catch { /* chain error, proceed optimistically */ }

    await sendMessage(chatId,
      `✅ <b>${name}.agent</b> is available!\n\n` +
      `💎 Price: ${price} TON\n` +
      `📛 Type: Soulbound Token (permanent)\n\n` +
      `To register, type: <code>register ${name}</code>`,
      {
        reply_markup: JSON.stringify({
          inline_keyboard: [[{ text: `🤖 Register ${name}.agent`, callback_data: `reg:${name}` }]]
        })
      })
    return
  }

  await sendMessage(chatId, `Type a name to search, or <code>help</code> for commands.`)
}

async function handleCallback(chatId: number, data: string, messageId: number) {
  if (data.startsWith('reg:')) {
    const name = data.slice(4)
    await handleMessage(chatId, `register ${name}`)
  }
}

// Long polling
async function startPolling() {
  if (!BOT_TOKEN) return
  console.log('Telegram bot polling started')
  let offset = 0
  for (;;) {
    try {
      const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`)
      const data = await res.json() as { ok: boolean; result: any[] }
      if (!data.ok) { await new Promise(r => setTimeout(r, 5000)); continue }
      for (const update of data.result) {
        offset = update.update_id + 1
        if (update.message?.text) {
          handleMessage(update.message.chat.id, update.message.text).catch(console.error)
        }
        if (update.callback_query) {
          handleCallback(update.callback_query.message.chat.id, update.callback_query.data, update.callback_query.message.message_id).catch(console.error)
        }
      }
    } catch {
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

export { startPolling }
