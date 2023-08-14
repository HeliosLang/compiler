//@ts-check
// Emulator

import {
    assert,
    bytesToHex,
    bigIntToBytes,
    eq
} from "./utils.js";

/**
 * @typedef {import("./crypto.js").NumberGenerator} NumberGenerator
 */

import {
    Crypto
} from "./crypto.js";

import {
    Address,
    Assets,
    PubKey,
    PubKeyHash,
    TxId,
    TxOutputId,
    Value
} from "./helios-data.js";

import {
    NetworkParams
} from "./uplc-costmodels.js";

import {
    Bip32PrivateKey,
    Signature,
    Tx,
    TxInput,
    TxOutput
} from "./tx-builder.js";

/**
 * @typedef {import("./wallets.js").Wallet} Wallet
 */

/**
 * @typedef {import("./network.js").Network} Network
 */

/**
 * Raw network parameters used by Emulator
 * @internal
 */
export const rawNetworkEmulatorParams = {
    shelleyGenesis: {
        activeSlotsCoeff: 0.05,
        epochLength: 432000,
        genDelegs: {
            "637f2e950b0fd8f8e3e811c5fbeb19e411e7a2bf37272b84b29c1a0b": {
                delegate: "aae9293510344ddd636364c2673e34e03e79e3eefa8dbaa70e326f7d",
                vrf: "227116365af2ed943f1a8b5e6557bfaa34996f1578eec667a5e2b361c51e4ce7"
            },
            "8a4b77c4f534f8b8cc6f269e5ebb7ba77fa63a476e50e05e66d7051c": {
                delegate: "d15422b2e8b60e500a82a8f4ceaa98b04e55a0171d1125f6c58f8758",
                vrf: "0ada6c25d62db5e1e35d3df727635afa943b9e8a123ab83785e2281605b09ce2"
            },
            "b00470cd193d67aac47c373602fccd4195aad3002c169b5570de1126": {
                delegate: "b3b539e9e7ed1b32fbf778bf2ebf0a6b9f980eac90ac86623d11881a",
                vrf:"0ff0ce9b820376e51c03b27877cd08f8ba40318f1a9f85a3db0b60dd03f71a7a"
            },
            "b260ffdb6eba541fcf18601923457307647dce807851b9d19da133ab": {
                delegate: "7c64eb868b4ef566391a321c85323f41d2b95480d7ce56ad2abcb022",
                vrf: "7fb22abd39d550c9a022ec8104648a26240a9ff9c88b8b89a6e20d393c03098e"
            },
            "ced1599fd821a39593e00592e5292bdc1437ae0f7af388ef5257344a": {
                delegate: "de7ca985023cf892f4de7f5f1d0a7181668884752d9ebb9e96c95059",
                vrf:"c301b7fc4d1b57fb60841bcec5e3d2db89602e5285801e522fce3790987b1124"
            },
            "dd2a7d71a05bed11db61555ba4c658cb1ce06c8024193d064f2a66ae":{
                delegate:"1e113c218899ee7807f4028071d0e108fc790dade9fd1a0d0b0701ee",
                vrf:"faf2702aa4893c877c622ab22dfeaf1d0c8aab98b837fe2bf667314f0d043822"
            },
            "f3b9e74f7d0f24d2314ea5dfbca94b65b2059d1ff94d97436b82d5b4":{
                delegate: "fd637b08cc379ef7b99c83b416458fcda8a01a606041779331008fb9",
                vrf: "37f2ea7c843a688159ddc2c38a2f997ab465150164a9136dca69564714b73268"
            }
        },
        initialFunds: {},
        maxKESEvolutions: 120,
        maxLovelaceSupply: 45000000000000000,
        networkId: "Testnet",
        networkMagic: 1,
        protocolParams: {
            a0:0.1,
            decentralisationParam:1,
            eMax:18,
            extraEntropy:{
                tag: "NeutralNonce"
            },
            keyDeposit:400000,
            maxBlockBodySize:65536,
            maxBlockHeaderSize:1100,
            maxTxSize:16384,
            minFeeA:44,
            minFeeB:155381,
            minPoolCost:0,
            minUTxOValue:0,
            nOpt:50,
            poolDeposit:500000000,
            protocolVersion:{
                major:2,
                minor:0
            },
            rho:0.00178650067,
            tau:0.1
        },
        securityParam: 2160,
        slotLength:1,
        slotsPerKESPeriod:86400,
        staking:{
            pools:{},
            stake:{}
        },
        systemStart:"2022-06-01T00:00:00Z",
        updateQuorum:5
    },
    alonzoGenesis:{
        lovelacePerUTxOWord:34482,
        executionPrices:{
            prSteps:{
                numerator:721,
                denominator:10000000
            },
            prMem:{
                numerator:577,
                denominator:10000
            }
        },
        maxTxExUnits:{
            exUnitsMem:10000000,
            exUnitsSteps:10000000000
        },
        maxBlockExUnits:{
            exUnitsMem:50000000,
            exUnitsSteps:40000000000
        },
        maxValueSize:5000,
        collateralPercentage:150,
        maxCollateralInputs:3,
        costModels:{
            PlutusV1:{
                "sha2_256-memory-arguments":4,
                "equalsString-cpu-arguments-constant":1000,
                "cekDelayCost-exBudgetMemory":100,
                "lessThanEqualsByteString-cpu-arguments-intercept":103599,
                "divideInteger-memory-arguments-minimum":1,
                "appendByteString-cpu-arguments-slope":621,
                "blake2b-cpu-arguments-slope":29175,
                "iData-cpu-arguments":150000,
                "encodeUtf8-cpu-arguments-slope":1000,
                "unBData-cpu-arguments":150000,
                "multiplyInteger-cpu-arguments-intercept":61516,
                "cekConstCost-exBudgetMemory":100,
                "nullList-cpu-arguments":150000,
                "equalsString-cpu-arguments-intercept":150000,
                "trace-cpu-arguments":150000,
                "mkNilData-memory-arguments":32,
                "lengthOfByteString-cpu-arguments":150000,
                "cekBuiltinCost-exBudgetCPU":29773,
                "bData-cpu-arguments":150000,
                "subtractInteger-cpu-arguments-slope":0,
                "unIData-cpu-arguments":150000,
                "consByteString-memory-arguments-intercept":0,
                "divideInteger-memory-arguments-slope":1,
                "divideInteger-cpu-arguments-model-arguments-slope":118,
                "listData-cpu-arguments":150000,
                "headList-cpu-arguments":150000,
                "chooseData-memory-arguments":32,
                "equalsInteger-cpu-arguments-intercept":136542,
                "sha3_256-cpu-arguments-slope":82363,
                "sliceByteString-cpu-arguments-slope":5000,
                "unMapData-cpu-arguments":150000,
                "lessThanInteger-cpu-arguments-intercept":179690,
                "mkCons-cpu-arguments":150000,
                "appendString-memory-arguments-intercept":0,
                "modInteger-cpu-arguments-model-arguments-slope":118,
                "ifThenElse-cpu-arguments":1,
                "mkNilPairData-cpu-arguments":150000,
                "lessThanEqualsInteger-cpu-arguments-intercept":145276,
                "addInteger-memory-arguments-slope":1,
                "chooseList-memory-arguments":32,"constrData-memory-arguments":32,
                "decodeUtf8-cpu-arguments-intercept":150000,
                "equalsData-memory-arguments":1,
                "subtractInteger-memory-arguments-slope":1,
                "appendByteString-memory-arguments-intercept":0,
                "lengthOfByteString-memory-arguments":4,
                "headList-memory-arguments":32,
                "listData-memory-arguments":32,
                "consByteString-cpu-arguments-intercept":150000,
                "unIData-memory-arguments":32,
                "remainderInteger-memory-arguments-minimum":1,
                "bData-memory-arguments":32,
                "lessThanByteString-cpu-arguments-slope":248,
                "encodeUtf8-memory-arguments-intercept":0,
                "cekStartupCost-exBudgetCPU":100,
                "multiplyInteger-memory-arguments-intercept":0,
                "unListData-memory-arguments":32,
                "remainderInteger-cpu-arguments-model-arguments-slope":118,
                "cekVarCost-exBudgetCPU":29773,
                "remainderInteger-memory-arguments-slope":1,
                "cekForceCost-exBudgetCPU":29773,
                "sha2_256-cpu-arguments-slope":29175,
                "equalsInteger-memory-arguments":1,
                "indexByteString-memory-arguments":1,
                "addInteger-memory-arguments-intercept":1,
                "chooseUnit-cpu-arguments":150000,
                "sndPair-cpu-arguments":150000,
                "cekLamCost-exBudgetCPU":29773,
                "fstPair-cpu-arguments":150000,
                "quotientInteger-memory-arguments-minimum":1,
                "decodeUtf8-cpu-arguments-slope":1000,
                "lessThanInteger-memory-arguments":1,
                "lessThanEqualsInteger-cpu-arguments-slope":1366,
                "fstPair-memory-arguments":32,
                "modInteger-memory-arguments-intercept":0,
                "unConstrData-cpu-arguments":150000,
                "lessThanEqualsInteger-memory-arguments":1,
                "chooseUnit-memory-arguments":32,
                "sndPair-memory-arguments":32,
                "addInteger-cpu-arguments-intercept":197209,
                "decodeUtf8-memory-arguments-slope":8,
                "equalsData-cpu-arguments-intercept":150000,
                "mapData-cpu-arguments":150000,
                "mkPairData-cpu-arguments":150000,
                "quotientInteger-cpu-arguments-constant":148000,
                "consByteString-memory-arguments-slope":1,
                "cekVarCost-exBudgetMemory":100,
                "indexByteString-cpu-arguments":150000,
                "unListData-cpu-arguments":150000,
                "equalsInteger-cpu-arguments-slope":1326,
                "cekStartupCost-exBudgetMemory":100,
                "subtractInteger-cpu-arguments-intercept":197209,
                "divideInteger-cpu-arguments-model-arguments-intercept":425507,
				"divideInteger-memory-arguments-intercept":0,
				"cekForceCost-exBudgetMemory":100,
				"blake2b-cpu-arguments-intercept":2477736,
				"remainderInteger-cpu-arguments-constant":148000,
				"tailList-cpu-arguments":150000,
				"encodeUtf8-cpu-arguments-intercept":150000,
				"equalsString-cpu-arguments-slope":1000,
				"lessThanByteString-memory-arguments":1,
				"multiplyInteger-cpu-arguments-slope":11218,
				"appendByteString-cpu-arguments-intercept":396231,
				"lessThanEqualsByteString-cpu-arguments-slope":248,
				"modInteger-memory-arguments-slope":1,
				"addInteger-cpu-arguments-slope":0,
				"equalsData-cpu-arguments-slope":10000,
				"decodeUtf8-memory-arguments-intercept":0,
				"chooseList-cpu-arguments":150000,
				"constrData-cpu-arguments":150000,
				"equalsByteString-memory-arguments":1,
				"cekApplyCost-exBudgetCPU":29773,
				"quotientInteger-memory-arguments-slope":1,
				"verifySignature-cpu-arguments-intercept":3345831,
				"unMapData-memory-arguments":32,
				"mkCons-memory-arguments":32,
				"sliceByteString-memory-arguments-slope":1,
				"sha3_256-memory-arguments":4,
				"ifThenElse-memory-arguments":1,
				"mkNilPairData-memory-arguments":32,
				"equalsByteString-cpu-arguments-slope":247,
				"appendString-cpu-arguments-intercept":150000,
				"quotientInteger-cpu-arguments-model-arguments-slope":118,
				"cekApplyCost-exBudgetMemory":100,
				"equalsString-memory-arguments":1,
				"multiplyInteger-memory-arguments-slope":1,
				"cekBuiltinCost-exBudgetMemory":100,
				"remainderInteger-memory-arguments-intercept":0,
				"sha2_256-cpu-arguments-intercept":2477736,
				"remainderInteger-cpu-arguments-model-arguments-intercept":425507,
				"lessThanEqualsByteString-memory-arguments":1,
				"tailList-memory-arguments":32,
				"mkNilData-cpu-arguments":150000,
				"chooseData-cpu-arguments":150000,
				"unBData-memory-arguments":32,
				"blake2b-memory-arguments":4,
				"iData-memory-arguments":32,
				"nullList-memory-arguments":32,
				"cekDelayCost-exBudgetCPU":29773,
				"subtractInteger-memory-arguments-intercept":1,
				"lessThanByteString-cpu-arguments-intercept":103599,
				"consByteString-cpu-arguments-slope":1000,
				"appendByteString-memory-arguments-slope":1,
				"trace-memory-arguments":32,
				"divideInteger-cpu-arguments-constant":148000,
				"cekConstCost-exBudgetCPU":29773,
				"encodeUtf8-memory-arguments-slope":8,
				"quotientInteger-cpu-arguments-model-arguments-intercept":425507,
				"mapData-memory-arguments":32,
				"appendString-cpu-arguments-slope":1000,
				"modInteger-cpu-arguments-constant":148000,
				"verifySignature-cpu-arguments-slope":1,
				"unConstrData-memory-arguments":32,
				"quotientInteger-memory-arguments-intercept":0,
				"equalsByteString-cpu-arguments-constant":150000,
				"sliceByteString-memory-arguments-intercept":0,
				"mkPairData-memory-arguments":32,
				"equalsByteString-cpu-arguments-intercept":112536,
				"appendString-memory-arguments-slope":1,
				"lessThanInteger-cpu-arguments-slope":497,
				"modInteger-cpu-arguments-model-arguments-intercept":425507,
				"modInteger-memory-arguments-minimum":1,
				"sha3_256-cpu-arguments-intercept":0,
				"verifySignature-memory-arguments":1,
				"cekLamCost-exBudgetMemory":100,
				"sliceByteString-cpu-arguments-intercept":150000
			}
		}
	},
	latestParams:{
		collateralPercentage:150,
		costModels:{
			PlutusScriptV1:{
				"addInteger-cpu-arguments-intercept":205665,
				"addInteger-cpu-arguments-slope":812,
				"addInteger-memory-arguments-intercept":1,
				"addInteger-memory-arguments-slope":1,
				"appendByteString-cpu-arguments-intercept":1000,
				"appendByteString-cpu-arguments-slope":571,
				"appendByteString-memory-arguments-intercept":0,
				"appendByteString-memory-arguments-slope":1,
				"appendString-cpu-arguments-intercept":1000,
				"appendString-cpu-arguments-slope":24177,
				"appendString-memory-arguments-intercept":4,
				"appendString-memory-arguments-slope":1,
				"bData-cpu-arguments":1000,
				"bData-memory-arguments":32,
				"blake2b_256-cpu-arguments-intercept":117366,
				"blake2b_256-cpu-arguments-slope":10475,
				"blake2b_256-memory-arguments":4,
				"cekApplyCost-exBudgetCPU":23000,
				"cekApplyCost-exBudgetMemory":100,
				"cekBuiltinCost-exBudgetCPU":23000,
				"cekBuiltinCost-exBudgetMemory":100,
				"cekConstCost-exBudgetCPU":23000,
				"cekConstCost-exBudgetMemory":100,
				"cekDelayCost-exBudgetCPU":23000,
				"cekDelayCost-exBudgetMemory":100,
				"cekForceCost-exBudgetCPU":23000,
				"cekForceCost-exBudgetMemory":100,
				"cekLamCost-exBudgetCPU":23000,
				"cekLamCost-exBudgetMemory":100,
				"cekStartupCost-exBudgetCPU":100,
				"cekStartupCost-exBudgetMemory":100,
				"cekVarCost-exBudgetCPU":23000,
				"cekVarCost-exBudgetMemory":100,
				"chooseData-cpu-arguments":19537,
				"chooseData-memory-arguments":32,
				"chooseList-cpu-arguments":175354,
				"chooseList-memory-arguments":32,
				"chooseUnit-cpu-arguments":46417,
				"chooseUnit-memory-arguments":4,
				"consByteString-cpu-arguments-intercept":221973,
				"consByteString-cpu-arguments-slope":511,
				"consByteString-memory-arguments-intercept":0,
				"consByteString-memory-arguments-slope":1,
				"constrData-cpu-arguments":89141,
				"constrData-memory-arguments":32,
				"decodeUtf8-cpu-arguments-intercept":497525,
				"decodeUtf8-cpu-arguments-slope":14068,
				"decodeUtf8-memory-arguments-intercept":4,
				"decodeUtf8-memory-arguments-slope":2,
				"divideInteger-cpu-arguments-constant":196500,
				"divideInteger-cpu-arguments-model-arguments-intercept":453240,
				"divideInteger-cpu-arguments-model-arguments-slope":220,
				"divideInteger-memory-arguments-intercept":0,
				"divideInteger-memory-arguments-minimum":1,
				"divideInteger-memory-arguments-slope":1,
				"encodeUtf8-cpu-arguments-intercept":1000,
				"encodeUtf8-cpu-arguments-slope":28662,
				"encodeUtf8-memory-arguments-intercept":4,
				"encodeUtf8-memory-arguments-slope":2,
				"equalsByteString-cpu-arguments-constant":245000,
				"equalsByteString-cpu-arguments-intercept":216773,
				"equalsByteString-cpu-arguments-slope":62,
				"equalsByteString-memory-arguments":1,
				"equalsData-cpu-arguments-intercept":1060367,
				"equalsData-cpu-arguments-slope":12586,
				"equalsData-memory-arguments":1,
				"equalsInteger-cpu-arguments-intercept":208512,
				"equalsInteger-cpu-arguments-slope":421,
				"equalsInteger-memory-arguments":1,
				"equalsString-cpu-arguments-constant":187000,
				"equalsString-cpu-arguments-intercept":1000,
				"equalsString-cpu-arguments-slope":52998,
				"equalsString-memory-arguments":1,
				"fstPair-cpu-arguments":80436,
				"fstPair-memory-arguments":32,
				"headList-cpu-arguments":43249,
				"headList-memory-arguments":32,
				"iData-cpu-arguments":1000,
				"iData-memory-arguments":32,
				"ifThenElse-cpu-arguments":80556,
				"ifThenElse-memory-arguments":1,
				"indexByteString-cpu-arguments":57667,
				"indexByteString-memory-arguments":4,
				"lengthOfByteString-cpu-arguments":1000,
				"lengthOfByteString-memory-arguments":10,
				"lessThanByteString-cpu-arguments-intercept":197145,
				"lessThanByteString-cpu-arguments-slope":156,
				"lessThanByteString-memory-arguments":1,
				"lessThanEqualsByteString-cpu-arguments-intercept":197145,
				"lessThanEqualsByteString-cpu-arguments-slope":156,
				"lessThanEqualsByteString-memory-arguments":1,
				"lessThanEqualsInteger-cpu-arguments-intercept":204924,
				"lessThanEqualsInteger-cpu-arguments-slope":473,
				"lessThanEqualsInteger-memory-arguments":1,
				"lessThanInteger-cpu-arguments-intercept":208896,
				"lessThanInteger-cpu-arguments-slope":511,
				"lessThanInteger-memory-arguments":1,
				"listData-cpu-arguments":52467,
				"listData-memory-arguments":32,
				"mapData-cpu-arguments":64832,
				"mapData-memory-arguments":32,
				"mkCons-cpu-arguments":65493,
				"mkCons-memory-arguments":32,
				"mkNilData-cpu-arguments":22558,
				"mkNilData-memory-arguments":32,
				"mkNilPairData-cpu-arguments":16563,
				"mkNilPairData-memory-arguments":32,
				"mkPairData-cpu-arguments":76511,
				"mkPairData-memory-arguments":32,
				"modInteger-cpu-arguments-constant":196500,
				"modInteger-cpu-arguments-model-arguments-intercept":453240,
				"modInteger-cpu-arguments-model-arguments-slope":220,
				"modInteger-memory-arguments-intercept":0,
				"modInteger-memory-arguments-minimum":1,
				"modInteger-memory-arguments-slope":1,
				"multiplyInteger-cpu-arguments-intercept":69522,
				"multiplyInteger-cpu-arguments-slope":11687,
				"multiplyInteger-memory-arguments-intercept":0,
				"multiplyInteger-memory-arguments-slope":1,
				"nullList-cpu-arguments":60091,
				"nullList-memory-arguments":32,
				"quotientInteger-cpu-arguments-constant":196500,
				"quotientInteger-cpu-arguments-model-arguments-intercept":453240,
				"quotientInteger-cpu-arguments-model-arguments-slope":220,
				"quotientInteger-memory-arguments-intercept":0,
				"quotientInteger-memory-arguments-minimum":1,
				"quotientInteger-memory-arguments-slope":1,
				"remainderInteger-cpu-arguments-constant":196500,
				"remainderInteger-cpu-arguments-model-arguments-intercept":453240,
				"remainderInteger-cpu-arguments-model-arguments-slope":220,
				"remainderInteger-memory-arguments-intercept":0,
				"remainderInteger-memory-arguments-minimum":1,
				"remainderInteger-memory-arguments-slope":1,
				"sha2_256-cpu-arguments-intercept":806990,
				"sha2_256-cpu-arguments-slope":30482,
				"sha2_256-memory-arguments":4,
				"sha3_256-cpu-arguments-intercept":1927926,
				"sha3_256-cpu-arguments-slope":82523,
				"sha3_256-memory-arguments":4,
				"sliceByteString-cpu-arguments-intercept":265318,
				"sliceByteString-cpu-arguments-slope":0,
				"sliceByteString-memory-arguments-intercept":4,
				"sliceByteString-memory-arguments-slope":0,
				"sndPair-cpu-arguments":85931,
				"sndPair-memory-arguments":32,
				"subtractInteger-cpu-arguments-intercept":205665,
				"subtractInteger-cpu-arguments-slope":812,
				"subtractInteger-memory-arguments-intercept":1,
				"subtractInteger-memory-arguments-slope":1,
				"tailList-cpu-arguments":41182,
				"tailList-memory-arguments":32,
				"trace-cpu-arguments":212342,
				"trace-memory-arguments":32,
				"unBData-cpu-arguments":31220,
				"unBData-memory-arguments":32,
				"unConstrData-cpu-arguments":32696,
				"unConstrData-memory-arguments":32,
				"unIData-cpu-arguments":43357,
				"unIData-memory-arguments":32,
				"unListData-cpu-arguments":32247,
				"unListData-memory-arguments":32,
				"unMapData-cpu-arguments":38314,
				"unMapData-memory-arguments":32,
				"verifyEd25519Signature-cpu-arguments-intercept":9462713,
				"verifyEd25519Signature-cpu-arguments-slope":1021,
				"verifyEd25519Signature-memory-arguments":10
			},
			PlutusScriptV2:{
				"addInteger-cpu-arguments-intercept":205665,
				"addInteger-cpu-arguments-slope":812,
				"addInteger-memory-arguments-intercept":1,
				"addInteger-memory-arguments-slope":1,
				"appendByteString-cpu-arguments-intercept":1000,
				"appendByteString-cpu-arguments-slope":571,
				"appendByteString-memory-arguments-intercept":0,
				"appendByteString-memory-arguments-slope":1,
				"appendString-cpu-arguments-intercept":1000,
				"appendString-cpu-arguments-slope":24177,
				"appendString-memory-arguments-intercept":4,
				"appendString-memory-arguments-slope":1,
				"bData-cpu-arguments":1000,
				"bData-memory-arguments":32,
				"blake2b_256-cpu-arguments-intercept":117366,
				"blake2b_256-cpu-arguments-slope":10475,
				"blake2b_256-memory-arguments":4,
				"cekApplyCost-exBudgetCPU":23000,
				"cekApplyCost-exBudgetMemory":100,
				"cekBuiltinCost-exBudgetCPU":23000,
				"cekBuiltinCost-exBudgetMemory":100,
				"cekConstCost-exBudgetCPU":23000,
				"cekConstCost-exBudgetMemory":100,
				"cekDelayCost-exBudgetCPU":23000,
				"cekDelayCost-exBudgetMemory":100,
				"cekForceCost-exBudgetCPU":23000,
				"cekForceCost-exBudgetMemory":100,
				"cekLamCost-exBudgetCPU":23000,
				"cekLamCost-exBudgetMemory":100,
				"cekStartupCost-exBudgetCPU":100,
				"cekStartupCost-exBudgetMemory":100,
				"cekVarCost-exBudgetCPU":23000,
				"cekVarCost-exBudgetMemory":100,
				"chooseData-cpu-arguments":19537,
				"chooseData-memory-arguments":32,
				"chooseList-cpu-arguments":175354,
				"chooseList-memory-arguments":32,
				"chooseUnit-cpu-arguments":46417,
				"chooseUnit-memory-arguments":4,
				"consByteString-cpu-arguments-intercept":221973,
				"consByteString-cpu-arguments-slope":511,
				"consByteString-memory-arguments-intercept":0,
				"consByteString-memory-arguments-slope":1,
				"constrData-cpu-arguments":89141,
				"constrData-memory-arguments":32,
				"decodeUtf8-cpu-arguments-intercept":497525,
				"decodeUtf8-cpu-arguments-slope":14068,
				"decodeUtf8-memory-arguments-intercept":4,
				"decodeUtf8-memory-arguments-slope":2,
				"divideInteger-cpu-arguments-constant":196500,
				"divideInteger-cpu-arguments-model-arguments-intercept":453240,
				"divideInteger-cpu-arguments-model-arguments-slope":220,
				"divideInteger-memory-arguments-intercept":0,
				"divideInteger-memory-arguments-minimum":1,
				"divideInteger-memory-arguments-slope":1,
				"encodeUtf8-cpu-arguments-intercept":1000,
				"encodeUtf8-cpu-arguments-slope":28662,
				"encodeUtf8-memory-arguments-intercept":4,
				"encodeUtf8-memory-arguments-slope":2,
				"equalsByteString-cpu-arguments-constant":245000,
				"equalsByteString-cpu-arguments-intercept":216773,
				"equalsByteString-cpu-arguments-slope":62,
				"equalsByteString-memory-arguments":1,
				"equalsData-cpu-arguments-intercept":1060367,
				"equalsData-cpu-arguments-slope":12586,
				"equalsData-memory-arguments":1,
				"equalsInteger-cpu-arguments-intercept":208512,
				"equalsInteger-cpu-arguments-slope":421,
				"equalsInteger-memory-arguments":1,
				"equalsString-cpu-arguments-constant":187000,
				"equalsString-cpu-arguments-intercept":1000,
				"equalsString-cpu-arguments-slope":52998,
				"equalsString-memory-arguments":1,
				"fstPair-cpu-arguments":80436,
				"fstPair-memory-arguments":32,
				"headList-cpu-arguments":43249,
				"headList-memory-arguments":32,
				"iData-cpu-arguments":1000,
				"iData-memory-arguments":32,
				"ifThenElse-cpu-arguments":80556,
				"ifThenElse-memory-arguments":1,
				"indexByteString-cpu-arguments":57667,
				"indexByteString-memory-arguments":4,
				"lengthOfByteString-cpu-arguments":1000,
				"lengthOfByteString-memory-arguments":10,
				"lessThanByteString-cpu-arguments-intercept":197145,
				"lessThanByteString-cpu-arguments-slope":156,
				"lessThanByteString-memory-arguments":1,
				"lessThanEqualsByteString-cpu-arguments-intercept":197145,
				"lessThanEqualsByteString-cpu-arguments-slope":156,
				"lessThanEqualsByteString-memory-arguments":1,
				"lessThanEqualsInteger-cpu-arguments-intercept":204924,
				"lessThanEqualsInteger-cpu-arguments-slope":473,
				"lessThanEqualsInteger-memory-arguments":1,
				"lessThanInteger-cpu-arguments-intercept":208896,
				"lessThanInteger-cpu-arguments-slope":511,
				"lessThanInteger-memory-arguments":1,
				"listData-cpu-arguments":52467,
				"listData-memory-arguments":32,
				"mapData-cpu-arguments":64832,
				"mapData-memory-arguments":32,
				"mkCons-cpu-arguments":65493,
				"mkCons-memory-arguments":32,
				"mkNilData-cpu-arguments":22558,
				"mkNilData-memory-arguments":32,
				"mkNilPairData-cpu-arguments":16563,
				"mkNilPairData-memory-arguments":32,
				"mkPairData-cpu-arguments":76511,
				"mkPairData-memory-arguments":32,
				"modInteger-cpu-arguments-constant":196500,
				"modInteger-cpu-arguments-model-arguments-intercept":453240,
				"modInteger-cpu-arguments-model-arguments-slope":220,
				"modInteger-memory-arguments-intercept":0,
				"modInteger-memory-arguments-minimum":1,
				"modInteger-memory-arguments-slope":1,
				"multiplyInteger-cpu-arguments-intercept":69522,
				"multiplyInteger-cpu-arguments-slope":11687,
				"multiplyInteger-memory-arguments-intercept":0,
				"multiplyInteger-memory-arguments-slope":1,
				"nullList-cpu-arguments":60091,
				"nullList-memory-arguments":32,
				"quotientInteger-cpu-arguments-constant":196500,
				"quotientInteger-cpu-arguments-model-arguments-intercept":453240,
				"quotientInteger-cpu-arguments-model-arguments-slope":220,
				"quotientInteger-memory-arguments-intercept":0,
				"quotientInteger-memory-arguments-minimum":1,
				"quotientInteger-memory-arguments-slope":1,
				"remainderInteger-cpu-arguments-constant":196500,
				"remainderInteger-cpu-arguments-model-arguments-intercept":453240,
				"remainderInteger-cpu-arguments-model-arguments-slope":220,
				"remainderInteger-memory-arguments-intercept":0,
				"remainderInteger-memory-arguments-minimum":1,
				"remainderInteger-memory-arguments-slope":1,
				"serialiseData-cpu-arguments-intercept":1159724,
				"serialiseData-cpu-arguments-slope":392670,
				"serialiseData-memory-arguments-intercept":0,
				"serialiseData-memory-arguments-slope":2,
				"sha2_256-cpu-arguments-intercept":806990,
				"sha2_256-cpu-arguments-slope":30482,
				"sha2_256-memory-arguments":4,
				"sha3_256-cpu-arguments-intercept":1927926,
				"sha3_256-cpu-arguments-slope":82523,
				"sha3_256-memory-arguments":4,
				"sliceByteString-cpu-arguments-intercept":265318,
				"sliceByteString-cpu-arguments-slope":0,
				"sliceByteString-memory-arguments-intercept":4,
				"sliceByteString-memory-arguments-slope":0,
				"sndPair-cpu-arguments":85931,
				"sndPair-memory-arguments":32,
				"subtractInteger-cpu-arguments-intercept":205665,
				"subtractInteger-cpu-arguments-slope":812,
				"subtractInteger-memory-arguments-intercept":1,
				"subtractInteger-memory-arguments-slope":1,
				"tailList-cpu-arguments":41182,
				"tailList-memory-arguments":32,
				"trace-cpu-arguments":212342,
				"trace-memory-arguments":32,
				"unBData-cpu-arguments":31220,
				"unBData-memory-arguments":32,
				"unConstrData-cpu-arguments":32696,
				"unConstrData-memory-arguments":32,
				"unIData-cpu-arguments":43357,
				"unIData-memory-arguments":32,
				"unListData-cpu-arguments":32247,
				"unListData-memory-arguments":32,
				"unMapData-cpu-arguments":38314,
				"unMapData-memory-arguments":32,
				"verifyEcdsaSecp256k1Signature-cpu-arguments":20000000000,
				"verifyEcdsaSecp256k1Signature-memory-arguments":20000000000,
				"verifyEd25519Signature-cpu-arguments-intercept":9462713,
				"verifyEd25519Signature-cpu-arguments-slope":1021,
				"verifyEd25519Signature-memory-arguments":10,
				"verifySchnorrSecp256k1Signature-cpu-arguments-intercept":20000000000,
				"verifySchnorrSecp256k1Signature-cpu-arguments-slope":0,
				"verifySchnorrSecp256k1Signature-memory-arguments":20000000000
			}
		},
		executionUnitPrices:{
			priceMemory:0.0577,
			priceSteps:0.0000721
		},
		maxBlockBodySize:90112,
		maxBlockExecutionUnits:{
			memory:62000000,
			steps:40000000000
		},
		maxBlockHeaderSize:1100,
		maxCollateralInputs:3,
		maxTxExecutionUnits:{
			memory:14000000,
			steps:10000000000
		},
		maxTxSize:16384,
		maxValueSize:5000,
		minPoolCost:340000000,
		monetaryExpansion:0.003,
		poolPledgeInfluence:0.3,
		poolRetireMaxEpoch:18,
		protocolVersion:{
			major:7,
			minor:0
		},
		stakeAddressDeposit:2000000,
		stakePoolDeposit:500000000,
		stakePoolTargetNum:500,
		treasuryCut:0.2,
		txFeeFixed:155381,
		txFeePerByte:44,
		utxoCostPerByte:4310
	},
	latestTip:{
		epoch:29,
		hash:"0de380c16222470e4cf4f7cce8af9a7b54d63e5aa4228520df9f2d252a0efcb5",
		slot:11192926,
		time:1666876126000
	}
};

