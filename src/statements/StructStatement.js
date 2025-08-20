import { $ } from "@helios-lang/ir"
import { ToIRContext } from "../codegen/index.js"
import { TopScope } from "../scopes/index.js"
import {
    GenericParametricType,
    GenericType,
    NamedEntity,
    genCommonInstanceMembers,
    genCommonTypeMembers
} from "../typecheck/index.js"
import { DataDefinition } from "./DataDefinition.js"
import { DataField } from "./DataField.js"
import { Statement } from "./Statement.js"
import { TypeParameters } from "./TypeParameters.js"
import { ImplDefinition } from "./ImplDefinition.js"

/**
 * @import { Site, Word } from "@helios-lang/compiler-utils"
 * @import { Definitions, TypeCheckContext } from "../index.js"
 * @typedef {import("../typecheck/index.js").GenericTypeProps} GenericTypeProps
 * @typedef {import("../typecheck/index.js").Type} Type
 * @typedef {import("../typecheck/index.js").TypeSchema} TypeSchema
 * @typedef {import("../typecheck/index.js").StructTypeSchema} StructTypeSchema
 */

/**
 * Struct statement
 */
export class StructStatement extends Statement {
    /**
     * @private
     * @readonly
     * @type {TypeParameters}
     */
    _parameters

    /**
     * @private
     * @readonly
     * @type {DataDefinition}
     */
    _dataDef

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
     * @param {DataField[]} fields
     * @param {ImplDefinition} impl
     */
    constructor(site, name, parameters, fields, impl) {
        super(site, name)

        this._parameters = parameters
        this._dataDef = new DataDefinition(this.site, name, fields)
        this._impl = impl
    }

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
     * @param {string} basePath
     */
    setBasePath(basePath) {
        super.setBasePath(basePath)

        this._impl.setBasePath(this.path)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `struct ${this.name.toString()}${this._parameters.toString()} ${this._dataDef.toStringFields()}`
    }

    /**
     * Evaluates own type and adds to scope
     * @param {TypeCheckContext} ctx
     * @param {TopScope} scope
     */
    eval(ctx, scope) {
        const [type, typeScope] = this._parameters.createParametricType(
            ctx,
            scope,
            this.site,
            (typeScope) => {
                /**
                 * @type {GenericTypeProps}
                 */
                const props = {
                    fieldNames: this._dataDef.fieldNames,
                    name: this.name.value,
                    path: this.path, // includes template parameters
                    /**
                     * @param {Type} self
                     * @param {Set<string>} parents
                     * @returns {StructTypeSchema}
                     */
                    genTypeSchema: (self, parents) => {
                        const internalTypeFields =
                            this._dataDef.fieldsToSchema(parents)

                        return /* @type {StructTypeSchema} */ {
                            kind: "struct",
                            format: this._dataDef.isMappedStruct()
                                ? "map"
                                : this._dataDef.nFields == 1
                                  ? "singleton"
                                  : "list",
                            id: this.path,
                            name: this.name.value,
                            fieldTypes: internalTypeFields
                        }
                    },
                    genInstanceMembers: (self) => ({
                        ...genCommonInstanceMembers(self),
                        ...this._dataDef.evalFieldTypes(ctx, typeScope),
                        ...this._impl.genInstanceMembers(typeScope),
                        copy: this._dataDef.genCopyType(self)
                    }),
                    genTypeMembers: (self) => ({
                        ...genCommonTypeMembers(self),
                        ...this._impl.genTypeMembers(ctx, typeScope)
                    })
                }

                if (this._parameters.hasParameters()) {
                    return new GenericParametricType(props)
                } else {
                    return new GenericType(props)
                }
            }
        )

        const path = this._parameters.hasParameters() ? super.path : this.path

        scope.set(this.name, new NamedEntity(this.name.value, path, type))

        void this._dataDef.evalFieldTypes(ctx, typeScope)

        typeScope.assertAllUsed()

        this._impl.eval(ctx, typeScope)
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_mStructEq(ctx, map) {
        const ir = this._dataDef.toIR_mStructEq(this.site)

        map.set(`${this.path}____eq`, { content: ir })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_mStructNeq(ctx, map) {
        // simple negation of __eq
        map.set(`${this.path}____neq`, {
            content: $`(a, b) -> {
					__core__ifThenElse(
						${this.path}____eq(a, b), 
						()->{false}, 
						()->{true}
					)()
			}`
        })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_mStruct(ctx, map) {
        this.toIR_mStructEq(ctx, map)
        this.toIR_mStructNeq(ctx, map)

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

        map.set(`${this.path}__from_data_safe`, {
            content: $(
                `(data) -> {
                __core__ifThenElse(
                    ${this.path}__is_valid_data(data),
                    () -> { __helios__option__SOME_FUNC(data) },
                    () -> { __helios__option__NONE_FUNC }
                )()
            }`,
                this.site
            )
        })
    }

    /**
     * @param {ToIRContext} ctx
     * @param {Definitions} map
     */
    toIR_fStruct(ctx, map) {
        const implPath =
            this._dataDef.nFields == 1
                ? this._dataDef.getFieldType(0).path
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
        if (this._dataDef.fieldNames.length == 1 || !!ctx.optimize) {
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
        if (this._dataDef.fieldNames.length == 1) {
            map.set(`${this.path}__from_data_safe`, {
                content: $(
                    `${this._dataDef.getFieldType(0).path}__from_data_safe`,
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
            content: this._dataDef.toIR_is_valid_data()
        })

        if (this._dataDef.isMappedStruct()) {
            this.toIR_mStruct(ctx, map)
        } else {
            this.toIR_fStruct(ctx, map)
        }

        // super.toIR adds __new and copy, which might depend on __to_data, so must come after
        this._dataDef.toIR(ctx, this.path, map, -1)
        map.set(`${this.path}__show`, {
            content: this._dataDef.toIR_show(this.name.value)
        })

        this._impl.toIR(ctx.appendAliasNamespace(this.name.value), map)
    }
}
