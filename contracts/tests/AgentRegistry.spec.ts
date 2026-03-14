import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox'
import { toNano, beginCell } from '@ton/core'
import { AgentRegistry } from '../build/AgentRegistry/tact_AgentRegistry'
import { AgentSBT } from '../build/AgentRegistry/tact_AgentSBT'
import '@ton/test-utils'

describe('AgentRegistry', () => {
  let blockchain: Blockchain
  let deployer: SandboxContract<TreasuryContract>
  let registry: SandboxContract<AgentRegistry>

  beforeEach(async () => {
    blockchain = await Blockchain.create()
    deployer = await blockchain.treasury('deployer')

    const collectionContent = beginCell()
      .storeUint(1, 8) // off-chain flag
      .storeStringTail('https://ton.soulink.dev/api/v1/nft/')
      .endCell()

    registry = blockchain.openContract(
      await AgentRegistry.fromInit(deployer.address, collectionContent),
    )

    const deployResult = await registry.send(
      deployer.getSender(),
      { value: toNano('0.05') },
      { $$type: 'Deploy', queryId: 0n },
    )

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: registry.address,
      success: true,
      deploy: true,
    })
  })

  it('should deploy with zero supply', async () => {
    const supply = await registry.getTotalSupply()
    expect(supply).toBe(0n)
  })

  it('should register an agent name', async () => {
    const agentWallet = await blockchain.treasury('agent-alice')
    const soulHash = BigInt('0x' + 'ab'.repeat(32))

    const result = await registry.send(
      deployer.getSender(),
      { value: toNano('0.2') },
      {
        $$type: 'RegisterAgent',
        name: 'alice',
        agentOwner: agentWallet.address,
        soulHash,
        paymentAddress: agentWallet.address,
      },
    )

    expect(result.transactions).toHaveTransaction({
      from: deployer.address,
      to: registry.address,
      success: true,
    })

    const supply = await registry.getTotalSupply()
    expect(supply).toBe(1n)

    const taken = await registry.getIsNameTaken('alice')
    expect(taken).toBe(true)

    const available = await registry.getIsNameTaken('bob')
    expect(available).toBe(false)
  })

  it('should reject duplicate name registration', async () => {
    const agentWallet = await blockchain.treasury('agent-alice')
    const soulHash = BigInt('0x' + 'ab'.repeat(32))

    // First registration
    await registry.send(
      deployer.getSender(),
      { value: toNano('0.2') },
      {
        $$type: 'RegisterAgent',
        name: 'alice',
        agentOwner: agentWallet.address,
        soulHash,
        paymentAddress: agentWallet.address,
      },
    )

    // Duplicate
    const result = await registry.send(
      deployer.getSender(),
      { value: toNano('0.2') },
      {
        $$type: 'RegisterAgent',
        name: 'alice',
        agentOwner: agentWallet.address,
        soulHash,
        paymentAddress: agentWallet.address,
      },
    )

    expect(result.transactions).toHaveTransaction({
      from: deployer.address,
      to: registry.address,
      success: false,
    })
  })

  it('should reject non-owner registration', async () => {
    const attacker = await blockchain.treasury('attacker')
    const soulHash = BigInt('0x' + 'ab'.repeat(32))

    const result = await registry.send(
      attacker.getSender(),
      { value: toNano('0.2') },
      {
        $$type: 'RegisterAgent',
        name: 'evil',
        agentOwner: attacker.address,
        soulHash,
        paymentAddress: attacker.address,
      },
    )

    expect(result.transactions).toHaveTransaction({
      from: attacker.address,
      to: registry.address,
      success: false,
      exitCode: 132, // Ownable: not owner
    })
  })

  it('should register multiple distinct names', async () => {
    const alice = await blockchain.treasury('agent-alice')
    const bob = await blockchain.treasury('agent-bob')
    const soulHash = BigInt('0x' + 'cd'.repeat(32))

    await registry.send(
      deployer.getSender(),
      { value: toNano('0.2') },
      {
        $$type: 'RegisterAgent',
        name: 'alice',
        agentOwner: alice.address,
        soulHash,
        paymentAddress: alice.address,
      },
    )

    await registry.send(
      deployer.getSender(),
      { value: toNano('0.2') },
      {
        $$type: 'RegisterAgent',
        name: 'bob',
        agentOwner: bob.address,
        soulHash,
        paymentAddress: bob.address,
      },
    )

    const supply = await registry.getTotalSupply()
    expect(supply).toBe(2n)

    const index0 = await registry.getGetIndexByName('alice')
    expect(index0).toBe(0n)

    const index1 = await registry.getGetIndexByName('bob')
    expect(index1).toBe(1n)
  })

  it('should deploy SBT item on registration', async () => {
    const agentWallet = await blockchain.treasury('agent-alice')
    const soulHash = BigInt('0x' + 'ab'.repeat(32))

    const result = await registry.send(
      deployer.getSender(),
      { value: toNano('0.3') },
      {
        $$type: 'RegisterAgent',
        name: 'alice',
        agentOwner: agentWallet.address,
        soulHash,
        paymentAddress: agentWallet.address,
      },
    )

    // Get SBT address
    const sbtAddress = await registry.getGetNftAddressByIndex(0n)

    // Check that the SBT contract was deployed
    expect(result.transactions).toHaveTransaction({
      from: registry.address,
      to: sbtAddress,
      success: true,
      deploy: true,
    })

    // Read SBT data
    const sbt = blockchain.openContract(AgentSBT.fromAddress(sbtAddress))
    const nftData = await sbt.getGetNftData()
    expect(nftData.isInitialized).toBe(true)
    expect(nftData.ownerAddress.toString()).toBe(agentWallet.address.toString())
    expect(nftData.collectionAddress.toString()).toBe(registry.address.toString())

    const storedSoulHash = await sbt.getGetSoulHash()
    expect(storedSoulHash).toBe(soulHash)
  })

  it('should reject SBT transfer (soulbound)', async () => {
    const agentWallet = await blockchain.treasury('agent-alice')
    const recipient = await blockchain.treasury('recipient')
    const soulHash = BigInt('0x' + 'ab'.repeat(32))

    await registry.send(
      deployer.getSender(),
      { value: toNano('0.3') },
      {
        $$type: 'RegisterAgent',
        name: 'alice',
        agentOwner: agentWallet.address,
        soulHash,
        paymentAddress: agentWallet.address,
      },
    )

    const sbtAddress = await registry.getGetNftAddressByIndex(0n)
    const sbt = blockchain.openContract(AgentSBT.fromAddress(sbtAddress))

    const result = await sbt.send(
      agentWallet.getSender(),
      { value: toNano('0.1') },
      {
        $$type: 'Transfer',
        queryId: 0n,
        newOwner: recipient.address,
        responseDestination: agentWallet.address,
        customPayload: null,
        forwardAmount: 0n,
        forwardPayload: beginCell().endCell().asSlice(),
      },
    )

    expect(result.transactions).toHaveTransaction({
      from: agentWallet.address,
      to: sbtAddress,
      success: false,
    })
  })
})
