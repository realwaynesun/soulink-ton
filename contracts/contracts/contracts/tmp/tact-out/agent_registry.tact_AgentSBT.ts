import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwner = {
    $$type: 'ChangeOwner';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwner(src: ChangeOwner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2174598809, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2174598809) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwner(source: ChangeOwner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwner(): DictionaryValue<ChangeOwner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwner(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwner(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwnerOk = {
    $$type: 'ChangeOwnerOk';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwnerOk(src: ChangeOwnerOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(846932810, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwnerOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 846932810) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwnerOk(source: ChangeOwnerOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwnerOk(): DictionaryValue<ChangeOwnerOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwnerOk(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwnerOk(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type RegisterAgent = {
    $$type: 'RegisterAgent';
    name: string;
    agentOwner: Address;
    soulHash: bigint;
    paymentAddress: Address;
}

export function storeRegisterAgent(src: RegisterAgent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3148855267, 32);
        b_0.storeStringRefTail(src.name);
        b_0.storeAddress(src.agentOwner);
        b_0.storeUint(src.soulHash, 256);
        b_0.storeAddress(src.paymentAddress);
    };
}

export function loadRegisterAgent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3148855267) { throw Error('Invalid prefix'); }
    const _name = sc_0.loadStringRefTail();
    const _agentOwner = sc_0.loadAddress();
    const _soulHash = sc_0.loadUintBig(256);
    const _paymentAddress = sc_0.loadAddress();
    return { $$type: 'RegisterAgent' as const, name: _name, agentOwner: _agentOwner, soulHash: _soulHash, paymentAddress: _paymentAddress };
}

export function loadTupleRegisterAgent(source: TupleReader) {
    const _name = source.readString();
    const _agentOwner = source.readAddress();
    const _soulHash = source.readBigNumber();
    const _paymentAddress = source.readAddress();
    return { $$type: 'RegisterAgent' as const, name: _name, agentOwner: _agentOwner, soulHash: _soulHash, paymentAddress: _paymentAddress };
}

export function loadGetterTupleRegisterAgent(source: TupleReader) {
    const _name = source.readString();
    const _agentOwner = source.readAddress();
    const _soulHash = source.readBigNumber();
    const _paymentAddress = source.readAddress();
    return { $$type: 'RegisterAgent' as const, name: _name, agentOwner: _agentOwner, soulHash: _soulHash, paymentAddress: _paymentAddress };
}

export function storeTupleRegisterAgent(source: RegisterAgent) {
    const builder = new TupleBuilder();
    builder.writeString(source.name);
    builder.writeAddress(source.agentOwner);
    builder.writeNumber(source.soulHash);
    builder.writeAddress(source.paymentAddress);
    return builder.build();
}

export function dictValueParserRegisterAgent(): DictionaryValue<RegisterAgent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRegisterAgent(src)).endCell());
        },
        parse: (src) => {
            return loadRegisterAgent(src.loadRef().beginParse());
        }
    }
}

export type RevokeAgent = {
    $$type: 'RevokeAgent';
    itemIndex: bigint;
}

export function storeRevokeAgent(src: RevokeAgent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(913301552, 32);
        b_0.storeUint(src.itemIndex, 64);
    };
}

export function loadRevokeAgent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 913301552) { throw Error('Invalid prefix'); }
    const _itemIndex = sc_0.loadUintBig(64);
    return { $$type: 'RevokeAgent' as const, itemIndex: _itemIndex };
}

export function loadTupleRevokeAgent(source: TupleReader) {
    const _itemIndex = source.readBigNumber();
    return { $$type: 'RevokeAgent' as const, itemIndex: _itemIndex };
}

export function loadGetterTupleRevokeAgent(source: TupleReader) {
    const _itemIndex = source.readBigNumber();
    return { $$type: 'RevokeAgent' as const, itemIndex: _itemIndex };
}

export function storeTupleRevokeAgent(source: RevokeAgent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.itemIndex);
    return builder.build();
}

export function dictValueParserRevokeAgent(): DictionaryValue<RevokeAgent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRevokeAgent(src)).endCell());
        },
        parse: (src) => {
            return loadRevokeAgent(src.loadRef().beginParse());
        }
    }
}

export type UpdateCollectionContent = {
    $$type: 'UpdateCollectionContent';
    content: Cell;
}

export function storeUpdateCollectionContent(src: UpdateCollectionContent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3494147988, 32);
        b_0.storeRef(src.content);
    };
}

export function loadUpdateCollectionContent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3494147988) { throw Error('Invalid prefix'); }
    const _content = sc_0.loadRef();
    return { $$type: 'UpdateCollectionContent' as const, content: _content };
}

export function loadTupleUpdateCollectionContent(source: TupleReader) {
    const _content = source.readCell();
    return { $$type: 'UpdateCollectionContent' as const, content: _content };
}

export function loadGetterTupleUpdateCollectionContent(source: TupleReader) {
    const _content = source.readCell();
    return { $$type: 'UpdateCollectionContent' as const, content: _content };
}

export function storeTupleUpdateCollectionContent(source: UpdateCollectionContent) {
    const builder = new TupleBuilder();
    builder.writeCell(source.content);
    return builder.build();
}

export function dictValueParserUpdateCollectionContent(): DictionaryValue<UpdateCollectionContent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpdateCollectionContent(src)).endCell());
        },
        parse: (src) => {
            return loadUpdateCollectionContent(src.loadRef().beginParse());
        }
    }
}

export type Transfer = {
    $$type: 'Transfer';
    queryId: bigint;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Slice;
}

