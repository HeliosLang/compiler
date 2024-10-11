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
     * @private
     * @readonly
     * @type {string}
     */
    _name

    /**
     * @private
     * @readonly
     * @type {string}
     */
    _path

    /**
     * @private
     * @readonly
     * @type {TypeClass}
     */
    _typeClass

    /**
     * @param {string} name - typically "a" or "b"
     * @param {string} path - typicall "__T0" or "__F0"
     * @param {TypeClass} typeClass
     */
    constructor(name, path, typeClass) {
        this._name = name
        this._path = path
        this._typeClass = typeClass
    }

    /**
     * @type {string}
     */
    get name() {
        return this._name
    }

    /**
     * @type {Type}
     */
    get ref() {
        return this._typeClass.toType(this._name, this._path, this)
    }

    /**
     * A null TypeClass matches any type
     * @type {TypeClass}
     */
    get typeClass() {
        return this._typeClass
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this._typeClass && this._typeClass.toString() != "") {
            return `${this._name}: ${this._typeClass.toString()}`
        } else {
            return this._name
        }
    }
}
