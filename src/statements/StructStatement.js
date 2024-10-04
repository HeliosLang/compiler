import { Word } from "@helios-lang/compiler-utils"
import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { TopScope } from "../scopes/index.js"
import {
    BoolType,
    FuncType,
    GenericParametricType,
    GenericType,
    NamedEntity,
    RawDataType,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "../typecheck/index.js"
import { DataDefinition } from "./DataDefinition.js"
import { DataField } from "./DataField.js"
import { Statement } from "./Statement.js"
import { TypeParameters } from "./TypeParameters.js"
import { ImplDefinition } from "./ImplDefinition.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../codegen/index.js").Definitions} Definitions
 * @typedef {import("../typecheck/index.js").GenericTypeProps} GenericTypeProps
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").TypeSchema} TypeSchema
 */

/**
 * Struct statement
 */
export class StructStatement extends Statement {
    /**
     * @readonly
     * @type {TypeParameters}
     */
    #parameters

    /**
     * @readonly
     * @type {DataDefinition}
     */
    #dataDef

    /**
     * @readonly
     * @type {ImplDefinition}
     */
    #impl

    /**
     * @param {Site} site
     * @param {Word} name
     * @param {TypeParameters} parameters
     * @param {DataField[]} fields
     * @param {ImplDefinition} impl
     */
    constructor(site, name, parameters, fields, impl) {
        super(site, name)

        this.#parameters = parameters
        this.#dataDef = new DataDefinition(this.site, name, fields)
        this.#impl = impl
    }

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
     * @param {string} basePath
     */
    setBasePath(basePath) {
        super.setBasePath(basePath)

        this.#impl.setBasePath(this.path)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `struct ${this.name.toString()}${this.#parameters.toString()} ${this.#dataDef.toStringFields()}`
    }

    /**
     * Evaluates own type and adds to scope
     * @param {TopScope} scope
     */
    eval(scope) {
        const [type, typeScope] = this.#parameters.createParametricType(
            scope,
            this.site,
            (typeScope) => {
                /**
                 * @type {GenericTypeProps}
                 */
                const props = {
                    fieldNames: this.#dataDef.fieldNames,
                    name: this.name.value,
                    path: this.path, // includes template parameters
                    /**
                     * @param {Type} self
                     * @param {Set<string>} parents
                     * @returns {TypeSchema}
                     */
                    genTypeSchema: (self, parents) => {
                        const internalTypeFields =
                            this.#dataDef.fieldsToSchema(parents)

                        return {
                            kind: "struct",
                            format: this.#dataDef.hasTags()
                                ? "map"
                                : this.#dataDef.nFields == 1
                                  ? "singleton"
                                  : "list",
                            id: this.path,
                            name: this.name.value,
                            fieldTypes: internalTypeFields
                        }
                    },
                    genInstanceMembers: (self) => ({
                        ...genCommonInstanceMembers(self),
                        ...this.#dataDef.evalFieldTypes(typeScope),
                        ...this.#impl.genInstanceMembers(typeScope),
                        copy: this.#dataDef.genCopyType(self)
                    }),
                    genTypeMembers: (self) => ({
                        ...genCommonTypeMembers(self),
                        ...this.#impl.genTypeMembers(typeScope)
                    })
                }

                if (this.#parameters.hasParameters()) {
                    return new GenericParametricType(props)
                } else {
                    return new GenericType(props)
                }
            }
        )

        const path = this.#parameters.hasParameters() ? super.path : this.path

        scope.set(this.name, new NamedEntity(this.name.value, path, type))

        void this.#dataDef.evalFieldTypes(typeScope)

        typeScope.assertAllUsed()

        this.#impl.eval(typeScope)
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_withTagsEq(ctx, map) {
        const ir = this.#dataDef.toIR_withTagsEq(this.site)

        map.set(`${this.path}____eq`, { content: ir })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_withTagsNeq(ctx, map) {
        const ir = this.#dataDef.toIR_withTagsNeq(this.site)

        map.set(`${this.path}____neq`, { content: ir })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_withTags(ctx, map) {
        this.toIR_withTagsEq(ctx, map)
        this.toIR_withTagsNeq(ctx, map)

        map.set(`${this.path}__serialize`, {
            content: $(`__helios__common__serialize`, this.site)
        })
        map.set(`${this.path}____to_data`, {
            content: $(`__helios__common__identity`, this.site)
        })

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

        // TODO: this is wrong
        map.set(`${this.path}__from_data_safe`, {
            content: $(`__helios__option__SOME_FUNC`, this.site)
        })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_withoutTags(ctx, map) {
        const implPath =
            this.#dataDef.nFields == 1
                ? this.#dataDef.getFieldType(0).path
                : "__helios__struct"

        map.set(`${this.path}____eq`, {
            content: $(`${implPath}____eq`, this.site)
        })
        map.set(`${this.path}____neq`, {
            content: $(`${implPath}____neq`, this.site)
        })
        map.set(`${this.path}__serialize`, {
            content: $(`${implPath}__serialize`, this.site)
        })

        // the from_data method can include field checks
        if (this.#dataDef.fieldNames.length == 1 || !!ctx.optimize) {
            map.set(`${this.path}__from_data`, {
                content: $(`${implPath}__from_data`, this.site)
            })
        } else {
            map.set(`${this.path}__from_data`, {
                content: $(
                    `(data) -> {
                (ignore) -> {
                    __core__unListData(data)
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
        }
        if (this.#dataDef.fieldNames.length == 1) {
            map.set(`${this.path}__from_data_safe`, {
                content: $(
                    `${this.#dataDef.getFieldType(0).path}__from_data_safe`,
                    this.site
                )
            })
        } else {
            map.set(`${this.path}__from_data_safe`, {
                content: $`(data) -> {
                __core__chooseData(
                    data,
                    () -> {__helios__option__NONE_FUNC},
                    () -> {__helios__option__NONE_FUNC},
                    () -> {
                        __helios__option__SOME_FUNC(__core__unListData__safe(data))
                    },
                    () -> {__helios__option__NONE_FUNC},
                    () -> {__helios__option__NONE_FUNC}
                )()
            }`
            })
        }

        map.set(`${this.path}____to_data`, {
            content: $(`${implPath}____to_data`, this.site)
        })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR(ctx, map) {
        map.set(`${this.path}__is_valid_data`, {
            content: this.#dataDef.toIR_is_valid_data()
        })

        if (this.#dataDef.hasTags()) {
            this.toIR_withTags(ctx, map)
        } else {
            this.toIR_withoutTags(ctx, map)
        }

        // super.toIR adds __new and copy, which might depend on __to_data, so must come after
        this.#dataDef.toIR(ctx, this.path, map, -1)
        map.set(`${this.path}__show`, {
            content: this.#dataDef.toIR_show(this.name.value)
        })

        this.#impl.toIR(ctx.appendAliasNamespace(this.name.value), map)
    }
}