export function storeTransfer(src: Transfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1607220500, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forwardAmount);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1607220500) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    const _responseDestination = sc_0.loadAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forwardAmount = sc_0.loadCoins();
    const _forwardPayload = sc_0;
    return { $$type: 'Transfer' as const, queryId: _queryId, newOwner: _newOwner, responseDestination: _responseDestination, customPayload: _customPayload, forwardAmount: _forwardAmount, forwardPayload: _forwardPayload };
}

export function loadTupleTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    const _responseDestination = source.readAddress();
    const _customPayload = source.readCellOpt();
    const _forwardAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'Transfer' as const, queryId: _queryId, newOwner: _newOwner, responseDestination: _responseDestination, customPayload: _customPayload, forwardAmount: _forwardAmount, forwardPayload: _forwardPayload };
}

export function loadGetterTupleTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    const _responseDestination = source.readAddress();
    const _customPayload = source.readCellOpt();
    const _forwardAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'Transfer' as const, queryId: _queryId, newOwner: _newOwner, responseDestination: _responseDestination, customPayload: _customPayload, forwardAmount: _forwardAmount, forwardPayload: _forwardPayload };
}

export function storeTupleTransfer(source: Transfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    builder.writeAddress(source.responseDestination);
    builder.writeCell(source.customPayload);
    builder.writeNumber(source.forwardAmount);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserTransfer(): DictionaryValue<Transfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadTransfer(src.loadRef().beginParse());
        }
    }
}

export type OwnershipAssigned = {
    $$type: 'OwnershipAssigned';
    queryId: bigint;
    prevOwner: Address;
    forwardPayload: Slice;
}

export function storeOwnershipAssigned(src: OwnershipAssigned) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(85167505, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.prevOwner);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadOwnershipAssigned(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 85167505) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _prevOwner = sc_0.loadAddress();
    const _forwardPayload = sc_0;
    return { $$type: 'OwnershipAssigned' as const, queryId: _queryId, prevOwner: _prevOwner, forwardPayload: _forwardPayload };
}

export function loadTupleOwnershipAssigned(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _prevOwner = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'OwnershipAssigned' as const, queryId: _queryId, prevOwner: _prevOwner, forwardPayload: _forwardPayload };
}

export function loadGetterTupleOwnershipAssigned(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _prevOwner = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'OwnershipAssigned' as const, queryId: _queryId, prevOwner: _prevOwner, forwardPayload: _forwardPayload };
}

export function storeTupleOwnershipAssigned(source: OwnershipAssigned) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.prevOwner);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserOwnershipAssigned(): DictionaryValue<OwnershipAssigned> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOwnershipAssigned(src)).endCell());
        },
        parse: (src) => {
            return loadOwnershipAssigned(src.loadRef().beginParse());
        }
    }
}

export type Excesses = {
    $$type: 'Excesses';
    queryId: bigint;
}

export function storeExcesses(src: Excesses) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3576854235, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadExcesses(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3576854235) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Excesses' as const, queryId: _queryId };
}

export function loadTupleExcesses(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Excesses' as const, queryId: _queryId };
}

export function loadGetterTupleExcesses(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Excesses' as const, queryId: _queryId };
}

export function storeTupleExcesses(source: Excesses) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserExcesses(): DictionaryValue<Excesses> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeExcesses(src)).endCell());
        },
        parse: (src) => {
            return loadExcesses(src.loadRef().beginParse());
        }
    }
}

export type GetStaticData = {
    $$type: 'GetStaticData';
    queryId: bigint;
}

export function storeGetStaticData(src: GetStaticData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(801842850, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadGetStaticData(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 801842850) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'GetStaticData' as const, queryId: _queryId };
}

export function loadTupleGetStaticData(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'GetStaticData' as const, queryId: _queryId };
}

export function loadGetterTupleGetStaticData(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'GetStaticData' as const, queryId: _queryId };
}

export function storeTupleGetStaticData(source: GetStaticData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserGetStaticData(): DictionaryValue<GetStaticData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGetStaticData(src)).endCell());
        },
        parse: (src) => {
            return loadGetStaticData(src.loadRef().beginParse());
        }
    }
}

export type ReportStaticData = {
    $$type: 'ReportStaticData';
    queryId: bigint;
    indexId: bigint;
    collection: Address;
}

export function storeReportStaticData(src: ReportStaticData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2339837749, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeUint(src.indexId, 256);
        b_0.storeAddress(src.collection);
    };
}

export function loadReportStaticData(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2339837749) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _indexId = sc_0.loadUintBig(256);
    const _collection = sc_0.loadAddress();
    return { $$type: 'ReportStaticData' as const, queryId: _queryId, indexId: _indexId, collection: _collection };
}

export function loadTupleReportStaticData(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _indexId = source.readBigNumber();
    const _collection = source.readAddress();
    return { $$type: 'ReportStaticData' as const, queryId: _queryId, indexId: _indexId, collection: _collection };
}

export function loadGetterTupleReportStaticData(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _indexId = source.readBigNumber();
    const _collection = source.readAddress();
    return { $$type: 'ReportStaticData' as const, queryId: _queryId, indexId: _indexId, collection: _collection };
}

export function storeTupleReportStaticData(source: ReportStaticData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.indexId);
    builder.writeAddress(source.collection);
    return builder.build();
}

export function dictValueParserReportStaticData(): DictionaryValue<ReportStaticData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeReportStaticData(src)).endCell());
        },
        parse: (src) => {
            return loadReportStaticData(src.loadRef().beginParse());
        }
    }
}