/**
 * An emulated `Wallet`, created by calling `emulator.createWallet()`.
 * 
 * This wallet only has a single private/public key, which isn't rotated. Staking is not yet supported.
 * @implements {Wallet}
 */
export class WalletEmulator {
    /**
     * @type {Network}
     */
    #network;

    /**
     * @type {Bip32PrivateKey}
     */
    #privateKey;

    /**
     * @type {PubKey}
     */
    #pubKey;

    /**
     * @param {Network} network
     * @param {Bip32PrivateKey} privateKey
     */
    constructor(network, privateKey) {
        this.#network = network;
        this.#privateKey = privateKey;
        this.#pubKey = this.#privateKey.derivePubKey();

        // TODO: staking credentials
    }

    /**
     * @type {Bip32PrivateKey}
     */
    get privateKey() {
        return this.#privateKey;
    }

    /**
     * @type {PubKey}
     */
    get pubKey() {
        return this.#pubKey;
    }

    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash() {
        return this.#pubKey.pubKeyHash;
    }

    /**
     * @type {Address}
     */
    get address() {
        return Address.fromPubKeyHash(this.pubKeyHash);
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return false;
    }

    /**
     * Assumed wallet was initiated with at least 1 UTxO at the pubkeyhash address.
     * @type {Promise<Address[]>}
     */
    get usedAddresses() {
        return new Promise((resolve, _) => {
            resolve([this.address])
        });
    }

