import { CompilerError, Word } from "@helios-lang/compiler-utils"
import { $, SourceMappedString } from "@helios-lang/ir"
import { None, expectSome, isSome } from "@helios-lang/type-utils"
import { TAB, ToIRContext } from "../codegen/index.js"
import { Scope } from "../scopes/index.js"
import {
    AllType,
    AnyType,
    DataEntity,
    TupleType$,
    getTupleItemTypes
} from "../typecheck/index.js"
import { Expr } from "./Expr.js"

/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 * @typedef {import("../typecheck/index.js").DataType} DataType
 * @typedef {import("../typecheck/index.js").Type} Type
 */

/**
 * DestructExpr is for the lhs-side of assignments and for switch cases
 * `NameExpr [':' TypeExpr ['{' ... '}']]` or
 * `TypeExpr '{' ... '}'` or
 * `[NameExpr ':'] '(' ... ')'
 */
export class DestructExpr {
    /**
     * @readonly
     * @type {Word}
     */
    name

    /**
     * @readonly
     * @type {Option<Expr>}
     */
    typeExpr

    /**
     * @readonly
     * @type {DestructExpr[]}
     */
    destructExprs

    /**
     * @type {boolean}
     */
    #isTuple

    /**
     * @param {Word} name - use an underscore as a sink
     * @param {Option<Expr>} typeExpr
     * @param {DestructExpr[]} destructExprs
     * @param {boolean} isTuple typeExpr must be `null` if isTuple is `true` and `destructExpr.length` must be `> 0`
     */
    constructor(name, typeExpr = None, destructExprs = [], isTuple = false) {
        this.name = name
        this.typeExpr = typeExpr
        this.destructExprs = destructExprs
        this.#isTuple = isTuple

        if (isTuple) {
            if (!(this.destructExprs.length > 0 && !this.typeExpr)) {
                throw new Error("unexpected")
            }
        } else {
            if (!this.typeExpr && this.destructExprs.length > 0) {
                throw new Error(`unexpected syntax: ${this.toString()}`)
            }
        }
    }

    /**
     * @type {Site}
     */
    get site() {
        return this.name.site
    }

    /**
     * @type {DestructExpr[]}
     */
    get children() {
        return this.destructExprs
    }

    /**
     * @returns {boolean}
     */
    isTuple() {
        return this.#isTuple
    }

    /**
     * @returns {boolean}
     */
    hasDestructExprs() {
        return this.destructExprs.length > 0
    }

    /**
     * @returns {boolean}
     */
    isIgnored() {
        return this.name.value === "_"
    }

    /**
     * @returns {boolean}
     */
    hasType() {
        return isSome(this.typeExpr)
    }

    /**
     * Throws an error if called before evalType()
     * @type {Type}
     */
    get type() {
        if (!this.typeExpr) {
            if (this.#isTuple) {
                const nestedTypes = this.destructExprs.map((e) => e.type)

                if (!nestedTypes) {
                    throw CompilerError.type(
                        this.site,
                        `invalid nested tuple in in destruct expression`
                    )
                }

                return TupleType$(nestedTypes)
            } else if (this.isIgnored()) {
                return new AllType()
            } else {
                return new AnyType()
            }
        } else {
            if (!this.typeExpr.cache?.asType) {
                throw CompilerError.type(
                    this.typeExpr.site,
                    `invalid type '${expectSome(this.typeExpr.cache, "cache unset").toString()}'`
                )
            } else {
                return this.typeExpr.cache.asType
            }
        }
    }

