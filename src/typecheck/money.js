import { expectSome } from "@helios-lang/type-utils"
import { DataEntity, FuncType, GenericType } from "./common.js"
import { ListType$, MapType$ } from "./containers.js"
import { MintingPolicyHashType } from "./hashes.js"
import { Parameter } from "./Parameter.js"
import { ParametricFunc } from "./ParametricFunc.js"
import { DefaultTypeClass } from "./parametric.js"
import { FTPP } from "../codegen/ParametricName.js"
import {
    BoolType,
    ByteArrayType,
    IntType,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "./primitives.js"

/**
 * @typedef {import("./common.js").DataType} DataType
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").TypeClass} TypeClass
 * @typedef {import("./common.js").TypeClassMembers} TypeClassMembers
 */

/**
 * Builtin AssetClass type
 * @type {DataType}
 */
export const AssetClassType = new GenericType({
    name: "AssetClass",
    genTypeDetails: (self) => ({
        inputType:
            "string | {mph: number[] | string | helios.MintingPolicyHash, tokenName: number[] | string} | helios.AssetClass",
        outputType: "helios.AssetClass",
        internalType: {
            type: "AssetClass"
        }
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        mph: MintingPolicyHashType,
        token_name: ByteArrayType
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(expectSome(self.asDataType))

        return {
            ...genCommonTypeMembers(self),
            ADA: selfInstance,
            new: new FuncType([MintingPolicyHashType, ByteArrayType], self),
            __geq: new FuncType([self, self], BoolType),
            __gt: new FuncType([self, self], BoolType),
            __leq: new FuncType([self, self], BoolType),
            __lt: new FuncType([self, self], BoolType)
        }
    }
})

/**
 * Builtin money Value type
 * @internal
 * @type {DataType}
 */
export const ValueType = new GenericType({
    name: "Value",
    genTypeDetails: (self) => ({
        inputType: `number | bigint | {lovelace?: number | bigint, assets: [string, number | bigint][] | [number[] | string | helios.MintingPolicyHash, [number[] | string, number | bigint][]][] | helios.Assets} | helios.Value`,
        outputType: `helios.Value`,
        internalType: {
            type: "Value"
        }
    }),
    genInstanceMembers: (self) => ({
        ...genCommonInstanceMembers(self),
        contains: new FuncType([self], BoolType),
        contains_policy: new FuncType([MintingPolicyHashType], BoolType),
        get: new FuncType([AssetClassType], IntType),
        get_assets: new FuncType([], ValueType),
        get_lovelace: new FuncType([], IntType),
        get_policy: new FuncType(
            [MintingPolicyHashType],
            MapType$(ByteArrayType, IntType)
        ),
        get_safe: new FuncType([AssetClassType], IntType),
        is_zero: new FuncType([], BoolType),
        to_map: new FuncType(
            [],
            MapType$(MintingPolicyHashType, MapType$(ByteArrayType, IntType))
        ),
        value: self // so that Value implements Valuable itself as well
    }),
    genTypeMembers: (self) => {
        const selfInstance = new DataEntity(expectSome(self.asDataType))

        return {
            ...genCommonTypeMembers(self),
            __add: new FuncType([self, self], self),
            __div: new FuncType([self, IntType], ValueType),
            __geq: new FuncType([self, ValueType], BoolType),
            __gt: new FuncType([self, ValueType], BoolType),
            __leq: new FuncType([self, ValueType], BoolType),
            __lt: new FuncType([self, ValueType], BoolType),
            __mul: new FuncType([self, IntType], ValueType),
            __sub: new FuncType([self, self], self),
            from_map: new FuncType(
                [
                    MapType$(
                        MintingPolicyHashType,
                        MapType$(ByteArrayType, IntType)
                    )
                ],
                self
            ),
            lovelace: new FuncType([IntType], self),
            new: new FuncType([AssetClassType, IntType], self),
            sum: (() => {
                const a = new Parameter(
                    "a",
                    `${FTPP}0`,
                    new ValuableTypeClass()
                )
                return new ParametricFunc(
                    [a],
                    new FuncType([ListType$(a.ref)], self)
                )
            })(),
            ZERO: selfInstance
        }
    }
})

/**
 * @implements {TypeClass}
 */
export class ValuableTypeClass extends DefaultTypeClass {
    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genTypeMembers(impl) {
        return {
            ...super.genTypeMembers(impl)
        }
    }

    /**
     * @param {Type} impl
     * @returns {TypeClassMembers}
     */
    genInstanceMembers(impl) {
        return {
            ...super.genInstanceMembers(impl),
            value: ValueType
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return "Valuable"
    }
}