    /**
     * @type {Promise<Address[]>}
     */
    get unusedAddresses() {
        return new Promise((resolve, _) => {
            resolve([])
        });
    }

    /**
     * @type {Promise<TxInput[]>}
     */
    get utxos() {
        return new Promise((resolve, _) => {
            resolve(this.#network.getUtxos(this.address));
        });
    }

    /**
     * @type {Promise<TxInput[]>}
     */
     get collateral() {
        return new Promise((resolve, _) => {
            resolve([])
        });
    }

    /**
     * Simply assumed the tx needs to by signed by this wallet without checking.
     * @param {Tx} tx
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        return [
            this.#privateKey.sign(tx.bodyHash)
        ];
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        return await this.#network.submitTx(tx);
    }
}

/**
 * collectUtxos removes tx inputs from the list, and appends txoutputs sent to the address to the end.
 * @internal
 * @typedef {{
 *     id(): TxId
 *     consumes(utxo: TxInput): boolean
 *     collectUtxos(address: Address, utxos: TxInput[]): TxInput[]
 *     getUtxo(id: TxOutputId): (null | TxInput)
 *     dump(): void
 * }} EmulatorTx
 */

/**
 * @implements {EmulatorTx}
 */
class GenesisTx {
    #id;
    #address;
    #lovelace;
    #assets;

    /**
     * @param {number} id
     * @param {Address} address
     * @param {bigint} lovelace
     * @param {Assets} assets
     */
    constructor(id, address, lovelace, assets) {
        this.#id = id;
        this.#address = address;
        this.#lovelace = lovelace;
        this.#assets = assets;
    }

    /**
     * Simple incremental txId for genesis transactions.
     * It's very unlikely that regular transactions have the same hash.
     * @return {TxId}
     */
    id() {
        let bytes = bigIntToBytes(BigInt(this.#id));

        if (bytes.length < 32) {
            bytes = (new Array(32 - bytes.length)).fill(0).concat(bytes);
        }

        return new TxId(bytes);
    }

    /**
     * @param {TxInput} utxo
     * @returns {boolean}
     */
    consumes(utxo) {
        return false;
    }

    /**
     * @param {Address} address
     * @param {TxInput[]} utxos
     * @returns {TxInput[]}
     */
    collectUtxos(address, utxos) {
        if (eq(this.#address.bytes, address.bytes)) {
            utxos = utxos.slice();

            utxos.push(new TxInput(
                new TxOutputId({txId: this.id(), utxoId: 0}),
                new TxOutput(
                    this.#address,
                    new Value(this.#lovelace, this.#assets)
                )
            ));

            return utxos;
        } else {
            return utxos;
        }
    }

    /**
     * @param {TxOutputId} id 
     * @returns {null | TxInput}
     */
    getUtxo(id) {
        if (!(this.id().eq(id.txId) && id.utxoIdx == 0)) {
            return null;
        }

        return new TxInput(
            new TxOutputId({txId: this.id(), utxoId: 0}),
            new TxOutput(
                this.#address,
                new Value(this.#lovelace, this.#assets)
            )
        );
    }

    dump() {
        console.log("GENESIS TX");
        console.log(`id: ${this.#id.toString()},\naddress: ${this.#address.toBech32()},\nlovelace: ${this.#lovelace.toString()},\nassets: ${JSON.stringify(this.#assets.dump(), undefined, "    ")}`);
    }
}

/**
 * @implements {EmulatorTx}
 */
class RegularTx {
    #tx;

    /**
     * @param {Tx} tx
     */
    constructor(tx) {
        this.#tx = tx;
    }

    /**
     * @returns {TxId}
     */
    id() {
        return this.#tx.id();
    }

    /**
     * @param {TxInput} utxo
     * @returns {boolean}
     */
    consumes(utxo) {
        const txInputs = this.#tx.body.inputs;

        return txInputs.some(txInput => txInput.eq(utxo));
    }

    /**
     * @param {Address} address
     * @param {TxInput[]} utxos
     * @returns {TxInput[]}
     */
    collectUtxos(address, utxos) {
        utxos = utxos.filter(utxo => !this.consumes(utxo));

        const txOutputs = this.#tx.body.outputs;

        txOutputs.forEach((txOutput, utxoId) => {
            if (eq(txOutput.address.bytes, address.bytes)) {
                utxos.push(new TxInput(
                    new TxOutputId({txId: this.id(), utxoId: utxoId}),
                    txOutput
                ));
            }
        });

        return utxos;
    }

    /**
     * @param {TxOutputId} id 
     * @returns {null | TxInput}
     */
    getUtxo(id) {
        if (!id.txId.eq(this.id())) {
            return null;
        }

        /**
         * @type {null | TxInput}
         */
        let utxo = null;

        this.#tx.body.outputs.forEach((output, i) => {
            if (i == id.utxoIdx) {
                utxo = new TxInput(
                    id,
                    output
                );
            }
        });

        return utxo;
    }

    dump() {
        console.log("REGULAR TX");
        console.log(JSON.stringify(this.#tx.dump(), undefined, "  "));
    }
}

/**
 * A simple emulated Network.
 * This can be used to do integration tests of whole dApps.
 * Staking is not yet supported.
 * @implements {Network}
 */
export class NetworkEmulator {
    /**
     * @type {bigint}
     */
    #slot;

    /**
     * @type {NumberGenerator}
     */
    #random;

    /**
     * @type {GenesisTx[]}
     */
    #genesis;

    /**
     * @type {EmulatorTx[]}
     */
    #mempool;

    /**
     * @type {EmulatorTx[][]}
     */
    #blocks;

    /**
     * Instantiates a NetworkEmulator at slot 0.
     * An optional seed number can be specified, from which all emulated randomness is derived.
     * @param {number} seed
     */
    constructor(seed = 0) {
        this.#slot = 0n;
        this.#random = Crypto.mulberry32(seed);
        this.#genesis = [];
        this.#mempool = [];
        this.#blocks = [];
    }

    /**
     * @type {bigint}
     */
    get currentSlot() {
        return this.#slot;
    }

    /**
     * Creates a new `NetworkParams` instance that has access to current slot 
     * (so that the `Tx` validity range can be set automatically during `Tx.finalize()`).
     * @param {NetworkParams} networkParams
     * @returns {NetworkParams}
     */
    initNetworkParams(networkParams) {
        const raw = Object.assign({}, networkParams.raw);

        raw.latestTip = {
            epoch: 0,
            hash: "",
            slot: 0,
            time: 0
        };

        return new NetworkParams(
            raw,
            () => {
                return this.#slot;
            }
        );
    }

    /**
     * Creates a new WalletEmulator and populates it with a given lovelace quantity and assets.
     * Special genesis transactions are added to the emulated chain in order to create these assets.
     * @param {bigint} lovelace
     * @param {Assets} assets
     * @returns {WalletEmulator}
     */
    createWallet(lovelace = 0n, assets = new Assets([])) {
        const wallet = new WalletEmulator(this, Bip32PrivateKey.random(this.#random));

        this.createUtxo(wallet, lovelace, assets);

        return wallet;
    }

    /**
     * Creates a UTxO using a GenesisTx.
     * @param {WalletEmulator} wallet
     * @param {bigint} lovelace
     * @param {Assets} assets
     */
    createUtxo(wallet, lovelace, assets = new Assets([])) {
        if (lovelace != 0n || !assets.isZero()) {
            const tx = new GenesisTx(
                this.#genesis.length,
                wallet.address,
                lovelace,
                assets
            );

            this.#genesis.push(tx);
            this.#mempool.push(tx);
        }
    }

    /**
     * Mint a block with the current mempool, and advance the slot by a number of slots.
     * @param {bigint} nSlots
     */
    tick(nSlots) {
        assert(nSlots > 0, `nSlots must be > 0, got ${nSlots.toString()}`);

        if (this.#mempool.length > 0) {
            this.#blocks.push(this.#mempool);

            this.#mempool = [];
        }

        this.#slot += nSlots;
    }
    
    /**
     * @returns {Promise<NetworkParams>}
     */
    async getParameters() {
        return this.initNetworkParams(new NetworkParams(rawNetworkEmulatorParams));
    }

    warnMempool() {
        if (this.#mempool.length > 0) {
            console.error("Warning: mempool not empty (hint: use 'network.tick()')");
        }
    }

    /**
     * Throws an error if the UTxO isn't found
     * @param {TxOutputId} id 
     * @returns {Promise<TxInput>}
     */
    async getUtxo(id) {
        this.warnMempool();

        for (let block of this.#blocks) {
            for (let tx of block) {
                const utxo = tx.getUtxo(id)
                if (utxo) {
                    return utxo;
                }
            }
        }

        throw new Error(`utxo with id ${id.toString()} doesn't exist`);
    }

    /**
     * @param {Address} address
     * @returns {Promise<TxInput[]>}
     */
    async getUtxos(address) {
        this.warnMempool();

        /**
         * @type {TxInput[]}
         */
        let utxos = [];

        for (let block of this.#blocks) {
            for (let tx of block) {
                utxos = tx.collectUtxos(address, utxos);
            }
        }

        return utxos;
    }

    dump() {
        console.log(`${this.#blocks.length} BLOCKS`);
        this.#blocks.forEach((block, i) => {
            console.log(`${block.length} TXs in BLOCK ${i}`);
            for (let tx of block) {
                tx.dump();
            }
        })
    }

    /**
     * @param {TxInput} utxo
     * @returns {boolean}
     */
    isConsumed(utxo) {
        return this.#blocks.some(b => {
            return b.some(tx => {
                return tx.consumes(utxo)
            })
        }) || this.#mempool.some(tx => {
            return tx.consumes(utxo);
        })
    }

    /**
     * @param {Tx} tx
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        this.warnMempool();
        
        assert(tx.isValid(this.#slot), "tx invalid (not finalized or slot out of range)");

        // make sure that none of the inputs have been consumed before
        assert(tx.body.inputs.every(input => !this.isConsumed(input)), "input already consumed before");

        this.#mempool.push(new RegularTx(tx));

        return tx.id();
    }
}

/**
 * @internal
 * @implements {Wallet}
 */
class TxChainWallet {
    #base;
    #chain;
    
    /**
     * 
     * @param {Wallet} base 
     * @param {TxChain} chain 
     */
    constructor(base, chain) {
        this.#base = base;
        this.#chain = chain;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isMainnet() {
        return this.#base.isMainnet()
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<Signature[]>}
     */
    async signTx(tx) {
        return this.#base.signTx(tx)
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        return this.#chain.submitTx(tx)
    }

    get unusedAddresses() {
        return this.#base.unusedAddresses;
    }

    get usedAddresses() {
        return this.#base.usedAddresses;
    }

    /**
     * @internal
     * @param {TxInput[]} utxos 
     * @returns {Promise<TxInput[]>}
     */
    async filterUtxos(utxos) {
        const ua = await this.usedAddresses;
        const una = await this.unusedAddresses;

        const addrs = ua.concat(una);

        return await this.#chain.getUtxosInternal(utxos, addrs);
    }

    /**
     * @type {Promise<TxInput[]>}
     */
    get collateral() {
        return new Promise((resolve, reject) => {
            this.#base.collateral.then(utxos => {
                this.filterUtxos(utxos).then(utxos => {
                    resolve(utxos);
                });
            });
        });
    }

    /**
     * @type {Promise<TxInput[]>}
     */
    get utxos() {
        return new Promise((resolve, reject) => {
            this.#base.utxos.then(utxos => {
                this.filterUtxos(utxos).then(utxos => {
                    resolve(utxos);
                });
            });
        });
    }
}

