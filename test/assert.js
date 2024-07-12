import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    RuntimeError,
    UplcBool,
    UplcData,
    UplcDataValue,
    bytesToText
} from "helios"

// helper functions for script property tests
/**
 * @param {any} value
 * @returns {boolean}
 */
export function asBool(value) {
    if (value instanceof UplcBool) {
        return value.bool
    } else if (value instanceof ConstrData) {
        if (value.fields.length == 0) {
            if (value.index == 0) {
                return false
            } else if (value.index == 1) {
                return true
            } else {
                throw new Error(
                    `unexpected ConstrData index ${value.index} (expected 0 or 1 for Bool)`
                )
            }
        } else {
            throw new Error(`expected ConstrData with 0 fields (Bool)`)
        }
    } else if (value instanceof UplcDataValue) {
        return asBool(value.data)
    } else {
        throw value
    }

    throw new Error(`expected UplcBool, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {bigint}
 */
export function asInt(value) {
    if (value instanceof IntData) {
        return value.value
    } else if (value instanceof UplcDataValue) {
        let data = value.data
        if (data instanceof IntData) {
            return data.value
        }
    }

    throw new Error(`expected IntData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {number}
 */
export function asReal(value) {
    return Number(asInt(value)) / 1000000
}

/**
 * @param {any} value
 * @returns {number[]}
 */
export function asBytes(value) {
    if (value instanceof ByteArrayData) {
        return value.bytes
    } else if (value instanceof UplcDataValue) {
        let data = value.data
        if (data instanceof ByteArrayData) {
            return data.bytes
        }
    }

    throw new Error(`expected ByteArrayData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {number[][]}
 */
export function asBytesList(value) {
    if (value instanceof ListData) {
        let items = []

        for (let item of value.list) {
            items.push(asBytes(item))
        }

        return items
    } else if (value instanceof UplcDataValue) {
        let data = value.data

        return asBytesList(data)
    }

    throw new Error(`expected ListData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {string}
 */
export function asString(value) {
    if (value instanceof ByteArrayData) {
        return bytesToText(value.bytes)
    } else if (value instanceof UplcDataValue) {
        let data = value.data
        if (data instanceof ByteArrayData) {
            return bytesToText(data.bytes)
        }
    }

    throw new Error(`expected ByteArrayData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {boolean}
 */
export function isValidString(value) {
    if (value instanceof ByteArrayData) {
        try {
            void bytesToText(value.bytes)

            return true
        } catch (_) {
            return false
        }
    } else if (value instanceof UplcDataValue) {
        let data = value.data
        if (data instanceof ByteArrayData) {
            return isValidString(data)
        }
    }

    throw new Error(`expected ByteArrayData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {bigint[]}
 */
export function asIntList(value) {
    if (value instanceof ListData) {
        let items = []

        for (let item of value.list) {
            if (item instanceof IntData) {
                items.push(item.value)
            } else {
                throw new Error(
                    `expected ListData of IntData, got ${value.toString()}`
                )
            }
        }

        return items
    } else if (value instanceof UplcDataValue) {
        let data = value.data

        return asIntList(data)
    }

    throw new Error(`expected ListData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {bigint[][]}
 */
export function asNestedIntList(value) {
    if (value instanceof ListData) {
        let items = []

        for (let item of value.list) {
            items.push(asIntList(item))
        }

        return items
    } else if (value instanceof UplcDataValue) {
        let data = value.data

        return asNestedIntList(data)
    }

    throw new Error(`expected ListData of ListData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {string[]}
 */
export function asStringList(value) {
    if (value instanceof ListData) {
        let items = []

        for (let item of value.list) {
            items.push(asString(item))
        }

        return items
    } else if (value instanceof UplcDataValue) {
        let data = value.data

        return asStringList(data)
    }

    throw new Error(`expected ListData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {boolean[]}
 */
export function asBoolList(value) {
    if (value instanceof ListData) {
        let items = []

        for (let item of value.list) {
            if (
                item instanceof ConstrData &&
                item.fields.length == 0 &&
                (item.index == 0 || item.index == 1)
            ) {
                items.push(item.index == 1)
            } else {
                throw new Error(
                    `expected ListData of bool-like ConstrData, got ${value.toString()}`
                )
            }
        }

        return items
    } else if (value instanceof UplcDataValue) {
        let data = value.data
        if (data instanceof ListData) {
            return asBoolList(data)
        }
    }

    throw new Error(`expected ListData, got ${value.toString()}`)
}

/**
 * @param {any} value
 * @returns {UplcData}
 */
export function asData(value) {
    if (value instanceof UplcData) {
        return value
    } else if (value instanceof UplcDataValue) {
        return value.data
    } else if (value instanceof UserError) {
        throw value
    } else {
        throw new Error("expected UplcDataValue or UplcData")
    }
}

/**
 * @param {any} err
 * @param {string} info
 * @returns {boolean}
 */
export function isError(err, info) {
    return err instanceof RuntimeError
}

/**
 * @param {any[]} a
 * @param {any[]} b
 * @returns {boolean}
 */
export function equalsList(a, b) {
    let n = a.length
    return n == b.length && a.every((v, i) => b[i] === v)
}