export type ProveOwnership = {
    $$type: 'ProveOwnership';
    queryId: bigint;
    dest: Address;
    forwardPayload: Cell;
    withContent: boolean;
}

export function storeProveOwnership(src: ProveOwnership) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(81711432, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.dest);
        b_0.storeRef(src.forwardPayload);
        b_0.storeBit(src.withContent);
    };
}

export function loadProveOwnership(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 81711432) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _dest = sc_0.loadAddress();
    const _forwardPayload = sc_0.loadRef();
    const _withContent = sc_0.loadBit();
    return { $$type: 'ProveOwnership' as const, queryId: _queryId, dest: _dest, forwardPayload: _forwardPayload, withContent: _withContent };
}

export function loadTupleProveOwnership(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _dest = source.readAddress();
    const _forwardPayload = source.readCell();
    const _withContent = source.readBoolean();
    return { $$type: 'ProveOwnership' as const, queryId: _queryId, dest: _dest, forwardPayload: _forwardPayload, withContent: _withContent };
}

export function loadGetterTupleProveOwnership(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _dest = source.readAddress();
    const _forwardPayload = source.readCell();
    const _withContent = source.readBoolean();
    return { $$type: 'ProveOwnership' as const, queryId: _queryId, dest: _dest, forwardPayload: _forwardPayload, withContent: _withContent };
}

export function storeTupleProveOwnership(source: ProveOwnership) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.dest);
    builder.writeCell(source.forwardPayload);
    builder.writeBoolean(source.withContent);
    return builder.build();
}

export function dictValueParserProveOwnership(): DictionaryValue<ProveOwnership> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeProveOwnership(src)).endCell());
        },
        parse: (src) => {
            return loadProveOwnership(src.loadRef().beginParse());
        }
    }
}

export type OwnershipProof = {
    $$type: 'OwnershipProof';
    queryId: bigint;
    itemId: bigint;
    owner: Address;
    data: Cell;
    revokedAt: bigint;
    content: Cell | null;
}

export function storeOwnershipProof(src: OwnershipProof) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(86296494, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeUint(src.itemId, 256);
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.data);
        b_0.storeUint(src.revokedAt, 64);
        if (src.content !== null && src.content !== undefined) { b_0.storeBit(true).storeRef(src.content); } else { b_0.storeBit(false); }
    };
}

export function loadOwnershipProof(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 86296494) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _itemId = sc_0.loadUintBig(256);
    const _owner = sc_0.loadAddress();
    const _data = sc_0.loadRef();
    const _revokedAt = sc_0.loadUintBig(64);
    const _content = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'OwnershipProof' as const, queryId: _queryId, itemId: _itemId, owner: _owner, data: _data, revokedAt: _revokedAt, content: _content };
}

export function loadTupleOwnershipProof(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _itemId = source.readBigNumber();
    const _owner = source.readAddress();
    const _data = source.readCell();
    const _revokedAt = source.readBigNumber();
    const _content = source.readCellOpt();
    return { $$type: 'OwnershipProof' as const, queryId: _queryId, itemId: _itemId, owner: _owner, data: _data, revokedAt: _revokedAt, content: _content };
}

export function loadGetterTupleOwnershipProof(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _itemId = source.readBigNumber();
    const _owner = source.readAddress();
    const _data = source.readCell();
    const _revokedAt = source.readBigNumber();
    const _content = source.readCellOpt();
    return { $$type: 'OwnershipProof' as const, queryId: _queryId, itemId: _itemId, owner: _owner, data: _data, revokedAt: _revokedAt, content: _content };
}

export function storeTupleOwnershipProof(source: OwnershipProof) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.itemId);
    builder.writeAddress(source.owner);
    builder.writeCell(source.data);
    builder.writeNumber(source.revokedAt);
    builder.writeCell(source.content);
    return builder.build();
}

export function dictValueParserOwnershipProof(): DictionaryValue<OwnershipProof> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOwnershipProof(src)).endCell());
        },
        parse: (src) => {
            return loadOwnershipProof(src.loadRef().beginParse());
        }
    }
}

export type RequestOwner = {
    $$type: 'RequestOwner';
    queryId: bigint;
    dest: Address;
    forwardPayload: Cell;
    withContent: boolean;
}

export function storeRequestOwner(src: RequestOwner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3502489578, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.dest);
        b_0.storeRef(src.forwardPayload);
        b_0.storeBit(src.withContent);
    };
}

export function loadRequestOwner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3502489578) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _dest = sc_0.loadAddress();
    const _forwardPayload = sc_0.loadRef();
    const _withContent = sc_0.loadBit();
    return { $$type: 'RequestOwner' as const, queryId: _queryId, dest: _dest, forwardPayload: _forwardPayload, withContent: _withContent };
}

export function loadTupleRequestOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _dest = source.readAddress();
    const _forwardPayload = source.readCell();
    const _withContent = source.readBoolean();
    return { $$type: 'RequestOwner' as const, queryId: _queryId, dest: _dest, forwardPayload: _forwardPayload, withContent: _withContent };
}

export function loadGetterTupleRequestOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _dest = source.readAddress();
    const _forwardPayload = source.readCell();
    const _withContent = source.readBoolean();
    return { $$type: 'RequestOwner' as const, queryId: _queryId, dest: _dest, forwardPayload: _forwardPayload, withContent: _withContent };
}

export function storeTupleRequestOwner(source: RequestOwner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.dest);
    builder.writeCell(source.forwardPayload);
    builder.writeBoolean(source.withContent);
    return builder.build();
}

