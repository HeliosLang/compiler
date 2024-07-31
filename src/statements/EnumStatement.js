import { Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
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
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
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
    #parameters
    #members
    #impl

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {TypeParameters} parameters
     * @param {EnumMember[]} members
     * @param {ImplDefinition} impl
     */
    constructor(site, name, parameters, members, impl) {
        super(site, name)
        this.#parameters = parameters
        this.#members = members
        this.#impl = impl

        for (let i = 0; i < this.#members.length; i++) {
            this.#members[i].registerParent(this, i)
        }
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#parameters.genTypePath(super.path)
    }

    /**
     * @type {Statement[]}
     */
    get statements() {
        return this.#impl.statements
    }

    /**
     * @returns {boolean}
     */
    hasParameters() {
        return this.#parameters.hasParameters()
    }

    /**
     * @param {string} basePath
     */
    setBasePath(basePath) {
        super.setBasePath(basePath)

        this.#impl.setBasePath(this.path)
    }

    /**
     * Returns index of enum member.
     * Returns -1 if not found
     * @param {Word} name
     * @returns {number}
     */
    // returns an index
    findEnumMember(name) {
        let found = -1
        let i = 0
        for (let member of this.#members) {
            if (member.name.toString() == name.toString()) {
                found = i
                break
            }
            i++
        }

        return found
    }

    /**
     * @param {number} i
     * @returns {EnumMember}
     */
    getEnumMember(i) {
        return expectSome(this.#members[i])
    }

    /**
     * @param {Word} name
     * @returns {boolean}
     */
    hasEnumMember(name) {
        return this.findEnumMember(name) != -1
    }

    /**
     * @returns {number}
     */
    get nEnumMembers() {
        return this.#members.length
    }

    /**
     * @param {Scope} scope
     */
    eval(scope) {
        const [type, typeScope] = this.#parameters.createParametricType(
            scope,
            this.site,
            (typeScope) => {
                /**
                 * @type {{[name: string]: (parent: DataType) => EnumMemberType}}
                 */
                const genFullMembers = {}

                this.#members.forEach((m) => {
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

                        const internalEnumTypeParts = this.#members.map(
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
                        ...this.#impl.genInstanceMembers(typeScope)
                    }),
                    genTypeMembers: (self) => {
                        const typeMembers_ = {
                            ...genCommonTypeMembers(self),
                            ...this.#impl.genTypeMembers(typeScope)
                        }

                        // TODO: detect duplicates
                        for (let memberName in genFullMembers) {
                            typeMembers_[memberName] = genFullMembers[
                                memberName
                            ](expectSome(self.asDataType))
                        }

                        return typeMembers_
                    }
                }

                if (this.#parameters.hasParameters()) {
                    return new GenericParametricType(props)
                } else {
                    return new GenericType(props)
                }
            }
        )

        // don't include type parameters in path (except empty), these are added by application statement
        const path = this.#parameters.hasParameters() ? super.path : this.path

        scope.set(this.name, new NamedEntity(this.name.value, path, type))

        this.#members.forEach((m) => {
            m.evalDataFields(typeScope)
        })

        typeScope.assertAllUsed()

        this.#impl.eval(typeScope)
    }

    /**
     * @returns {SourceMappedString}
     */
    toIR_is_valid_data() {
        let ir = $`false`

        this.#members.forEach((m) => {
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
     * @returns {SourceMappedString}
     */
    toIR_show() {
        const name = this.name.value

        const last = this.#members[this.#members.length - 1]

        let ir = $`${last.path}__show(data)()`

        for (let i = this.#members.length - 2; i >= 0; i--) {
            const m = this.#members[i]

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
        map.set(`${this.path}____eq`, $(`__helios__common____eq`, this.site))
        map.set(`${this.path}____neq`, $(`__helios__common____neq`, this.site))
        map.set(
            `${this.path}__serialize`,
            $(`__helios__common__serialize`, this.site)
        )
        map.set(
            `${this.path}____to_data`,
            $(`__helios__common__identity`, this.site)
        )

        map.set(`${this.path}__is_valid_data`, this.toIR_is_valid_data())
        map.set(`${this.path}__show`, this.toIR_show())

        // there could be circular dependencies here, which is ok
        if (!ctx.simplify) {
            map.set(
                `${this.path}__from_data`,
                $(
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
            )
        } else {
            map.set(
                `${this.path}__from_data`,
                $(`__helios__common__identity`, this.site)
            )
        }

        map.set(
            `${this.path}__from_data_safe`,
            $(`__helios__option__SOME_FUNC`, this.site)
        )

        // member __new and copy methods might depend on __to_data, so must be added after
        for (let member of this.#members) {
            member.toIR(ctx, map)
        }

        this.#impl.toIR(ctx, map)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `enum ${this.name.toString()}${this.#parameters.toString()} {${this.#members.map((m) => m.toString()).join(", ")}}`
    }
}
