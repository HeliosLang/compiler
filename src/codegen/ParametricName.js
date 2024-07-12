import { SourceMappedString } from "@helios-lang/ir"

export const RE_IR_PARAMETRIC_NAME =
    /[a-zA-Z_][a-zA-Z_0-9]*[[][a-zA-Z_0-9@[\]]*/g

/**
 * Type type parameter prefix
 * @internal
 */
export const TTPP = "__T"

/**
 * Func type parameter prefix
 * @internal
 */
export const FTPP = "__F"

const RE_TEMPLATE_NAME = new RegExp(`\\b(${TTPP}|${FTPP})[0-9]*\\b`)

/**
 * @internal
 */
export class ParametricName {
    /**
     * Base type name
     * @type {string}
     */
    #base

    /**
     * Type type parameters
     * Note: nested type names can stay strings
     * Note: can be empty
     * @type {string[]}
     */
    #ttp

    /**
     * Function name
     * @type {string}
     */
    #fn

    /**
     * Function type parameters
     * Note: can be empty
     * @type {string[]}
     */
    #ftp

    /**
     * @param {string} base
     * @param {string[]} ttp
     * @param {string} fn
     * @param {string[]} ftp
     */
    constructor(base, ttp, fn = "", ftp = []) {
        this.#base = base
        this.#ttp = ttp
        this.#fn = fn
        this.#ftp = ftp
    }

    /**
     * @param {string} base
     * @param {number} nTtps
     * @param {string} fn
     * @param {number} nFtps
     * @returns
     */
    static newTemplate(base, nTtps, fn = "", nFtps = 0) {
        return new ParametricName(
            base,
            new Array(nTtps).map((_, i) => `${TTPP}${i}`),
            fn,
            new Array(nFtps).map((_, i) => `${FTPP}${i}`)
        )
    }

    /**
     * @type {string[]}
     */
    get ttp() {
        return this.#ttp
    }

    /**
     * @type {string[]}
     */
    get ftp() {
        return this.#ftp
    }

    /**
     * @type {string}
     */
    get base() {
        return this.#base
    }

    /**
     * @type {string}
     */
    get fn() {
        return this.#fn
    }

    /**
     * @param {string[]} ttp
     * @param {string[]} ftp
     * @returns {ParametricName}
     */
    toImplementation(ttp, ftp = []) {
        if (ttp.length != this.#ttp.length) {
            throw new Error(
                `expected ${this.#ttp.length} type parameters, got ${ttp.length} (in ${this.toString()})`
            )
        }

        if (ftp.length != this.#ftp.length) {
            throw new Error(
                `expected ${this.#ftp.length} function type parameters, got ${ftp.length} (in ${this.toString()})`
            )
        }

        return new ParametricName(this.#base, ttp, this.#fn, ftp)
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.#base}${this.#ttp.length > 0 ? `[${this.#ttp.join("@")}]` : ""}${this.#fn}${this.#ftp.length > 0 ? `[${this.#ftp.join("@")}]` : ""}`
    }

    /**
     * @param {boolean} emptyParameters
     * @return {string}
     */
    toTemplate(emptyParameters = false) {
        if (emptyParameters) {
            return `${this.#base}${this.#ttp.length > 0 ? "[]" : ""}${this.#fn}${this.#ftp.length > 0 ? "[]" : ""}`
        } else {
            return `${this.#base}${this.#ttp.length > 0 ? `[${this.#ttp.map((_, i) => `${TTPP}${i}`).join("@")}]` : ""}${this.#fn}${this.#ftp.length > 0 ? `[${this.#ftp.map((_, i) => `${FTPP}${i}`).join("@")}]` : ""}`
        }
    }

    /**
     * @param {SourceMappedString} ir
     * @returns {SourceMappedString}
     */
    replaceTemplateNames(ir) {
        this.#ttp.forEach((name, i) => {
            ir = ir.replace(new RegExp(`\\b${TTPP}${i}`, "gm"), name)
        })

        this.#ftp.forEach((name, i) => {
            ir = ir.replace(new RegExp(`\\b${FTPP}${i}`, "gm"), name)
        })

        return ir
    }

    /**
     * @example
     * IRParametricName.matches("__helios__map[__T0@__T1]__fold[__F2@__F3]") == true
     * @example
     * IRParametricName.matches("__helios__int") == false
     * @example
     * IRParametricName.matches("__helios__option[__T0]__none__new") == true
     * @param {string} str
     * @returns {boolean}
     */
    static matches(str) {
        return str.match(RE_IR_PARAMETRIC_NAME) ? true : false
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    static isTemplate(name) {
        return name.match(RE_TEMPLATE_NAME) ? true : false
    }

    /**
     * @example
     * IRParametricName.parse("__helios__map[__T0@__T1]__fold[__F0@__F1]").toString() == "__helios__map[__T0@__T1]__fold[__F0@__F1]"
     * @example
     * IRParametricName.parse("__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__int]]__fold[__F0@__F1]").toString() == "__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__int]]__fold[__F0@__F1]"
     * @example
     * IRParametricName.parse("__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__list[__T0]]]__fold[__F0@__F1]").toString() == "__helios__map[__helios__bytearray@__helios__map[__helios__bytearray@__helios__list[__T0]]]__fold[__F0@__F1]"
     * @param {string} str
     * @param {boolean} preferType
     * @returns {ParametricName}
     */
    static parse(str, preferType = false) {
        let pos = 0

        /**
         * @returns {string}
         */
        const eatAlphaNum = () => {
            let c = str.charAt(pos)

            const chars = []

            while (
                (c >= "a" && c <= "z") ||
                (c >= "A" && c <= "Z") ||
                c == "_" ||
                (c >= "0" && c <= "9")
            ) {
                chars.push(c)

                pos++

                c = str.charAt(pos)
            }

            return chars.join("")
        }

        /**
         * @returns {string[]}
         */
        const eatParams = () => {
            if (pos >= str.length) {
                return []
            }

            let c = str.charAt(pos)

            if (c != "[") {
                throw new Error(`expected [, got ${c} (in ${str})`)
            }

            const groups = []
            let chars = []

            let depth = 1

            while (depth > 0) {
                pos++

                c = str.charAt(pos)

                if (c == "[") {
                    chars.push(c)
                    depth++
                } else if (c == "]") {
                    if (depth > 1) {
                        chars.push(c)
                    } else {
                        if (chars.length > 0) {
                            groups.push(chars)
                        }
                        chars = []
                    }
                    depth--
                } else if (c == "@") {
                    if (depth > 1) {
                        chars.push(c)
                    } else {
                        if (chars.length == 0) {
                            throw new Error("zero chars in group before @")
                        }

                        groups.push(chars)
                        chars = []
                    }
                } else if (
                    (c >= "a" && c <= "z") ||
                    (c >= "A" && c <= "Z") ||
                    c == "_" ||
                    (c >= "0" && c <= "9")
                ) {
                    chars.push(c)
                } else {
                    throw new Error(
                        `unexpected char '${c}' in parametric name '${str}'`
                    )
                }
            }

            // final closing bracket
            pos++

            return groups.map((g) => g.join(""))
        }

        /**
         *
         * @param {string} base
         * @returns {[string, string]}
         */
        const uneatFn = (base) => {
            let pos = base.length - 1

            let c = base.charAt(pos)

            if (c == "_") {
                throw new Error("unexpected underscore")
            }

            let underscores = 0

            while (pos > 0) {
                pos--
                c = base.charAt(pos)

                if (underscores >= 2) {
                    if (c != "_") {
                        return [base.slice(0, pos + 1), base.slice(pos + 1)]
                    } else {
                        underscores++
                    }
                } else {
                    if (c == "_") {
                        underscores++
                    } else {
                        underscores = 0
                    }
                }
            }

            throw new Error("bad name format")
        }

        let base = eatAlphaNum()

        let ttp = eatParams()
        let fn = ""
        let ftp = []

        if (pos >= str.length) {
            if (!preferType) {
                ;[base, fn] = uneatFn(base)
                ftp = ttp
                ttp = []
            }
        } else {
            fn = eatAlphaNum()

            if (pos < str.length) {
                ftp = eatParams()
            }
        }

        return new ParametricName(base, ttp, fn, ftp)
    }
}