export function dictValueParserRequestOwner(): DictionaryValue<RequestOwner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRequestOwner(src)).endCell());
        },
        parse: (src) => {
            return loadRequestOwner(src.loadRef().beginParse());
        }
    }
}

export type OwnerInfo = {
    $$type: 'OwnerInfo';
    queryId: bigint;
    itemId: bigint;
    initiator: Address;
    owner: Address;
    data: Cell;
    revokedAt: bigint;
    content: Cell | null;
}

export function storeOwnerInfo(src: OwnerInfo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(232130531, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeUint(src.itemId, 256);
        b_0.storeAddress(src.initiator);
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.data);
        b_0.storeUint(src.revokedAt, 64);
        if (src.content !== null && src.content !== undefined) { b_0.storeBit(true).storeRef(src.content); } else { b_0.storeBit(false); }
    };
}

export function loadOwnerInfo(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 232130531) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _itemId = sc_0.loadUintBig(256);
    const _initiator = sc_0.loadAddress();
    const _owner = sc_0.loadAddress();
    const _data = sc_0.loadRef();
    const _revokedAt = sc_0.loadUintBig(64);
    const _content = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'OwnerInfo' as const, queryId: _queryId, itemId: _itemId, initiator: _initiator, owner: _owner, data: _data, revokedAt: _revokedAt, content: _content };
}

export function loadTupleOwnerInfo(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _itemId = source.readBigNumber();
    const _initiator = source.readAddress();
    const _owner = source.readAddress();
    const _data = source.readCell();
    const _revokedAt = source.readBigNumber();
    const _content = source.readCellOpt();
    return { $$type: 'OwnerInfo' as const, queryId: _queryId, itemId: _itemId, initiator: _initiator, owner: _owner, data: _data, revokedAt: _revokedAt, content: _content };
}

export function loadGetterTupleOwnerInfo(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _itemId = source.readBigNumber();
    const _initiator = source.readAddress();
    const _owner = source.readAddress();
    const _data = source.readCell();
    const _revokedAt = source.readBigNumber();
    const _content = source.readCellOpt();
    return { $$type: 'OwnerInfo' as const, queryId: _queryId, itemId: _itemId, initiator: _initiator, owner: _owner, data: _data, revokedAt: _revokedAt, content: _content };
}

export function storeTupleOwnerInfo(source: OwnerInfo) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.itemId);
    builder.writeAddress(source.initiator);
    builder.writeAddress(source.owner);
    builder.writeCell(source.data);
    builder.writeNumber(source.revokedAt);
    builder.writeCell(source.content);
    return builder.build();
}

export function dictValueParserOwnerInfo(): DictionaryValue<OwnerInfo> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOwnerInfo(src)).endCell());
        },
        parse: (src) => {
            return loadOwnerInfo(src.loadRef().beginParse());
        }
    }
}

export type Destroy = {
    $$type: 'Destroy';
    queryId: bigint;
}

export function storeDestroy(src: Destroy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(520377210, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDestroy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 520377210) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Destroy' as const, queryId: _queryId };
}

export function loadTupleDestroy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Destroy' as const, queryId: _queryId };
}

export function loadGetterTupleDestroy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Destroy' as const, queryId: _queryId };
}

export function storeTupleDestroy(source: Destroy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDestroy(): DictionaryValue<Destroy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDestroy(src)).endCell());
        },
        parse: (src) => {
            return loadDestroy(src.loadRef().beginParse());
        }
    }
}

export type Revoke = {
    $$type: 'Revoke';
    queryId: bigint;
}

export function storeRevoke(src: Revoke) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1871312355, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadRevoke(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1871312355) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Revoke' as const, queryId: _queryId };
}

export function loadTupleRevoke(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Revoke' as const, queryId: _queryId };
}

export function loadGetterTupleRevoke(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Revoke' as const, queryId: _queryId };
}

export function storeTupleRevoke(source: Revoke) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserRevoke(): DictionaryValue<Revoke> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRevoke(src)).endCell());
        },
        parse: (src) => {
            return loadRevoke(src.loadRef().beginParse());
        }
    }
}

export type MintItem = {
    $$type: 'MintItem';
    agentOwner: Address;
    soulHash: bigint;
    paymentAddress: Address;
    content: Cell;
}

export function storeMintItem(src: MintItem) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1358695337, 32);
        b_0.storeAddress(src.agentOwner);
        b_0.storeUint(src.soulHash, 256);
        b_0.storeAddress(src.paymentAddress);
        b_0.storeRef(src.content);
    };
}

export function loadMintItem(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1358695337) { throw Error('Invalid prefix'); }
    const _agentOwner = sc_0.loadAddress();
    const _soulHash = sc_0.loadUintBig(256);
    const _paymentAddress = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    return { $$type: 'MintItem' as const, agentOwner: _agentOwner, soulHash: _soulHash, paymentAddress: _paymentAddress, content: _content };
}

export function loadTupleMintItem(source: TupleReader) {
    const _agentOwner = source.readAddress();
    const _soulHash = source.readBigNumber();
    const _paymentAddress = source.readAddress();
    const _content = source.readCell();
    return { $$type: 'MintItem' as const, agentOwner: _agentOwner, soulHash: _soulHash, paymentAddress: _paymentAddress, content: _content };
}