/**
 * Helper that 
 * @implements {Network}
 */
export class TxChain {
    #network;

    /**
     * @type {RegularTx[]}
     */
    #txs;

    /**
     * @param {Network} network 
     */
    constructor(network) {
        this.#network = network;
        this.#txs = [];
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        const id = await this.#network.submitTx(tx);

        this.#txs.push(new RegularTx(tx));

        return id;
    }

    /**
     * @returns {Promise<NetworkParams>}
     */
    async getParameters() {
        return this.#network.getParameters()
    }

    /**
     * @param {TxOutputId} id 
     * @returns {Promise<TxInput>}
     */
    async getUtxo(id) {
        for (let i = 0; i < this.#txs.length; i++) {
            const txInput = this.#txs[i].getUtxo(id);

            if (txInput) {
                return txInput;
            }
        }

        return this.#network.getUtxo(id);
    }

    /**
     * @param {TxInput[]} utxos
     * @param {Address[]} addrs
     * @returns {Promise<TxInput[]>}
     */
    async getUtxosInternal(utxos, addrs) {
        for (let tx of this.#txs) {
            addrs.forEach(addr => {
                utxos = tx.collectUtxos(addr, utxos);
            });
        }

        return utxos;
    }
    /**
     * @param {Address} addr
     * @returns {Promise<TxInput[]>}
     */
    async getUtxos(addr) {
        let utxos = await this.#network.getUtxos(addr);

        return this.getUtxosInternal(utxos, [addr])
    }

