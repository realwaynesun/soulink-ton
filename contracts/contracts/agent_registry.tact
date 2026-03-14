import "@stdlib/ownable";
import "@stdlib/deploy";

// ============================================================
// Messages
// ============================================================

message RegisterAgent {
    name: String;
    agentOwner: Address;
    soulHash: Int as uint256;
    paymentAddress: Address;
}

message RevokeAgent {
    itemIndex: Int as uint64;
}

message UpdateCollectionContent {
    content: Cell;
}

// TEP-62 standard messages
message(0x5fcc3d14) Transfer {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x05138d91) OwnershipAssigned {
    queryId: Int as uint64;
    prevOwner: Address;
    forwardPayload: Slice as remaining;
}

message(0xd53276db) Excesses {
    queryId: Int as uint64;
}

message(0x2fcb26a2) GetStaticData {
    queryId: Int as uint64;
}

message(0x8b771735) ReportStaticData {
    queryId: Int as uint64;
    indexId: Int as uint256;
    collection: Address;
}

// TEP-85 SBT messages
message(0x04ded148) ProveOwnership {
    queryId: Int as uint64;
    dest: Address;
    forwardPayload: Cell;
    withContent: Bool;
}

message(0x0524c7ae) OwnershipProof {
    queryId: Int as uint64;
    itemId: Int as uint256;
    owner: Address;
    data: Cell;
    revokedAt: Int as uint64;
    content: Cell?;
}

message(0xd0c3bfea) RequestOwner {
    queryId: Int as uint64;
    dest: Address;
    forwardPayload: Cell;
    withContent: Bool;
}

message(0x0dd607e3) OwnerInfo {
    queryId: Int as uint64;
    itemId: Int as uint256;
    initiator: Address;
    owner: Address;
    data: Cell;
    revokedAt: Int as uint64;
    content: Cell?;
}

message(0x1f04537a) Destroy {
    queryId: Int as uint64;
}

message NameReleased {
    itemIndex: Int as uint64;
}

// Operator cleans up ghost entries where deploy failed (SBT not initialized)
message(0xc1ea9067) CleanGhostName {
    itemIndex: Int as uint64;
}

message(0x6f89f5e3) Revoke {
    queryId: Int as uint64;
}

// Internal mint message from collection to item
message MintItem {
    agentOwner: Address;
    soulHash: Int as uint256;
    paymentAddress: Address;
    content: Cell;
}

// ============================================================
// Structs
// ============================================================

struct CollectionData {
    nextItemIndex: Int as uint64;
    collectionContent: Cell;
    ownerAddress: Address;
}

struct NftData {
    isInitialized: Bool;
    index: Int as uint64;
    collectionAddress: Address;
    ownerAddress: Address;
    individualContent: Cell;
}

// ============================================================
// AgentRegistry (SBT Collection)
// ============================================================

