import { toNano, beginCell } from '@ton/core'
import { AgentRegistry } from '../build/AgentRegistry/tact_AgentRegistry'
import { NetworkProvider } from '@ton/blueprint'

export async function run(provider: NetworkProvider) {
  // TEP-64: 0x01 + base URL. get_nft_content appends item name as suffix.
  // e.g. item "alice" → "https://ton.soulink.dev/api/v1/nft/alice"
  const collectionContent = beginCell()
    .storeUint(1, 8) // off-chain flag
    .storeStringTail('https://ton.soulink.dev/api/v1/nft/')
    .endCell()

  const registry = provider.open(
    await AgentRegistry.fromInit(
      provider.sender().address!,
      collectionContent,
    ),
  )

  await registry.send(
    provider.sender(),
    { value: toNano('0.1') },
    { $$type: 'Deploy', queryId: 0n },
  )

  await provider.waitForDeploy(registry.address)

  console.log('AgentRegistry deployed at:', registry.address.toString())
  console.log('Owner:', provider.sender().address!.toString())
}