    /**
     * @param {Wallet} baseWallet 
     * @returns {Wallet}
     */
    asWallet(baseWallet) {
        return new TxChainWallet(baseWallet, this);
    }
}

/**
 * @typedef {{
 *   [address: string]: TxInput[]
 * }} NetworkSliceUTxOs
 */

/**
 * @implements {Network}
 */
export class NetworkSlice {
    #params;
    #utxos;

    /**
     * @param {NetworkParams} params
     * @param {NetworkSliceUTxOs} utxos 
     */
    constructor(params, utxos) {
        this.#params = params;
        this.#utxos = utxos;
    }

    /**
     * @param {Network} network
     * @param {Address[]} addresses
     * @returns {Promise<NetworkSlice>}
     */
    static async init(network, addresses) {
        /**
         * @type {[Promise<NetworkParams>, ...Promise<TxInput[]>[]]}
         */
        const promises = [
            network.getParameters(),
            ...addresses.map(a => network.getUtxos(a))
        ];

        const resolved = await Promise.all(promises);

        const [params, ...utxos] = resolved;

        /**
         * @type {NetworkSliceUTxOs}
         */
        const obj = {};

        addresses.forEach((a, i) => {
            obj[a.toBech32()] = utxos[i];
        });

        return new NetworkSlice(params, obj);
    }