contract AgentRegistry with Ownable, Deployable {
    const MinTonsForStorage: Int = ton("0.05");
    const GasConsumption: Int = ton("0.03");
    const MintGas: Int = ton("0.08");

    owner: Address;
    nextItemIndex: Int as uint64 = 0;
    collectionContent: Cell;
    nameHashes: map<Int as uint256, Int as uint64>;
    indexToNameHash: map<Int as uint64, Int as uint256>;

    init(owner: Address, collectionContent: Cell) {
        self.owner = owner;
        self.collectionContent = collectionContent;
    }

    // Operator registers an agent (mints SBT)
    receive(msg: RegisterAgent) {
        self.requireOwner();
        let ctx: Context = context();

        // Compute name hash for uniqueness
        let nameCell: Cell = beginCell().storeSlice(msg.name.asSlice()).endCell();
        let nameHash: Int = nameCell.hash();

        // Check name not already taken
        require(!self.nameHashes.exists(nameHash), "Name already registered");

        let itemIndex: Int = self.nextItemIndex;
        self.nameHashes.set(nameHash, itemIndex);
        self.indexToNameHash.set(itemIndex, nameHash);
        self.nextItemIndex += 1;

        // Item content: just the name suffix (no prefix)
        // get_nft_content() combines collection base URL + this suffix for TEP-64
        let contentCell: Cell = beginCell()
            .storeSlice(msg.name.asSlice())
            .endCell();

        // Deploy SBT item contract
        let nftInit: StateInit = self.getNftItemInit(itemIndex);
        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = self.MinTonsForStorage - min(tonBalanceBeforeMsg, self.MinTonsForStorage);
        msgValue = msgValue - (storageFee + self.GasConsumption);

        send(SendParameters{
            to: contractAddress(nftInit),
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
            body: MintItem{
                agentOwner: msg.agentOwner,
                soulHash: msg.soulHash,
                paymentAddress: msg.paymentAddress,
                content: contentCell
            }.toCell(),
            code: nftInit.code,
            data: nftInit.data
        });
    }

    // Owner revokes an agent SBT
    receive(msg: RevokeAgent) {
        self.requireOwner();
        let nftInit: StateInit = self.getNftItemInit(msg.itemIndex);
        send(SendParameters{
            to: contractAddress(nftInit),
            value: ton("0.05"),
            bounce: true,
            mode: SendIgnoreErrors,
            body: Revoke{ queryId: 0 }.toCell()
        });
    }

    // Operator cleans up ghost names (nameHash set but SBT deploy failed)
    // Operator verifies off-chain that the SBT at this index is uninitialized before calling
    receive(msg: CleanGhostName) {
        self.requireOwner();
        let nameHash: Int? = self.indexToNameHash.get(msg.itemIndex);
        if (nameHash != null) {
            self.nameHashes.set(nameHash!!, null);
            self.indexToNameHash.set(msg.itemIndex, null);
        }
    }

    // SBT notifies collection on Destroy — release the name for re-registration
    receive(msg: NameReleased) {
        // Only accept from the correct SBT item contract
        let nftInit: StateInit = self.getNftItemInit(msg.itemIndex);
        require(sender() == contractAddress(nftInit), "Not the SBT item");
        let nameHash: Int? = self.indexToNameHash.get(msg.itemIndex);
        if (nameHash != null) {
            self.nameHashes.set(nameHash!!, null);
            self.indexToNameHash.set(msg.itemIndex, null);
        }
    }

    // Update collection metadata
    receive(msg: UpdateCollectionContent) {
        self.requireOwner();
        self.collectionContent = msg.content;
    }

    // Accept TON deposits
    receive() {
        // Accept deposits for gas
    }

    // ---- TEP-62 getters ----

    get fun get_collection_data(): CollectionData {
        return CollectionData{
            nextItemIndex: self.nextItemIndex,
            collectionContent: self.collectionContent,
            ownerAddress: self.owner
        };
    }

    get fun get_nft_address_by_index(itemIndex: Int): Address {
        return contractAddress(self.getNftItemInit(itemIndex));
    }

    get fun get_nft_content(index: Int, individualContent: Cell): Cell {
        // TEP-64: combine collection base URL (0x01 + url) with item suffix (name)
        // Result: 0x01 + baseUrl + name  (e.g. "https://api.soulink.dev/ton/items/alice")
        let collSlice: Slice = self.collectionContent.beginParse();
        let prefix: Int = collSlice.loadUint(8);
        let builder: Builder = beginCell();
        builder = builder.storeUint(prefix, 8);
        builder = builder.storeSlice(collSlice);
        builder = builder.storeSlice(individualContent.beginParse());
        return builder.endCell();
    }

    // ---- Custom getters ----

    get fun isNameTaken(name: String): Bool {
        let nameCell: Cell = beginCell().storeSlice(name.asSlice()).endCell();
        let nameHash: Int = nameCell.hash();
        return self.nameHashes.exists(nameHash);
    }

    get fun getIndexByName(name: String): Int? {
        let nameCell: Cell = beginCell().storeSlice(name.asSlice()).endCell();
        let nameHash: Int = nameCell.hash();
        return self.nameHashes.get(nameHash);
    }

    get fun totalSupply(): Int {
        return self.nextItemIndex;
    }

    // ---- Internal ----

    fun getNftItemInit(itemIndex: Int): StateInit {
        return initOf AgentSBT(myAddress(), itemIndex);
    }
}

