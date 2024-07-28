/**
 * @typedef {import("./common.js").ParameterI} ParameterI
 * @typedef {import("./common.js").Type} Type
 * @typedef {import("./common.js").TypeClass} TypeClass
 */

/**
 * @implements {ParameterI}
 */
export class Parameter {
    /**
     * @type {string}
     */
    #name

    /**
     * @type {string}
     */
    #path

    /**
     * @type {TypeClass}
     */
    #typeClass

    /**
     * @param {string} name - typically "a" or "b"
     * @param {string} path - typicall "__T0" or "__F0"
     * @param {TypeClass} typeClass
     */
    constructor(name, path, typeClass) {
        this.#name = name
        this.#path = path
        this.#typeClass = typeClass
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * @type {Type}
     */
    get ref() {
        return this.#typeClass.toType(this.#name, this.#path, this)
    }

    /**
     * A null TypeClass matches any type
     * @type {TypeClass}
     */
    get typeClass() {
        return this.#typeClass
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this.#typeClass && this.#typeClass.toString() != "") {
            return `${this.#name}: ${this.#typeClass.toString()}`
        } else {
            return this.#name
        }
    }
}
