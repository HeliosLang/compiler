//@ts-check
// Bundling specific functions

import {
    assert
} from "./utils.js";

import { 
    ConstrData,
    ListData, 
    MapData,
    UplcData
} from "./uplc-data.js";

/**
 * @typedef {import("./eval-common.js").TypeSchema} TypeSchema
 */

/**
 * @typedef {import("./eval-common.js").JsToUplcHelpers} JsToUplcHelpers
 */

/**
 * @typedef {import("./eval-common.js").UplcToJsHelpers} UplcToJsHelpers
 */

import { 
    builtinTypes
} from "./helios-scopes.js";


/**
 * @internal
 * @param {TypeSchema} schema
 * @param {any} obj
 * @param {JsToUplcHelpers} helpers
 * @returns {Promise<UplcData>}
 */
export async function jsToUplcInternal(schema, obj, helpers) {
    if (schema.type == "List" && "itemType" in schema) {
        if (!Array.isArray(obj)) {
            throw new Error(`expected Array, got '${obj}'`);
        }

        const items = obj.map(item => jsToUplcInternal(schema.itemType, item, helpers))

        return new ListData(await Promise.all(items));
    } else if (schema.type == "Map" && "keyType" in schema && "valueType" in schema) {
        if (!Array.isArray(obj)) {
            throw new Error(`expected Array, got '${obj}'`);
        }

        /**
         * @type {[Promise<UplcData>, Promise<UplcData>][]}
         */
        const pairs = obj.map(entry => {
            if (!Array.isArray(entry)) {
                throw new Error(`expected Array of Arrays, got '${obj}'`);
            }

            const [key, value] = entry;

            if (!key || !value) {
                throw new Error(`expected Array of Array[2], got '${obj}'`);
            }

            return [
                jsToUplcInternal(schema.keyType, key, helpers),
                jsToUplcInternal(schema.valueType, value, helpers)
            ];
        });

        const keys = await Promise.all(pairs.map(p => p[0]));
        const values = await Promise.all(pairs.map(p => p[1]));

        return new MapData(keys.map((k, i) => [k, values[i]]));
    } else if (schema.type == "Option" && "someType" in schema) {
        if (obj === null) {
            return new ConstrData(1, []);
        } else {
            return new ConstrData(0, [await jsToUplcInternal(schema.someType, obj, helpers)]);
        }
    } else if (schema.type == "Struct" && "fieldTypes" in schema) {
        const fields = schema.fieldTypes.map((fieldSchema) => {
            const fieldName = fieldSchema.name;
            const fieldObj = obj[fieldName];

            if (fieldObj === undefined) {
                throw new Error(`field ${fieldName} not found in '${obj}'`);
            }

            return jsToUplcInternal(fieldSchema, fieldObj, helpers);
        });

        if (fields.length == 1) {
            return fields[0];
        } else {
            return new ListData(await Promise.all(fields));
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
                throw new Error(`field ${fieldName} not found in '${obj[key]}'`);
            }

            return jsToUplcInternal(fieldSchema, fieldObj, helpers);
        });

        return new ConstrData(index, await Promise.all(fields));
    } else {
        const builtinType = builtinTypes[schema.type];

        if (!builtinType) {
            throw new Error(`${schema.type} isn't a valid builtin type`);
        }

        return builtinType.jsToUplc(obj, helpers);
    }
}

/**
 * @internal
 * @param {TypeSchema} schema
 * @param {any} obj
 * @param {JsToUplcHelpers} helpers
 * @returns {Promise<UplcData>}
 */
export function jsToUplc(schema, obj, helpers) {
    return jsToUplcInternal(schema, obj, helpers);
}

/**
 * @internal
 * @param {TypeSchema} schema
 * @param {UplcData} data
 * @param {UplcToJsHelpers} helpers
 * @returns {Promise<any>}
 */
async function uplcToJsInternal(schema, data, helpers) {
    if (schema.type == "List" && "itemType" in schema) {
        return await Promise.all(data.list.map(item => uplcToJsInternal(schema.itemType, item, helpers)));
    } else if (schema.type == "Map" && "keyType" in schema && "valueType" in schema) {
        /**
         * @type {[Promise<any>, Promise<any>][]}
         */
        const pairs = data.map.map(([key, value]) => [uplcToJsInternal(schema.keyType, key, helpers), uplcToJsInternal(schema.valueType, value, helpers)]);

        const keys = await Promise.all(pairs.map(p => p[0]));
        const values = await Promise.all(pairs.map(p => p[1]));

        return keys.map((k, i) => [k, values[i]]);
    } else if (schema.type == "Option" && "someType" in schema) {
        if (data.index == 1) {
            assert(data.fields.length == 0, "not an Option ConstrData");
            return null;
        } else if (data.index == 0) {
            assert(data.fields.length == 1, "not an Option ConstrData");
            return uplcToJsInternal(schema.someType, data.fields[0], helpers);
        } else {
            throw new Error("not an Option ConstrData");
        }
    } else if (schema.type == "Struct" && "fieldTypes" in schema) {
        const obj = {};

        const fields = schema.fieldTypes.length == 1 ? [data] : data.list;

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            const fieldType = schema.fieldTypes[i];

            if (!fieldType) {
                throw new Error("field out-of-range");
            }

            obj[fieldType.name] = await uplcToJsInternal(fieldType, field, helpers);
        }

        return obj;
    } else if (schema.type == "Enum" && "variantTypes" in schema) {
        const index = data.index;

        const variant = schema.variantTypes[index];

        if (!variant) {
            throw new Error("constr index out-of-range");
        }

        const obj = {};

        const fields = data.fields;

        for (let i = 0; i< fields.length; i++) {
            const field = fields[i];

            const fieldType = variant.fieldTypes[i];

            if (!fieldType) {
                throw new Error("field out-of-range");
            }

            obj[fieldType.name] = await uplcToJsInternal(fieldType, field, helpers);
        }

        return {[variant.name]: obj};
    } else {
        const builtinType = builtinTypes[schema.type];

        if (!builtinType) {
            throw new Error(`${schema.type} isn't a valid builtin type`);
        }

        return builtinType.uplcToJs(data, helpers);
    }
}

/**
 * @internal
 * @param {TypeSchema} schema
 * @param {UplcData} data
 * @param {UplcToJsHelpers} helpers
 * @returns {Promise<any>}
 */
export function uplcToJs(schema, data, helpers) {
    return uplcToJsInternal(schema, data, helpers);
}