import { Expr } from "./Expr.js"
import { SwitchCase } from "./SwitchCase.js"
import { SwitchDefault } from "./SwitchDefault.js"
import { VoidExpr } from "./VoidExpr.js"
/**
 * @typedef {import("@helios-lang/compiler-utils").Site} Site
 */

/**
 * Parent class of EnumSwitchExpr and DataSwitchExpr
 */
export class SwitchExpr extends Expr {
    #controlExpr
    #cases
    #defaultCase

    /**
     * @param {Site} site
     * @param {Expr} controlExpr - input value of the switch
     * @param {SwitchCase[]} cases
     * @param {Option<SwitchDefault>} defaultCase
     */
    constructor(site, controlExpr, cases, defaultCase = null) {
        super(site)
        this.#controlExpr = controlExpr
        this.#cases = cases
        this.#defaultCase = defaultCase
    }

    get controlExpr() {
        return this.#controlExpr
    }

    get cases() {
        return this.#cases
    }

    get defaultCase() {
        return this.#defaultCase
    }

    /**
     * If there isn't enough coverage then we can simply set the default case to void, so the other branches can be error, print or assert
     */
    setDefaultCaseToVoid() {
        this.#defaultCase = new SwitchDefault(
            this.site,
            new VoidExpr(this.site)
        )
    }

    toString() {
        return `${this.#controlExpr.toString()}.switch{${this.#cases.map((c) => c.toString()).join(", ")}${this.#defaultCase === null ? "" : ", " + this.#defaultCase.toString()}}`
    }
}
