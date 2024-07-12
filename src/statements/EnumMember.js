import { Word } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { isNone } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/Scope.js"
import {
    GenericEnumMemberType,
    GenericParametricEnumMemberType,
    genCommonEnumTypeMembers,
    genCommonInstanceMembers
} from "../typecheck/index.js"
import { DataField } from "./DataField.js"
import { DataDefinition } from "./DataDefinition.js"

/**
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EnumMemberType} EnumMemberType
 */

/**
 * @typedef {{
 *   name: Word
 *   path: string
 *   hasParameters(): boolean
 * }} EnumStatementI
 */

/**
 * EnumMember defintion is similar to a struct definition
 * @internal
 */
export class EnumMember {
    /**
     * Registered later
     * @type {Option<EnumStatementI>}
     */
    #parent

    /**
     * @type {Option<number>}
     */
    #constrIndex

    #dataDef

    /**
     * @param {Word} name
     * @param {DataField[]} fields
     */
    constructor(name, fields) {
        this.#parent = null // registered later
        this.#constrIndex = null
        this.#dataDef = new DataDefinition(name.site, name, fields)
    }

    /**
     * @returns {number}
     */
    get constrIndex() {
        if (isNone(this.#constrIndex)) {
            throw new Error("constrIndex not set")
        } else {
            return this.#constrIndex
        }
    }

    /**
     * @type {Word}
     */
    get name() {
        return this.#dataDef.name
    }

    /**
     * @param {EnumStatementI} parent
     * @param {number} i
     */
    registerParent(parent, i) {
        this.#parent = parent
        this.#constrIndex = i
    }

    /**
     * @type {EnumStatementI}
     */
    get parent() {
        if (!this.#parent) {
            throw new Error("parent not yet registered")
        } else {
            return this.#parent
        }
    }

    /**
     * @type {DataDefinition}
     */
    get dataDefinition() {
        return this.#dataDef
    }

    /**
     * @param {Scope} scope
     */
    evalDataFields(scope) {
        this.#dataDef.evalFieldTypes(scope)
    }

    /**
     * @param {Scope} scope
     * @returns {(parent: DataType) => EnumMemberType}
     */
    evalType(scope) {
        if (this.#parent === null) {
            throw new Error("parent should've been registered")
        }

        return (parent) => {
            const path = `${parent.path}__${this.#dataDef.name.value}`

            const props = {
                name: this.#dataDef.name.value,
                path: path,
                constrIndex: this.constrIndex,
                parentType: parent,
                fieldNames: this.#dataDef.fieldNames,
                genInstanceMembers: (self) => {
                    const res = {
                        ...genCommonInstanceMembers(self),
                        ...this.#dataDef.evalFieldTypes(scope),
                        copy: this.#dataDef.genCopyType(self)
                    }

                    return res
                },
                genTypeMembers: (self) => ({
                    ...genCommonEnumTypeMembers(self, parent)
                })
            }

            if (this.parent.hasParameters()) {
                return new GenericParametricEnumMemberType(props)
            } else {
                return new GenericEnumMemberType(props)
            }
        }
    }

    get path() {
        return `${this.parent.path}__${this.#dataDef.name.toString()}`
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        map.set(
            `${this.path}____eq`,
            $(`__helios__common____eq`, this.#dataDef.site)
        )
        map.set(
            `${this.path}____neq`,
            $(`__helios__common____neq`, this.#dataDef.site)
        )
        map.set(
            `${this.path}__serialize`,
            $(`__helios__common__serialize`, this.#dataDef.site)
        )

        map.set(
            `${this.path}__is_valid_data`,
            $`(data) -> {
			__core__chooseData(
				data,
				() -> {
					(pair) -> {
						__core__ifThenElse(
							__core__equalsInteger(__core__fstPair(pair), ${this.constrIndex}),
							() -> {
								${this.#dataDef.toIR_is_valid_data()}(__core__listData(__core__sndPair(pair)))
							},
							() -> {
								false
							}
						)()
					}(__core__unConstrData__safe(data))
				},
				() -> {false},
				() -> {false},
				() -> {false},
				() -> {false}
			)()
		}`
        )

        if (!ctx.simplify) {
            map.set(
                `${this.path}__from_data`,
                $`(data) -> {
				(ignore) -> {
					data
				}(
					__core__ifThenElse(
						${this.path}__is_valid_data(data),
						() -> {
							()
						},
						() -> {
							__core__trace("Warning: invalid ${this.name.toString()} data", ())
						}
					)()
				)
			}`
            )
        } else {
            map.set(
                `${this.path}__from_data`,
                $(
                    `(data) -> {
				__helios__common__assert_constr_index(data, ${this.constrIndex})
			}`,
                    this.#dataDef.site
                )
            )
        }

        map.set(
            `${this.path}__from_data_safe`,
            $`(data) -> {
			__core__chooseData(
				data,
				() -> {
					(index) -> {
						__core__ifThenElse(
							__core__equalsInteger(index, ${this.constrIndex}),
							() -> {
								__helios__option__SOME_FUNC(data)
							},
							() -> {
								__helios__option__NONE_FUNC
							}
						)()
					}(__core__fstPair(__core__unConstrData__safe(data)))
				},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC},
				() -> {__helios__option__NONE_FUNC}
			)()
		}`
        )

        map.set(
            `${this.path}____to_data`,
            $("__helios__common__identity", this.#dataDef.site)
        )

        // super.toIR adds __new and copy, which might depend on __to_data, so must come after
        this.#dataDef.toIR(ctx, this.path, map, this.constrIndex)

        const longName =
            (this.#parent?.name?.value ?? "") + "::" + this.name.value
        map.set(
            `${this.path}__show`,
            $`(data) -> {
			__core__chooseData(
				data,
				() -> {
					(fields) -> {
						${this.#dataDef.toIR_show(longName, true)}(fields)()
					}(__core__sndPair(__core__unConstrData__safe(data)))
				},
				() -> {"${longName}{<n/a>}"},
				() -> {"${longName}{<n/a>}"},
				() -> {"${longName}{<n/a>}"},
				() -> {"${longName}{<n/a>}"}
			)
		}`
        )
    }
}
