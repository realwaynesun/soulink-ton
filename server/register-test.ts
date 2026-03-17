import { TonClient, WalletContractV5R1, internal, SendMode } from '@ton/ton'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { beginCell, toNano } from '@ton/core'

const MNEMONIC = "slogan circle vacuum clay come cool adult frown opinion deny aspect raven short coast museum step play bronze cheese twice flock bracket employ very"
const NAME = "alice"
const API = "http://localhost:4022/api/v1"

async function main() {
  const keyPair = await mnemonicToPrivateKey(MNEMONIC.split(' '))
  const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey })
  const client = new TonClient({ endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC' })
  const contract = client.open(wallet)
  
  const ownerAddress = wallet.address.toString()
  console.log('Owner:', ownerAddress)
  
  // Get operator address from API
  const opRes = await fetch(`${API}/operator`)
  const opData = await opRes.json()
  console.log('Operator:', opData.address)
  console.log('Price:', opData.pricing.standard_ton, 'TON')
  
  // Generate soul_hash
  const soulHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Send payment to operator with comment "name:soul_hash"
  const comment = `${NAME}:${soulHash}`
  console.log('Sending payment with comment:', comment.slice(0, 40) + '...')
  
  const seqno = await contract.getSeqno()
  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [
      internal({
        to: opData.address,
        value: toNano(opData.pricing.standard_ton.toString()),
        body: beginCell().storeUint(0, 32).storeStringTail(comment).endCell(),
        bounce: false,
      }),
    ],
  })
  
  console.log('Payment sent, waiting 10s for on-chain confirmation...')
  await new Promise(r => setTimeout(r, 10000))
  
  // Call /register
  console.log('Calling /register...')
  const regRes = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: NAME, owner: ownerAddress }),
  })
  const regData = await regRes.json()
  console.log('Register response:', JSON.stringify(regData, null, 2))
  
  if (regData.poll_url) {
    // Poll for completion
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const pollRes = await fetch(`${API}${regData.poll_url}`)
      const poll = await pollRes.json()
      console.log(`Poll ${i+1}: ${poll.status}`)
      if (poll.status === 'completed') {
        console.log('✅ Registration complete! TX:', poll.tx_hash)
        break
      }
      if (poll.status === 'failed') {
        console.log('❌ Failed:', poll.error)
        break
      }
    }
  }
}

main().catch(console.error)
