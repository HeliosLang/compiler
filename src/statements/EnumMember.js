import { $ } from "@helios-lang/ir"
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
 * @import { Word } from "@helios-lang/compiler-utils"
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EnumMemberType} EnumMemberType
 * @typedef {import("../typecheck/common.js").GenericEnumMemberTypeProps} GenericEnumMemberTypeProps
 * @typedef {import("../typecheck/index.js").TypeSchema} TypeSchema
 * @typedef {import("../typecheck/index.js").VariantTypeSchema} VariantTypeSchema
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
     * @private
     * @type {EnumStatementI | undefined}
     */
    _parent

    /**
     * @readonly
     * @type {number}
     */
    constrIndex

    /**
     * @private
     * @readonly
     * @type {DataDefinition}
     */
    _dataDef

    /**
     * @param {number} constrIndex
     * @param {Word} name
     * @param {DataField[]} fields
     */
    constructor(constrIndex, name, fields) {
        this._parent = undefined // registered later
        this.constrIndex = constrIndex
        this._dataDef = new DataDefinition(name.site, name, fields)
    }

    /**
     * @type {Word}
     */
    get name() {
        return this._dataDef.name
    }

    /**
     * @param {EnumStatementI} parent
     */
    registerParent(parent) {
        this._parent = parent
    }

    /**
     * @type {EnumStatementI}
     */
    get parent() {
        if (!this._parent) {
            throw new Error("parent not yet registered")
        } else {
            return this._parent
        }
    }

    /**
     * @type {DataDefinition}
     */
    get dataDefinition() {
        return this._dataDef
    }

    /**
     * @param {Scope} scope
     */
    evalDataFields(scope) {
        this._dataDef.evalFieldTypes(scope)
    }

    /**
     * @param {Scope} scope
     * @returns {(parent: DataType) => EnumMemberType}
     */
    evalType(scope) {
        if (!this._parent) {
            throw new Error("parent should've been registered")
        }

        return (parent) => {
            const path = `${parent.path}__${this._dataDef.name.value}`

            /**
             * @type {GenericEnumMemberTypeProps}
             */
            const props = {
                name: this._dataDef.name.value,
                path: path,
                constrIndex: this.constrIndex,
                parentType: parent,
                fieldNames: this._dataDef.fieldNames,
                genTypeSchema: (self, parents) => {
                    return this.toSchema(parents)
                },
                genInstanceMembers: (self) => {
                    const res = {
                        ...genCommonInstanceMembers(self),
                        ...this._dataDef.evalFieldTypes(scope),
                        copy: this._dataDef.genCopyType(self)
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
        return `${this.parent.path}__${this._dataDef.name.toString()}`
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        map.set(`${this.path}____eq`, {
            content: $(`__helios__common____eq`, this._dataDef.site)
        })
        map.set(`${this.path}____neq`, {
            content: $(`__helios__common____neq`, this._dataDef.site)
        })
        map.set(`${this.path}__serialize`, {
            content: $(`__helios__common__serialize`, this._dataDef.site)
        })
        map.set(`${this.path}____is`, {
            content: $`(data) -> {
                __helios__common__enum_tag_equals(data, ${this.constrIndex})
            }`
        })

        map.set(`${this.path}__is_valid_data`, {
            content: $`(data) -> {
			__core__chooseData(
				data,
				() -> {
					(pair) -> {
						__core__ifThenElse(
							__core__equalsInteger(__core__fstPair(pair), ${this.constrIndex}),
							() -> {
								${this._dataDef.toIR_is_valid_data(true)}(__core__listData(__core__sndPair(pair)))
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
        })

        if (!ctx.optimize) {
            map.set(`${this.path}__from_data`, {
                content: $`(data) -> {
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
            })
        } else {
            map.set(`${this.path}__from_data`, {
                content: $(
                    `(data) -> {
				__helios__common__assert_constr_index(data, ${this.constrIndex})
			}`,
                    this._dataDef.site
                )
            })
        }

        map.set(`${this.path}__from_data_safe`, {
            content: $`(data) -> {
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
        })

        map.set(`${this.path}____to_data`, {
            content: $("__helios__common__identity", this._dataDef.site)
        })

        // super.toIR adds __new and copy, which might depend on __to_data, so must come after
        this._dataDef.toIR(ctx, this.path, map, this.constrIndex)

        const longName =
            (this._parent?.name?.value ?? "") + "::" + this.name.value
        map.set(`${this.path}__show`, {
            content: $`(data) -> {
			__core__chooseData(
				data,
				() -> {
					(fields) -> {
						${this._dataDef.toIR_show(longName, true)}(fields)()
					}(__core__sndPair(__core__unConstrData__safe(data)))
				},
				() -> {"${longName}{<n/a>}"},
				() -> {"${longName}{<n/a>}"},
				() -> {"${longName}{<n/a>}"},
				() -> {"${longName}{<n/a>}"}
			)
		}`
        })
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.constrIndex.toString}: ${this._dataDef.toString()}`
    }

    /**
     * @param {Set<string>} parents
     * @returns {VariantTypeSchema}
     */
    toSchemaInternal(parents) {
        const fieldTypes = this._dataDef.fieldsToSchema(parents)

        return {
            kind: "variant",
            tag: this.constrIndex,
            id: this.path,
            name: this.name.value,
            fieldTypes: fieldTypes
        }
    }

    /**
     * @param {Set<string>} parents
     * @returns {TypeSchema}
     */
    toSchema(parents) {
        if (parents.has(this.path)) {
            return {
                kind: "reference",
                id: this.path
            }
        } else {
            const parents_ = new Set(Array.from(parents).concat([this.path]))

            const fieldTypes = this._dataDef.fieldsToSchema(parents_)

            return {
                kind: "variant",
                tag: this.constrIndex,
                id: this.path,
                name: this.name.value,
                fieldTypes: fieldTypes
            }
        }
    }
}
