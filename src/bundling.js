//@ts-check
// Bundling specific functions

import {
    assert
} from "./utils.js";

import {
    IR,
    Site,
    Word
} from "./tokens.js";

import { 
    ConstrData,
    ListData, 
    MapData,
    UplcData
} from "./uplc-data.js";

/**
 * @typedef {import("./eval-common.js").TypeSchema} TypeSchema
 */

import {
    AllType,
    ArgType,
    FuncType
} from "./eval-common.js";

import {
    ByteArrayType,
    IntType,
    RealType,
    StringType
} from "./eval-primitives.js";

import {
    MintingPolicyHashType,
    ScriptHashType,
    StakingValidatorHashType,
    ValidatorHashType
} from "./eval-hashes.js";

import {
    AddressType,
    TxType
} from "./eval-tx.js";

import { 
    builtinTypes
} from "./helios-scopes.js";

import {
    IRProgram,
    IRParametricProgram
} from "./ir-program.js";

/**
 * @param {TypeSchema} schema
 * @param {any} obj
 * @returns {UplcData}
 */
export function jsToUplc(schema, obj) {
    if (schema.type == "List" && "itemType" in schema) {
        if (!Array.isArray(obj)) {
            throw new Error(`expected Array, got '${JSON.stringify(obj)}'`);
        }

        return new ListData(obj.map(item => jsToUplc(schema.itemType, item)));
    } else if (schema.type == "Map" && "keyType" in schema && "valueType" in schema) {
        if (!Array.isArray(obj)) {
            throw new Error(`expected Array, got '${JSON.stringify(obj)}'`);
        }

        return new MapData(obj.map(entry => {
            if (!Array.isArray(entry)) {
                throw new Error(`expected Array of Arrays, got '${JSON.stringify(obj)}'`);
            }

            const [key, value] = entry;

            if (!key || !value) {
                throw new Error(`expected Array of Array[2], got '${JSON.stringify(obj)}'`);
            }

            return [
                jsToUplc(schema.keyType, key),
                jsToUplc(schema.valueType, value)
            ];
        }));
    } else if (schema.type == "Option" && "someType" in schema) {
        if (obj === null) {
            return new ConstrData(1, []);
        } else {
            return new ConstrData(0, [jsToUplc(schema.someType, obj)]);
        }
    } else if (schema.type == "Struct" && "fieldTypes" in schema) {
        const fields = schema.fieldTypes.map((fieldSchema) => {
            const fieldName = fieldSchema.name;
            const fieldObj = obj[fieldName];

            if (fieldObj === undefined) {
                throw new Error(`field ${fieldName} not found in ${JSON.stringify(obj)}`);
            }

            return jsToUplc(fieldSchema, fieldObj);
        });

        if (fields.length == 1) {
            return fields[0];
        } else {
            return new ListData(fields);
        }
    } else if (schema.type == "Enum" && "variantTypes" in schema) {
        const keys = Object.keys(obj);

        if (keys.length != 1) {
            throw new Error("expected a single key for enum");
        }

        const key = keys[0];

        const index = schema.variantTypes.findIndex(variant => variant.name == key);

        if (index == -1) {
            throw new Error(`invalid variant ${key}`);
        }

        const fields = schema.variantTypes[index].fieldTypes.map((fieldSchema) => {
            const fieldName = fieldSchema.name;
            const fieldObj = obj[key][fieldName];

            if (fieldObj === undefined) {
                throw new Error(`field ${fieldName} not found in ${JSON.stringify(obj[key])}`);
            }

            return jsToUplc(fieldSchema, fieldObj);
        });

        return new ConstrData(index, fields);
    } else {
        const builtinType = builtinTypes[schema.type];

        if (!builtinType) {
            throw new Error(`${schema.type} isn't a valid builtin type`);
        }

        return builtinType.jsToUplc(obj);
    }
}

/**
 * @param {TypeSchema} schema
 * @param {UplcData} data
 * @returns {any}
 */
export function uplcToJs(schema, data) {
    if (schema.type == "List" && "itemType" in schema) {
        return data.list.map(item => uplcToJs(schema.itemType, item));
    } else if (schema.type == "Map" && "keyType" in schema && "valueType" in schema) {
        return data.map.map(([key, value]) => [uplcToJs(schema.keyType, key), uplcToJs(schema.valueType, value)]);
    } else if (schema.type == "Option" && "someType" in schema) {
        if (data.index == 1) {
            assert(data.fields.length == 0, "not an Option ConstrData");
            return null;
        } else if (data.index == 0) {
            assert(data.fields.length == 1, "not an Option ConstrData");
            return uplcToJs(schema.someType, data.fields[0]);
        } else {
            throw new Error("not an Option ConstrData");
        }
    } else if (schema.type == "Struct" && "fieldTypes" in schema) {
        const obj = {};

        const fields = schema.fieldTypes.length == 1 ? [data] : data.list;

        fields.forEach((field, i) => {
            const fieldType = schema.fieldTypes[i];

            if (!fieldType) {
                throw new Error("field out-of-range");
            }

            obj[fieldType.name] = uplcToJs(fieldType, field);
        });

        return obj;
    } else if (schema.type == "Enum" && "variantTypes" in schema) {
        const index = data.index;

        const variant = schema.variantTypes[index];

        if (!variant) {
            throw new Error("constr index out-of-range");
        }

        const obj = {};

        const fields = data.list;

        fields.forEach((field, i) => {
            const fieldType = variant.fieldTypes[i];

            if (!fieldType) {
                throw new Error("field out-of-range");
            }

            obj[fieldType.name] = field;
        });

        return {[variant.name]: obj};
    } else {
        const builtinType = builtinTypes[schema.type];

        if (!builtinType) {
            throw new Error(`${schema.type} isn't a valid builtin type`);
        }

        return builtinType.uplcToJs(data);
    }
}

export const exportedForBundling = {
    AddressType,
    AllType,
    ArgType,
    ByteArrayType,
    FuncType,
    IntType,
    IR,
    IRProgram,
    IRParametricProgram,
    MintingPolicyHashType,
    RealType,
    ScriptHashType,
    Site,
    StakingValidatorHashType,
    StringType,
    TxType,
    ValidatorHashType,
    Word
};