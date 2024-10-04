import { replaceTabs } from "@helios-lang/codec-utils"
import { SourceMappedString } from "@helios-lang/ir"
import { expectSome } from "@helios-lang/type-utils"
import { ParametricName } from "./ParametricName.js"

/**
 *
 * @param {string} s
 * @param {(m: string) => void} callback
 */
export function matchBuiltins(s, callback) {
    const re = new RegExp("(^|[^@[])(__helios[a-zA-Z0-9_@[\\]]*)", "g")
    let m
    while ((m = re.exec(s))) {
        callback(m[2])
    }
}

/**
 * @typedef {import("./Definitions.js").Definitions} Definitions
 */

/**
 * Wrapper for a builtin function (written in IR)
 * @internal
 */
export class RawFunc {
    /**
     * @type {string}
     */
    #name

    /**
     * @type {((ttp: string[], ftp: string[]) => string)}
     */
    #definition

    /**
     * Construct a RawFunc, and immediately scan the definition for dependencies
     * @param {string} name
     * @param {string | ((ttp: string[], ftp: string[]) => string)} definition
     */
    constructor(name, definition) {
        this.#name = name
        if (!definition) {
            throw new Error("unexpected")
        }

        this.#definition =
            typeof definition == "string"
                ? (ttp, ftp) => {
                      if (ParametricName.matches(this.#name)) {
                          // TODO: make sure definition is always a function for parametric names
                          let pName = ParametricName.parse(this.#name)
                          pName = new ParametricName(
                              pName.base,
                              ttp,
                              pName.fn,
                              ftp
                          )
                          const [def, _] = pName
                              .replaceTemplateNames(
                                  new SourceMappedString(definition)
                              )
                              .toStringWithSourceMap()
                          return def
                      } else {
                          return definition
                      }
                  }
                : definition
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * @param {string[]} ttp
     * @param {string[]} ftp
     * @returns {SourceMappedString}
     */
    toIR(ttp = [], ftp = []) {
        return new SourceMappedString(replaceTabs(this.#definition(ttp, ftp)))
    }

    /**
     * Loads 'this.#dependecies' (if not already loaded), then load 'this'
     * @param {Map<string, RawFunc>} db
     * @param {Definitions} dst
     * @param {string[]} ttp
     * @param {string[]} ftp
     * @returns {void}
     */
    load(db, dst, ttp = [], ftp = []) {
        let name = this.#name
        if (ttp.length > 0 || ftp.length > 0) {
            let pName = ParametricName.parse(name)
            pName = new ParametricName(pName.base, ttp, pName.fn, ftp)
            name = pName.toString()
        }

        if (dst.has(name)) {
            return
        } else {
            const ir = this.toIR(ttp, ftp)

            const [def, _] = ir.toStringWithSourceMap()
            const deps = new Set()

            matchBuiltins(def, (m) => deps.add(m))

            for (let dep of deps) {
                if (!db.has(dep)) {
                    if (ParametricName.matches(dep)) {
                        const pName = ParametricName.parse(dep)
                        const genericName = pName.toTemplate(true)

                        let fn = db.get(genericName)

                        if (fn) {
                            fn.load(db, dst, pName.ttp, pName.ftp)
                        } else {
                            // TODO: make sure all templated defs use the functional approach instead of the replacement approach
                            fn = db.get(pName.toTemplate(false))

                            if (fn) {
                                const ir = pName.replaceTemplateNames(fn.toIR())
                                fn = new RawFunc(dep, ir.toString())
                                fn.load(db, dst)
                            } else {
                                throw new Error(
                                    `InternalError: dependency ${dep} not found`
                                )
                            }
                        }
                    } else {
                        throw new Error(
                            `InternalError: dependency ${dep} not found`
                        )
                    }
                } else {
                    expectSome(db.get(dep)).load(db, dst)
                }
            }

            dst.set(name, { content: ir })
        }
    }
}