    /**
     * @returns {any}
     */
    toJson() {
        const obj = {};

        for (let a in this.#utxos) {
            obj[a] = this.#utxos[a].map(utxo => bytesToHex(utxo.toFullCbor()));
        }

        return {
            params: this.#params.raw,
            utxos: obj
        };
    }

    /**
     * @param {any} obj 
     * @returns {NetworkSlice}
     */
    static fromJson(obj) {
        const params = new NetworkParams(obj.params);

        /**
         * @type {NetworkSliceUTxOs}
         */
        const utxos = {};

        for (let a in obj.utxos) {
            utxos[a] = obj.utxos[a].map(utxo => TxInput.fromFullCbor(utxo));
        }

        return new NetworkSlice(params, utxos);
    }

    /**
     * @returns {Promise<NetworkParams>}
     */
    async getParameters() {
        return this.#params;
    }

    /**
     * @param {TxOutputId} id 
     * @returns {Promise<TxInput>}
     */
    async getUtxo(id) {
        for (let utxos of Object.values(this.#utxos)) {
            for (let utxo of utxos) {
                if (utxo.outputId.eq(id)) {
                    return utxo;
                }
            }
        }

        throw new Error(`utxo ${id.toString()} not found`);
    }

    /**
     * @param {Address} addr 
     * @returns {Promise<TxInput[]>}
     */
    async getUtxos(addr) {
        const key = addr.toBech32();

        if (key in this.#utxos) {
            return this.#utxos[key];
        } else {
            return [];
        }
    }

    /**
     * @param {Tx} tx 
     * @returns {Promise<TxId>}
     */
    async submitTx(tx) {
        throw new Error("can't submit tx through network slice");
    }
}