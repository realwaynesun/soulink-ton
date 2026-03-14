import { toNano, beginCell, Address } from '@ton/core'
import { TonClient, WalletContractV5R1, internal } from '@ton/ton'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { AgentRegistry } from '../build/AgentRegistry/tact_AgentRegistry'

async function main() {
  const mnemonic = process.env.OPERATOR_MNEMONIC?.split(' ')
  if (!mnemonic || mnemonic.length !== 24) {
    throw new Error('Set OPERATOR_MNEMONIC in environment (24 words)')
  }

  const keyPair = await mnemonicToPrivateKey(mnemonic)
  const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey })

  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  })

  const contract = client.open(wallet)
  const balance = await contract.getBalance()
  console.log('Wallet:', wallet.address.toString())
  console.log('Balance:', Number(balance) / 1e9, 'TON')

  if (balance < toNano('0.5')) {
    throw new Error('Need at least 0.5 TON for deployment')
  }

  // Build collection content (TEP-64: 0x01 + base URL)
  const collectionContent = beginCell()
    .storeUint(1, 8)
    .storeStringTail('https://ton.soulink.dev/api/v1/nft/')
    .endCell()

  // Compute registry address
  const registry = client.open(
    await AgentRegistry.fromInit(wallet.address, collectionContent),
  )

  console.log('Registry will deploy at:', registry.address.toString())

  // Check if already deployed
  const state = await client.getContractState(registry.address)
  if (state.state === 'active') {
    console.log('Already deployed!')
    return
  }

  // Deploy
  const seqno = await contract.getSeqno()
  await registry.send(
    {
      send: async (args) => {
        await contract.sendTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [internal({
            to: args.to,
            value: args.value,
            body: args.body,
            init: args.init,
            bounce: args.bounce,
          })],
        })
      },
      address: wallet.address,
    },
    { value: toNano('0.15') },
    { $$type: 'Deploy', queryId: 0n },
  )

  console.log('Deploy tx sent, waiting...')

  // Wait for deployment
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const s = await client.getContractState(registry.address)
    if (s.state === 'active') {
      console.log('✅ AgentRegistry deployed at:', registry.address.toString())
      console.log('Set REGISTRY_ADDRESS=' + registry.address.toString())
      return
    }
    process.stdout.write('.')
  }
  throw new Error('Deployment timeout')
}

main().catch(console.error)