export function loadGetterTupleMintItem(source: TupleReader) {
    const _agentOwner = source.readAddress();
    const _soulHash = source.readBigNumber();
    const _paymentAddress = source.readAddress();
    const _content = source.readCell();
    return { $$type: 'MintItem' as const, agentOwner: _agentOwner, soulHash: _soulHash, paymentAddress: _paymentAddress, content: _content };
}

export function storeTupleMintItem(source: MintItem) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.agentOwner);
    builder.writeNumber(source.soulHash);
    builder.writeAddress(source.paymentAddress);
    builder.writeCell(source.content);
    return builder.build();
}

export function dictValueParserMintItem(): DictionaryValue<MintItem> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMintItem(src)).endCell());
        },
        parse: (src) => {
            return loadMintItem(src.loadRef().beginParse());
        }
    }
}

export type CollectionData = {
    $$type: 'CollectionData';
    nextItemIndex: bigint;
    collectionContent: Cell;
    ownerAddress: Address;
}

export function storeCollectionData(src: CollectionData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.nextItemIndex, 64);
        b_0.storeRef(src.collectionContent);
        b_0.storeAddress(src.ownerAddress);
    };
}

export function loadCollectionData(slice: Slice) {
    const sc_0 = slice;
    const _nextItemIndex = sc_0.loadUintBig(64);
    const _collectionContent = sc_0.loadRef();
    const _ownerAddress = sc_0.loadAddress();
    return { $$type: 'CollectionData' as const, nextItemIndex: _nextItemIndex, collectionContent: _collectionContent, ownerAddress: _ownerAddress };
}

export function loadTupleCollectionData(source: TupleReader) {
    const _nextItemIndex = source.readBigNumber();
    const _collectionContent = source.readCell();
    const _ownerAddress = source.readAddress();
    return { $$type: 'CollectionData' as const, nextItemIndex: _nextItemIndex, collectionContent: _collectionContent, ownerAddress: _ownerAddress };
}

export function loadGetterTupleCollectionData(source: TupleReader) {
    const _nextItemIndex = source.readBigNumber();
    const _collectionContent = source.readCell();
    const _ownerAddress = source.readAddress();
    return { $$type: 'CollectionData' as const, nextItemIndex: _nextItemIndex, collectionContent: _collectionContent, ownerAddress: _ownerAddress };
}

export function storeTupleCollectionData(source: CollectionData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.nextItemIndex);
    builder.writeCell(source.collectionContent);
    builder.writeAddress(source.ownerAddress);
    return builder.build();
}

export function dictValueParserCollectionData(): DictionaryValue<CollectionData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCollectionData(src)).endCell());
        },
        parse: (src) => {
            return loadCollectionData(src.loadRef().beginParse());
        }
    }
}

export type NftData = {
    $$type: 'NftData';
    isInitialized: boolean;
    index: bigint;
    collectionAddress: Address;
    ownerAddress: Address;
    individualContent: Cell;
}

export function storeNftData(src: NftData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.isInitialized);
        b_0.storeUint(src.index, 64);
        b_0.storeAddress(src.collectionAddress);
        b_0.storeAddress(src.ownerAddress);
        b_0.storeRef(src.individualContent);
    };
}

export function loadNftData(slice: Slice) {
    const sc_0 = slice;
    const _isInitialized = sc_0.loadBit();
    const _index = sc_0.loadUintBig(64);
    const _collectionAddress = sc_0.loadAddress();
    const _ownerAddress = sc_0.loadAddress();
    const _individualContent = sc_0.loadRef();
    return { $$type: 'NftData' as const, isInitialized: _isInitialized, index: _index, collectionAddress: _collectionAddress, ownerAddress: _ownerAddress, individualContent: _individualContent };
}

export function loadTupleNftData(source: TupleReader) {
    const _isInitialized = source.readBoolean();
    const _index = source.readBigNumber();
    const _collectionAddress = source.readAddress();
    const _ownerAddress = source.readAddress();
    const _individualContent = source.readCell();
    return { $$type: 'NftData' as const, isInitialized: _isInitialized, index: _index, collectionAddress: _collectionAddress, ownerAddress: _ownerAddress, individualContent: _individualContent };
}

export function loadGetterTupleNftData(source: TupleReader) {
    const _isInitialized = source.readBoolean();
    const _index = source.readBigNumber();
    const _collectionAddress = source.readAddress();
    const _ownerAddress = source.readAddress();
    const _individualContent = source.readCell();
    return { $$type: 'NftData' as const, isInitialized: _isInitialized, index: _index, collectionAddress: _collectionAddress, ownerAddress: _ownerAddress, individualContent: _individualContent };
}

export function storeTupleNftData(source: NftData) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.isInitialized);
    builder.writeNumber(source.index);
    builder.writeAddress(source.collectionAddress);
    builder.writeAddress(source.ownerAddress);
    builder.writeCell(source.individualContent);
    return builder.build();
}

export function dictValueParserNftData(): DictionaryValue<NftData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeNftData(src)).endCell());
        },
        parse: (src) => {
            return loadNftData(src.loadRef().beginParse());
        }
    }
}

export type AgentRegistry$Data = {
    $$type: 'AgentRegistry$Data';
    owner: Address;
    nextItemIndex: bigint;
    collectionContent: Cell;
    nameHashes: Dictionary<bigint, bigint>;
}

export function storeAgentRegistry$Data(src: AgentRegistry$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeUint(src.nextItemIndex, 64);
        b_0.storeRef(src.collectionContent);
        b_0.storeDict(src.nameHashes, Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64));
    };
}