// ============================================================
// AgentSBT (Soulbound Token Item)
// ============================================================

contract AgentSBT {
    const MinTonsForStorage: Int = ton("0.03");

    collectionAddress: Address;
    itemIndex: Int as uint64;
    owner: Address;
    content: Cell;
    authorityAddress: Address;
    revokedAt: Int as uint64 = 0;
    isInitialized: Bool = false;
    soulHash: Int as uint256 = 0;
    paymentAddress: Address;

    init(collectionAddress: Address, itemIndex: Int) {
        self.collectionAddress = collectionAddress;
        self.itemIndex = itemIndex;
        self.owner = collectionAddress;
        self.content = emptyCell();
        self.authorityAddress = collectionAddress;
        self.paymentAddress = collectionAddress;
    }

    // Mint — only from collection
    receive(msg: MintItem) {
        require(!self.isInitialized, "Already initialized");
        require(sender() == self.collectionAddress, "Not collection");
        self.isInitialized = true;
        self.owner = msg.agentOwner;
        self.content = msg.content;
        self.soulHash = msg.soulHash;
        self.paymentAddress = msg.paymentAddress;
        self.authorityAddress = self.collectionAddress;
    }

    // Transfer — REJECTED (soulbound)
    receive(msg: Transfer) {
        require(false, "Soulbound: transfers not allowed");
    }

    // Agent proves identity to another contract
    receive(msg: ProveOwnership) {
        require(sender() == self.owner, "Not owner");
        send(SendParameters{
            to: msg.dest,
            value: 0,
            mode: SendRemainingValue,
            body: OwnershipProof{
                queryId: msg.queryId,
                itemId: self.itemIndex,
                owner: self.owner,
                data: msg.forwardPayload,
                revokedAt: self.revokedAt,
                content: msg.withContent ? self.content : null
            }.toCell()
        });
    }

    // Anyone can request owner info
    receive(msg: RequestOwner) {
        send(SendParameters{
            to: msg.dest,
            value: 0,
            mode: SendRemainingValue,
            body: OwnerInfo{
                queryId: msg.queryId,
                itemId: self.itemIndex,
                initiator: sender(),
                owner: self.owner,
                data: msg.forwardPayload,
                revokedAt: self.revokedAt,
                content: msg.withContent ? self.content : null
            }.toCell()
        });
    }

    // Report static data
    receive(msg: GetStaticData) {
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: ReportStaticData{
                queryId: msg.queryId,
                indexId: self.itemIndex,
                collection: self.collectionAddress
            }.toCell()
        });
    }

    // Authority revokes (registry operator)
    receive(msg: Revoke) {
        require(sender() == self.authorityAddress, "Not authority");
        require(self.revokedAt == 0, "Already revoked");
        self.revokedAt = now();
    }

    // Owner destroys own SBT — notifies collection to release the name
    receive(msg: Destroy) {
        require(sender() == self.owner, "Not owner");
        require(self.revokedAt == 0, "Cannot destroy revoked SBT");
        // Notify collection to clean up nameHashes before sending remaining balance
        send(SendParameters{
            to: self.collectionAddress,
            value: ton("0.02"),
            mode: 0,
            body: NameReleased{ itemIndex: self.itemIndex }.toCell()
        });
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance,
            body: Excesses{ queryId: msg.queryId }.toCell()
        });
        self.owner = self.collectionAddress;
        self.authorityAddress = self.collectionAddress;
        self.isInitialized = false;
    }

    // ---- TEP-62 getter ----

    get fun get_nft_data(): NftData {
        return NftData{
            isInitialized: self.isInitialized,
            index: self.itemIndex,
            collectionAddress: self.collectionAddress,
            ownerAddress: self.owner,
            individualContent: self.content
        };
    }

    // ---- Custom getters ----

    get fun getSoulHash(): Int {
        return self.soulHash;
    }

    get fun getPaymentAddress(): Address {
        return self.paymentAddress;
    }

    get fun isRevoked(): Bool {
        return self.revokedAt > 0;
    }

    get fun getRevokedAt(): Int {
        return self.revokedAt;
    }

    get fun getAuthority(): Address {
        return self.authorityAddress;
    }
}
