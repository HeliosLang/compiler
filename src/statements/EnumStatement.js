import { $ } from "@helios-lang/ir"
import { expectDefined } from "@helios-lang/type-utils"
import { ToIRContext } from "../codegen/ToIRContext.js"
import { Scope } from "../scopes/index.js"
import {
    GenericParametricType,
    GenericType,
    NamedEntity,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "../typecheck/index.js"
import { EnumMember } from "./EnumMember.js"
import { ImplDefinition } from "./ImplDefinition.js"
import { Statement } from "./Statement.js"
import { TypeParameters } from "./TypeParameters.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @typedef {import("@helios-lang/ir").SourceMappedStringI} SourceMappedStringI
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").EnumMemberType} EnumMemberType
 * @typedef {import("../typecheck/common.js").GenericTypeProps} GenericTypeProps
 * @typedef {import("../typecheck/common.js").Type} Type
 * @typedef {import("../typecheck/common.js").TypeSchema} TypeSchema
 */

/**
 * Enum statement, containing at least one member
 * @internal
 */
export class EnumStatement extends Statement {
    /**
     * @private
     * @readonly
     * @type {TypeParameters}
     */
    _parameters

    /**
     * @private
     * @readonly
     * @type {EnumMember[]}
     */
    _members

    /**
     * @private
     * @readonly
     * @type {ImplDefinition}
     */
    _impl

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {TypeParameters} parameters
     * @param {EnumMember[]} members
     * @param {ImplDefinition} impl
     */
    constructor(site, name, parameters, members, impl) {
        super(site, name)
        this._parameters = parameters
        this._members = members
        this._impl = impl

        this._members.forEach((member, i) => member.registerParent(this))
    }

    /**
     * @type {string}
     */
    get path() {
        return this._parameters.genTypePath(super.path)
    }

    /**
     * @type {Statement[]}
     */
    get statements() {
        return this._impl.statements
    }

    /**
     * @returns {boolean}
     */
    hasParameters() {
        return this._parameters.hasParameters()
    }

    /**
     * @param {string} basePath
     */
    setBasePath(basePath) {
        super.setBasePath(basePath)

        this._impl.setBasePath(this.path)
    }

    /**
     * @param {Scope} scope
     */
    eval(scope) {
        const [type, typeScope] = this._parameters.createParametricType(
            scope,
            this.site,
            (typeScope) => {
                /**
                 * @type {{[name: string]: (parent: DataType) => EnumMemberType}}
                 */
                const genFullMembers = {}

                this._members.forEach((m) => {
                    genFullMembers[m.name.value] = m.evalType(typeScope)
                })

                /**
                 * @type {GenericTypeProps}
                 */
                const props = {
                    name: this.name.value,
                    path: this.path,
                    /**
                     *
                     * @param {Type} self
                     * @param {Set<string>} parents
                     * @returns {TypeSchema}
                     */
                    genTypeSchema: (self, parents) => {
                        if (parents.has(this.path)) {
                            return {
                                kind: "reference",
                                id: this.path
                            }
                        }

                        const parents_ = new Set(
                            Array.from(parents).concat([this.path])
                        )

                        const internalEnumTypeParts = this._members.map(
                            (member) => member.toSchemaInternal(parents_)
                        )

                        return {
                            kind: "enum",
                            name: this.name.value,
                            id: this.path,
                            variantTypes: internalEnumTypeParts
                        }
                    },
                    genInstanceMembers: (self) => ({
                        ...genCommonInstanceMembers(self),
                        ...this._impl.genInstanceMembers(typeScope)
                    }),
                    genTypeMembers: (self) => {
                        const typeMembers_ = {
                            ...genCommonTypeMembers(self),
                            ...this._impl.genTypeMembers(typeScope)
                        }

                        // TODO: detect duplicates
                        for (let memberName in genFullMembers) {
                            typeMembers_[memberName] = genFullMembers[
                                memberName
                            ](expectDefined(self.asDataType))
                        }

                        return typeMembers_
                    }
                }

                if (this._parameters.hasParameters()) {
                    return new GenericParametricType(props)
                } else {
                    return new GenericType(props)
                }
            }
        )

        // don't include type parameters in path (except empty), these are added by application statement
        const path = this._parameters.hasParameters() ? super.path : this.path

        scope.set(this.name, new NamedEntity(this.name.value, path, type))

        this._members.forEach((m) => {
            m.evalDataFields(typeScope)
        })

        typeScope.assertAllUsed()

        this._impl.eval(typeScope)
    }

    /**
     * @returns {SourceMappedStringI}
     */
    toIR_is_valid_data() {
        let ir = $`false`

        this._members.forEach((m) => {
            ir = $`__core__ifThenElse(
				${m.path}__is_valid_data(data),
				() -> {
					true
				},
				() -> {
					${ir}
				}
			)()`
        })

        return $`(data) -> {
			${ir}
		}`
    }

    /**
     * @returns {SourceMappedStringI}
     */
    toIR_show() {
        const name = this.name.value

        const last = this._members[this._members.length - 1]

        let ir = $`${last.path}__show(data)()`

        for (let i = this._members.length - 2; i >= 0; i--) {
            const m = this._members[i]

            ir = $`__core__ifThenElse(
				__core__equalsInteger(index, ${m.constrIndex}),
				() -> {
					${m.path}__show(data)()
				},
				() -> {
					${ir}
				}
			)()`
        }

        return $`(data) -> {
			__core__chooseData(
				data,
				() -> {
					(index) -> {
						${ir}
					}(__core__fstPair(__core__unConstrData__safe(data)))
				},
				() -> {"${name}{<n/a>}"},
				() -> {"${name}{<n/a>}"},
				() -> {"${name}{<n/a>}"},
				() -> {"${name}{<n/a>}"}
			)
		}`
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        map.set(`${this.path}____eq`, {
            content: $(`__helios__common____eq`, this.site)
        })
        map.set(`${this.path}____neq`, {
            content: $(`__helios__common____neq`, this.site)
        })
        map.set(`${this.path}__serialize`, {
            content: $(`__helios__common__serialize`, this.site)
        })
        map.set(`${this.path}____to_data`, {
            content: $(`__helios__common__identity`, this.site)
        })

        map.set(`${this.path}__is_valid_data`, {
            content: this.toIR_is_valid_data()
        })
        map.set(`${this.path}__show`, { content: this.toIR_show() })

        // there could be circular dependencies here, which is ok
        if (!ctx.optimize) {
            map.set(`${this.path}__from_data`, {
                content: $(
                    `(data) -> {
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
			}`,
                    this.site
                )
            })
        } else {
            map.set(`${this.path}__from_data`, {
                content: $(`__helios__common__identity`, this.site)
            })
        }

        map.set(`${this.path}__from_data_safe`, {
            content: $(`__helios__option__SOME_FUNC`, this.site)
        })

        // member __new and copy methods might depend on __to_data, so must be added after
        for (let member of this._members) {
            member.toIR(ctx, map)
        }

        this._impl.toIR(ctx.appendAliasNamespace(this.name.value), map)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `enum ${this.name.toString()}${this._parameters.toString()} {${this._members.map((m) => m.toString()).join(", ")}}`
    }
}