export function loadAgentRegistry$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _nextItemIndex = sc_0.loadUintBig(64);
    const _collectionContent = sc_0.loadRef();
    const _nameHashes = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), sc_0);
    return { $$type: 'AgentRegistry$Data' as const, owner: _owner, nextItemIndex: _nextItemIndex, collectionContent: _collectionContent, nameHashes: _nameHashes };
}

export function loadTupleAgentRegistry$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _nextItemIndex = source.readBigNumber();
    const _collectionContent = source.readCell();
    const _nameHashes = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), source.readCellOpt());
    return { $$type: 'AgentRegistry$Data' as const, owner: _owner, nextItemIndex: _nextItemIndex, collectionContent: _collectionContent, nameHashes: _nameHashes };
}

export function loadGetterTupleAgentRegistry$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _nextItemIndex = source.readBigNumber();
    const _collectionContent = source.readCell();
    const _nameHashes = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64), source.readCellOpt());
    return { $$type: 'AgentRegistry$Data' as const, owner: _owner, nextItemIndex: _nextItemIndex, collectionContent: _collectionContent, nameHashes: _nameHashes };
}

export function storeTupleAgentRegistry$Data(source: AgentRegistry$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeNumber(source.nextItemIndex);
    builder.writeCell(source.collectionContent);
    builder.writeCell(source.nameHashes.size > 0 ? beginCell().storeDictDirect(source.nameHashes, Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)).endCell() : null);
    return builder.build();
}

export function dictValueParserAgentRegistry$Data(): DictionaryValue<AgentRegistry$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeAgentRegistry$Data(src)).endCell());
        },
        parse: (src) => {
            return loadAgentRegistry$Data(src.loadRef().beginParse());
        }
    }
}

export type AgentSBT$Data = {
    $$type: 'AgentSBT$Data';
    collectionAddress: Address;
    itemIndex: bigint;
    owner: Address;
    content: Cell;
    authorityAddress: Address;
    revokedAt: bigint;
    isInitialized: boolean;
    soulHash: bigint;
    paymentAddress: Address;
}

export function storeAgentSBT$Data(src: AgentSBT$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.collectionAddress);
        b_0.storeUint(src.itemIndex, 64);
        b_0.storeAddress(src.owner);
        b_0.storeRef(src.content);
        b_0.storeAddress(src.authorityAddress);
        b_0.storeUint(src.revokedAt, 64);
        b_0.storeBit(src.isInitialized);
        const b_1 = new Builder();
        b_1.storeUint(src.soulHash, 256);
        b_1.storeAddress(src.paymentAddress);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadAgentSBT$Data(slice: Slice) {
    const sc_0 = slice;
    const _collectionAddress = sc_0.loadAddress();
    const _itemIndex = sc_0.loadUintBig(64);
    const _owner = sc_0.loadAddress();
    const _content = sc_0.loadRef();
    const _authorityAddress = sc_0.loadAddress();
    const _revokedAt = sc_0.loadUintBig(64);
    const _isInitialized = sc_0.loadBit();
    const sc_1 = sc_0.loadRef().beginParse();
    const _soulHash = sc_1.loadUintBig(256);
    const _paymentAddress = sc_1.loadAddress();
    return { $$type: 'AgentSBT$Data' as const, collectionAddress: _collectionAddress, itemIndex: _itemIndex, owner: _owner, content: _content, authorityAddress: _authorityAddress, revokedAt: _revokedAt, isInitialized: _isInitialized, soulHash: _soulHash, paymentAddress: _paymentAddress };
}

export function loadTupleAgentSBT$Data(source: TupleReader) {
    const _collectionAddress = source.readAddress();
    const _itemIndex = source.readBigNumber();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _authorityAddress = source.readAddress();
    const _revokedAt = source.readBigNumber();
    const _isInitialized = source.readBoolean();
    const _soulHash = source.readBigNumber();
    const _paymentAddress = source.readAddress();
    return { $$type: 'AgentSBT$Data' as const, collectionAddress: _collectionAddress, itemIndex: _itemIndex, owner: _owner, content: _content, authorityAddress: _authorityAddress, revokedAt: _revokedAt, isInitialized: _isInitialized, soulHash: _soulHash, paymentAddress: _paymentAddress };
}

export function loadGetterTupleAgentSBT$Data(source: TupleReader) {
    const _collectionAddress = source.readAddress();
    const _itemIndex = source.readBigNumber();
    const _owner = source.readAddress();
    const _content = source.readCell();
    const _authorityAddress = source.readAddress();
    const _revokedAt = source.readBigNumber();
    const _isInitialized = source.readBoolean();
    const _soulHash = source.readBigNumber();
    const _paymentAddress = source.readAddress();
    return { $$type: 'AgentSBT$Data' as const, collectionAddress: _collectionAddress, itemIndex: _itemIndex, owner: _owner, content: _content, authorityAddress: _authorityAddress, revokedAt: _revokedAt, isInitialized: _isInitialized, soulHash: _soulHash, paymentAddress: _paymentAddress };
}

export function storeTupleAgentSBT$Data(source: AgentSBT$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.collectionAddress);
    builder.writeNumber(source.itemIndex);
    builder.writeAddress(source.owner);
    builder.writeCell(source.content);
    builder.writeAddress(source.authorityAddress);
    builder.writeNumber(source.revokedAt);
    builder.writeBoolean(source.isInitialized);
    builder.writeNumber(source.soulHash);
    builder.writeAddress(source.paymentAddress);
    return builder.build();
}