    /**
     * @type {Word}
     */
    get typeName() {
        if (!this.typeExpr) {
            return new Word("", this.site)
        } else {
            return new Word(this.typeExpr.toString(), this.typeExpr.site)
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        if (!this.typeExpr) {
            if (this.destructExprs.length > 0 && this.#isTuple) {
                return `${this.name.toString()}: (${this.destructExprs.map((de) => de.toString()).join(", ")})`
            } else {
                return this.name.toString()
            }
        } else {
            let destructStr = ""

            if (this.destructExprs.length > 0) {
                destructStr = `{${this.destructExprs.map((de) => de.toString()).join(", ")}}`
            }

            if (this.isIgnored()) {
                return `${this.typeExpr.toString()}${destructStr}`
            } else {
                return `${this.name.toString()}: ${this.typeExpr.toString()}${destructStr}`
            }
        }
    }

    /**
     * Evaluates the type, used by FuncLiteralExpr and DataDefinition
     * @param {Scope} scope
     * @param {null | Type} upstreamType
     * @returns {null | Type}
     */
    evalType(scope, upstreamType = null) {
        if (!this.typeExpr) {
            if (this.#isTuple) {
                const upstreamItemTypes = upstreamType
                    ? getTupleItemTypes(upstreamType)
                    : null
                const nestedTypes = this.destructExprs.map((e, i) => {
                    const de = e.evalType(
                        scope,
                        upstreamItemTypes ? upstreamItemTypes[i] : null
                    )

                    if (!de) {
                        throw CompilerError.type(
                            this.site,
                            `invalid nested tuple in in destruct expression`
                        )
                    }
                    return de
                })

                return TupleType$(nestedTypes)
            } else if (this.isIgnored()) {
                return new AllType()
            } else {
                throw new Error("typeExpr not set")
            }
        } else {
            const t = this.typeExpr.evalAsType(scope)

            if (
                t &&
                upstreamType &&
                !upstreamType.asEnumMemberType &&
                t.asEnumMemberType
            ) {
                return t.asEnumMemberType.parentType
            } else {
                return t
            }
        }
    }

    /**
     * @param {Scope} scope
     * @param {Type} upstreamType
     */
    evalDestructExprs(scope, upstreamType) {
        if (this.destructExprs.length > 0) {
            if (this.#isTuple) {
                const tupleItemTypes = getTupleItemTypes(upstreamType)

                if (!tupleItemTypes) {
                    throw CompilerError.type(
                        this.site,
                        "upstream value isn't a tuple, can't destruct"
                    )
                }

                if (tupleItemTypes.length != this.destructExprs.length) {
                    throw CompilerError.type(
                        this.site,
                        `wrong number of destruct tuple fields, expected ${tupleItemTypes.length}, got ${this.destructExprs.length}`
                    )
                }

                for (let i = 0; i < this.destructExprs.length; i++) {
                    this.destructExprs[i].evalInternal(
                        scope,
                        tupleItemTypes[i],
                        i
                    )
                }
            } else {
                if (!upstreamType.asDataType) {
                    throw CompilerError.type(
                        this.site,
                        "can't destruct a function"
                    )
                }

                const upstreamFieldNames = upstreamType.asDataType.fieldNames

                if (upstreamFieldNames.length != this.destructExprs.length) {
                    throw CompilerError.type(
                        this.site,
                        `wrong number of destruct fields, expected ${upstreamFieldNames.length}, got ${this.destructExprs.length}`
                    )
                }

                for (let i = 0; i < this.destructExprs.length; i++) {
                    this.destructExprs[i].evalInternal(
                        scope,
                        expectSome(
                            upstreamType.instanceMembers[upstreamFieldNames[i]]
                                .asDataType
                        ), // we `asDataType` because methods can't be destructed
                        i
                    )
                }
            }
        }
    }

    /**
     * @param {Scope} scope
     * @param {Type} upstreamType
     * @param {number} i
     */
    evalInternal(scope, upstreamType, i) {
        if (this.hasType()) {
            const t = this.evalType(scope)
            if (!t) {
                return
            }

            // differs from upstreamType because can be enum parent
            let checkType = t

            // if t is enum variant, get parent instead (exact variant is checked at runtime instead)
            if (t.asEnumMemberType && !upstreamType.asEnumMemberType) {
                checkType = t.asEnumMemberType.parentType
            }

            if (!checkType.isBaseOf(upstreamType)) {
                throw CompilerError.type(
                    this.site,
                    `expected ${checkType.toString()} for destructure field ${i + 1}, got ${upstreamType.toString()}`
                )
                return null
            }

            if (!this.isIgnored()) {
                // TODO: take into account ghost type parameters
                scope.set(this.name, t.toTyped())
            }

            this.evalDestructExprs(scope, t)
        } else {
            if (!this.isIgnored()) {
                // TODO: take into account ghost type parameters
                scope.set(this.name, upstreamType.toTyped())
            }

            this.evalDestructExprs(scope, upstreamType)
        }
    }

    /**
     * @param {Scope} scope
     * @param {DataType[]} caseTypes
     */
    evalInSwitchCase(scope, caseTypes) {
        if (caseTypes.length != 1) {
            if (caseTypes.length != this.destructExprs.length) {
                throw new Error("unexpected")
            }

            caseTypes.forEach((caseType, i) => {
                this.destructExprs[i].evalInSwitchCase(scope, [caseType])
            })
        } else {
            const caseType = caseTypes[0]
            if (!this.isIgnored()) {
                console.log(this.name.value)
                scope.set(this.name, caseType.toTyped())
            }

            if (this.typeExpr) {
                this.typeExpr.cache = caseType
            }

            this.evalDestructExprs(scope, caseType)
        }
    }

    /**
     * @param {Scope} scope
     * @param {null | Type} upstreamType
     * @param {number} i
     */
    evalInAssignExpr(scope, upstreamType, i) {
        const t = this.evalType(scope)

        if (!t) {
            scope.set(this.name, new DataEntity(new AnyType()))
            return
        }

        // differs from upstreamType because can be enum parent
        // if t is enum variant, get parent instead (exact variant is checked at runtime instead)
        // also do this for nested as well
        const checkType = this.evalType(scope, upstreamType)

        if (checkType && upstreamType) {
            if (!checkType.isBaseOf(upstreamType)) {
                throw CompilerError.type(
                    this.site,
                    `expected ${checkType.toString()} for rhs ${i + 1}, got ${upstreamType.toString()}`
                )
            }
        }

        if (!this.isIgnored()) {
            // TODO: take into account ghost type parameters
            scope.set(this.name, t.toTyped())
        }

        this.evalDestructExprs(scope, t)
    }

    /**
     * @param {number} argIndex
     * @returns {SourceMappedString}
     */
    toNameIR(argIndex) {
        if (this.isIgnored()) {
            return $(`__lhs_${argIndex}`)
        } else {
            return $(this.name.toString(), this.name.site)
        }
    }

    /**
     * @param {number} fieldIndex
     * @returns {string}
     */
    getFieldFn(fieldIndex) {
        const type = this.type

        if (type.asDataType) {
            return `${type.asDataType.path}__${type.asDataType.fieldNames[fieldIndex]}`
        } else {
            return ""
        }
    }

    /**
     * @private
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} inner
     * @param {string} objName
     * @param {number} fieldIndex
     * @param {string} fieldGetter
     * @returns {SourceMappedString}
     */
    wrapDestructIRInternal(ctx, inner, objName, fieldIndex, fieldGetter) {
        if (this.isIgnored() && this.destructExprs.length == 0) {
            return inner
        } else {
            const baseName = this.isIgnored()
                ? `${objName}_${fieldIndex}`
                : this.name.toString()

            for (let i = this.destructExprs.length - 1; i >= 0; i--) {
                const de = this.destructExprs[i]

                const innerGetter = this.#isTuple
                    ? de.toNameIR(i).toString()
                    : `${this.getFieldFn(i)}(${baseName})`

                inner = de.wrapDestructIRInternal(
                    ctx.tab(),
                    inner,
                    baseName,
                    i,
                    innerGetter
                )
            }

            if (this.#isTuple) {
                inner = $`${baseName}(
					(${$(this.destructExprs.map((de, i) => de.toNameIR(i))).join(", ")}) -> {
						${inner}
					}
				)`
            }

            let getter = fieldGetter

            const t = this.type

            // assert correct constructor index
            if (this.typeExpr && t && t.asEnumMemberType) {
                const constrIdx = t.asEnumMemberType.constrIndex

                getter = `__helios__common__assert_constr_index(${getter}, ${constrIdx})`
            }

            return $([
                $("("),
                $(baseName, this.name.site),
                $(") "),
                $("->", this.site),
                $(` {\n${ctx.indent}${TAB}`),
                inner,
                $(`\n${ctx.indent}}(${getter})`)
            ])
        }
    }

    /**
     *
     * @param {ToIRContext} ctx
     * @param {SourceMappedString} inner - downstream IR expression
     * @param {number} argIndex
     * @returns {SourceMappedString}
     */
    wrapDestructIR(ctx, inner, argIndex) {
        if (this.destructExprs.length == 0) {
            return inner
        } else {
            /**
             * same as this.toNameIR()
             * TODO: can __lhs be changed to underscore?
             */
            const baseName = this.isIgnored()
                ? `__lhs_${argIndex}`
                : this.name.toString()

            for (let i = this.destructExprs.length - 1; i >= 0; i--) {
                const de = this.destructExprs[i]

                const getter = this.#isTuple
                    ? de.toNameIR(i).toString()
                    : `${this.getFieldFn(i)}(${baseName})`

                inner = de.wrapDestructIRInternal(
                    ctx.tab(),
                    inner,
                    baseName,
                    i,
                    getter
                )
            }

            if (this.#isTuple) {
                return $`${baseName}(
					(${$(this.destructExprs.map((de, i) => de.toNameIR(i))).join(", ")}) -> {
						${inner}
					}
				)`
            } else {
                return inner
            }
        }
    }

    /**
     * @returns {SourceMappedString}
     */
    toIR() {
        return $(this.name.toString(), this.name.site)
    }
}