export function dictValueParserAgentSBT$Data(): DictionaryValue<AgentSBT$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeAgentSBT$Data(src)).endCell());
        },
        parse: (src) => {
            return loadAgentSBT$Data(src.loadRef().beginParse());
        }
    }
}

 type AgentSBT_init_args = {
    $$type: 'AgentSBT_init_args';
    collectionAddress: Address;
    itemIndex: bigint;
}

function initAgentSBT_init_args(src: AgentSBT_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.collectionAddress);
        b_0.storeInt(src.itemIndex, 257);
    };
}

async function AgentSBT_init(collectionAddress: Address, itemIndex: bigint) {
    const __code = Cell.fromHex('b5ee9c7241021c010005af000228ff008e88f4a413f4bcf2c80bed5320e303ed43d90112020271020d020120030b02012004060299b51d5da89a1a400031c4bf481a67ff481a9f481a67fa401a803a1a7fff4806020522050204e204c204a20482046d8331d2df481020203ae00b205a202e0e0a8e267104e2070aa65c5b678d9230130500022402012007090299b01a7b513434800063897e9034cffe90353e9034cff48035007434fffe900c040a440a0409c409840944090408db0663a5be9020404075c01640b4405c1c151c4ce209c40e154cb8b6cf1b246013080002210299b2ad7b513434800063897e9034cffe90353e9034cff48035007434fffe900c040a440a0409c409840944090408db0663a5be9020404075c01640b4405c1c151c4ce209c40e154cb8b6cf1b2460130a000623c2000299b8956ed44d0d200018e25fa40d33ffa40d4fa40d33fd200d401d0d3fffa403010291028102710261025102410236c198e96fa40810101d7005902d1017070547133882710385532e2db3c6c918130c0002230201200e100299b8fcfed44d0d200018e25fa40d33ffa40d4fa40d33fd200d401d0d3fffa403010291028102710261025102410236c198e96fa40810101d7005902d1017070547133882710385532e2db3c6c958130f000a54727853980299bad54ed44d0d200018e25fa40d33ffa40d4fa40d33fd200d401d0d3fffa403010291028102710261025102410236c198e96fa40810101d7005902d1017070547133882710385532e2db3c6c918131100022003f83001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e25fa40d33ffa40d4fa40d33fd200d401d0d3fffa403010291028102710261025102410236c198e96fa40810101d7005902d1017070547133882710385532e20a925f0ae008d70d1ff2e08221821050fc0ba9bae3022182105fcc3d14ba13141500000098316c33353503fa40d3fffa40d430810ba108b318f2f48200c1d5f84226c705f2f42410571046030544147f02c87f01ca0055805089ce16cb3f14ce12cccecb3fca0001c8cbff12cecdc9ed5404a68e2a5b816294f2f010685515c87f01ca0055805089ce16cb3f14ce12cccecb3fca0001c8cbff12cecdc9ed54e021821004ded148bae302218210d0c3bfeabae3022182102fcb26a2bae3022182106f89f5e3ba1617181901f631d33ffa40d4d200308138c6f8422ac705f2f4708040029128916de22b1036544b30542590c8555082100524c7ae5007cb1f15cb3f13cbffcecccb3ff400c941305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00106855151b01ec31d33ffa40d4d20030708040f842039129916de22c10474713544c6052a0c8556082100dd607e35008cb1f16cb3f14cbff12cececccb3ff400c941305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00106855151b00f831d33f30f84270804054339ac8552082108b7717355004cb1f12cb3fcbffcec941305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010685515c87f01ca0055805089ce16cb3f14ce12cccecb3fca0001c8cbff12cecdc9ed5401aa8e425b8200e5b0f84224c705f2f4812aee02c00012f2f4f8231068105710461035443302c87f01ca0055805089ce16cb3f14ce12cccecb3fca0001c8cbff12cecdc9ed54e0343182101f04537abae3025f08f2c0821a01c801d33f308138c6f84225c705f2f470830602c8018210d53276db58cb1fcb3fc91035125a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0053331057104644530270021b0040c87f01ca0055805089ce16cb3f14ce12cccecb3fca0001c8cbff12cecdc9ed544728d34b');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initAgentSBT_init_args({ $$type: 'AgentSBT_init_args', collectionAddress, itemIndex })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const AgentSBT_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    2977: { message: "Already initialized" },
    4359: { message: "Name already registered" },
    10990: { message: "Already revoked" },
    14534: { message: "Not owner" },
    25236: { message: "Soulbound: transfers not allowed" },
    49621: { message: "Not collection" },
    58800: { message: "Not authority" },
} as const

export const AgentSBT_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Already initialized": 2977,
    "Name already registered": 4359,
    "Already revoked": 10990,
    "Not owner": 14534,
    "Soulbound: transfers not allowed": 25236,
    "Not collection": 49621,
    "Not authority": 58800,
} as const

const AgentSBT_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"ChangeOwner","header":2174598809,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwnerOk","header":846932810,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"RegisterAgent","header":3148855267,"fields":[{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"agentOwner","type":{"kind":"simple","type":"address","optional":false}},{"name":"soulHash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"paymentAddress","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"RevokeAgent","header":913301552,"fields":[{"name":"itemIndex","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"UpdateCollectionContent","header":3494147988,"fields":[{"name":"content","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Transfer","header":1607220500,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":false}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forwardAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"OwnershipAssigned","header":85167505,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"prevOwner","type":{"kind":"simple","type":"address","optional":false}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"Excesses","header":3576854235,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"GetStaticData","header":801842850,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"ReportStaticData","header":2339837749,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"indexId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"collection","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ProveOwnership","header":81711432,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"dest","type":{"kind":"simple","type":"address","optional":false}},{"name":"forwardPayload","type":{"kind":"simple","type":"cell","optional":false}},{"name":"withContent","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"OwnershipProof","header":86296494,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"itemId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}},{"name":"revokedAt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"content","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"RequestOwner","header":3502489578,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"dest","type":{"kind":"simple","type":"address","optional":false}},{"name":"forwardPayload","type":{"kind":"simple","type":"cell","optional":false}},{"name":"withContent","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"OwnerInfo","header":232130531,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"itemId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"initiator","type":{"kind":"simple","type":"address","optional":false}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}},{"name":"revokedAt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"content","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"Destroy","header":520377210,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"Revoke","header":1871312355,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"MintItem","header":1358695337,"fields":[{"name":"agentOwner","type":{"kind":"simple","type":"address","optional":false}},{"name":"soulHash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"paymentAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"CollectionData","header":null,"fields":[{"name":"nextItemIndex","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"collectionContent","type":{"kind":"simple","type":"cell","optional":false}},{"name":"ownerAddress","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"NftData","header":null,"fields":[{"name":"isInitialized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"index","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"collectionAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"ownerAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"individualContent","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"AgentRegistry$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"nextItemIndex","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"collectionContent","type":{"kind":"simple","type":"cell","optional":false}},{"name":"nameHashes","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"uint","valueFormat":64}}]},
    {"name":"AgentSBT$Data","header":null,"fields":[{"name":"collectionAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"itemIndex","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"content","type":{"kind":"simple","type":"cell","optional":false}},{"name":"authorityAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"revokedAt","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"isInitialized","type":{"kind":"simple","type":"bool","optional":false}},{"name":"soulHash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"paymentAddress","type":{"kind":"simple","type":"address","optional":false}}]},
]

const AgentSBT_opcodes = {
    "ChangeOwner": 2174598809,
    "ChangeOwnerOk": 846932810,
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "RegisterAgent": 3148855267,
    "RevokeAgent": 913301552,
    "UpdateCollectionContent": 3494147988,
    "Transfer": 1607220500,
    "OwnershipAssigned": 85167505,
    "Excesses": 3576854235,
    "GetStaticData": 801842850,
    "ReportStaticData": 2339837749,
    "ProveOwnership": 81711432,
    "OwnershipProof": 86296494,
    "RequestOwner": 3502489578,
    "OwnerInfo": 232130531,
    "Destroy": 520377210,
    "Revoke": 1871312355,
    "MintItem": 1358695337,
}

const AgentSBT_getters: ABIGetter[] = [
    {"name":"get_nft_data","methodId":102351,"arguments":[],"returnType":{"kind":"simple","type":"NftData","optional":false}},
    {"name":"getSoulHash","methodId":73833,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"getPaymentAddress","methodId":126292,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"isRevoked","methodId":80565,"arguments":[],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"getRevokedAt","methodId":84310,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"getAuthority","methodId":67818,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const AgentSBT_getterMapping: { [key: string]: string } = {
    'get_nft_data': 'getGetNftData',
    'getSoulHash': 'getGetSoulHash',
    'getPaymentAddress': 'getGetPaymentAddress',
    'isRevoked': 'getIsRevoked',
    'getRevokedAt': 'getGetRevokedAt',
    'getAuthority': 'getGetAuthority',
}

const AgentSBT_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"MintItem"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Transfer"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ProveOwnership"}},
    {"receiver":"internal","message":{"kind":"typed","type":"RequestOwner"}},
    {"receiver":"internal","message":{"kind":"typed","type":"GetStaticData"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Revoke"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Destroy"}},
]


export class AgentSBT implements Contract {
    
    public static readonly MinTonsForStorage = 50000000n;
    public static readonly GasConsumption = 30000000n;
    public static readonly MintGas = 80000000n;
    public static readonly storageReserve = 0n;
    public static readonly errors = AgentSBT_errors_backward;
    public static readonly opcodes = AgentSBT_opcodes;
    
    static async init(collectionAddress: Address, itemIndex: bigint) {
        return await AgentSBT_init(collectionAddress, itemIndex);
    }
    
    static async fromInit(collectionAddress: Address, itemIndex: bigint) {
        const __gen_init = await AgentSBT_init(collectionAddress, itemIndex);
        const address = contractAddress(0, __gen_init);
        return new AgentSBT(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new AgentSBT(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  AgentSBT_types,
        getters: AgentSBT_getters,
        receivers: AgentSBT_receivers,
        errors: AgentSBT_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: MintItem | Transfer | ProveOwnership | RequestOwner | GetStaticData | Revoke | Destroy) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'MintItem') {
            body = beginCell().store(storeMintItem(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Transfer') {
            body = beginCell().store(storeTransfer(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ProveOwnership') {
            body = beginCell().store(storeProveOwnership(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'RequestOwner') {
            body = beginCell().store(storeRequestOwner(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'GetStaticData') {
            body = beginCell().store(storeGetStaticData(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Revoke') {
            body = beginCell().store(storeRevoke(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Destroy') {
            body = beginCell().store(storeDestroy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetNftData(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_nft_data', builder.build())).stack;
        const result = loadGetterTupleNftData(source);
        return result;
    }
    
    async getGetSoulHash(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getSoulHash', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getGetPaymentAddress(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getPaymentAddress', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getIsRevoked(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('isRevoked', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getGetRevokedAt(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getRevokedAt', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getGetAuthority(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('getAuthority', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}