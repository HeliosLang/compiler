//@ts-check
// Literal functions

import {
    bytesToText
} from "./utils.js";

import {
    BoolLiteral,
    ByteArrayLiteral,
    IntLiteral,
    Site,
    StringLiteral,
    Word
} from "./tokens.js";

import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    MapData
} from "./uplc-data.js";

import {
    UplcBool,
    UplcDataValue,
    UplcValue
} from "./uplc-ast.js";

import {
    BoolType,
    ByteArrayType,
    EnumMemberStatementType,
    HashType,
    IntType,
    ListType,
    MapType,
    StructStatementType,
    StringType,
    Type
} from "./helios-eval-entities.js";

import {
    CallExpr,
	CallArgExpr,
    ListLiteralExpr,
    MapLiteralExpr,
    PrimitiveLiteralExpr,
    StructLiteralExpr,
    StructLiteralField,
    TypeExpr,
    TypeRefExpr,
    ValueExpr,
    ValuePathExpr
} from "./helios-ast-expressions.js";

/**
 * @package
 * @param {Site} site
 * @param {Type} type - expected type
 * @param {any} value - result of JSON.parse(string)
 * @param {string} path - context for debugging
 * @returns {ValueExpr}
 */
export function buildLiteralExprFromJson(site, type, value, path) {
	if (value === null) {
		throw site.typeError(`expected non-null value for parameter '${path}'`);
	} else if (type instanceof BoolType) {
		if (typeof value == "boolean") {
			return new PrimitiveLiteralExpr(new BoolLiteral(site, value));
		} else {
			throw site.typeError(`expected boolean for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof StringType) {
		if (typeof value == "string") {
			return new PrimitiveLiteralExpr(new StringLiteral(site, value));
		} else {
			throw site.typeError(`expected string for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof IntType) {
		if (typeof value == "number") {
			if (value%1 == 0.0) {
				return new PrimitiveLiteralExpr(new IntLiteral(site, BigInt(value)));
			} else {
				throw site.typeError(`expected round number for parameter '${path}', got '${value}'`);
			}
		} else {
			throw site.typeError(`expected number for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ByteArrayType || type instanceof HashType) {
		if (value instanceof Array) {
			/**
			 * @type {number[]}
			 */
			const bytes = [];

			for (let item of value) {
				if (typeof item == "number" && item%1 == 0.0 && item >= 0 && item < 256) {
					bytes.push(item);
				} else {
					throw site.typeError(`expected uint8[] for parameter '${path}', got '${value}'`);
				}
			}

			/** @type {ValueExpr} */
			let litExpr = new PrimitiveLiteralExpr(new ByteArrayLiteral(site, bytes));

			if (type instanceof HashType) {
				litExpr = new CallExpr(site, new ValuePathExpr(new TypeRefExpr(new Word(site, type.toString()), type), new Word(site, "new")), [new CallArgExpr(litExpr.site, null, litExpr)]);
			}

			return litExpr;
		} else {
			throw site.typeError(`expected array for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ListType) {
		if (value instanceof Array) {
			/**
			 * @type {ValueExpr[]}
			 */
			const items = [];

			for (let item of value) {
				items.push(buildLiteralExprFromJson(site, type.itemType, item, path + "[]"));
			}

			return new ListLiteralExpr(site, new TypeExpr(site, type.itemType), items);
		} else {
			throw site.typeError(`expected array for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof MapType) {
		/**
		 * @type {[ValueExpr, ValueExpr][]}
		 */
		const pairs = [];

		if (value instanceof Object && type.keyType instanceof StringType) {
			for (let key in value) {
				pairs.push([new PrimitiveLiteralExpr(new StringLiteral(site, key)), buildLiteralExprFromJson(site, type.valueType, value[key], path + "." + key)]);
			}
		} else if (value instanceof Array) {
			for (let item of value) {
				if (item instanceof Array && item.length == 2) {
					pairs.push([
						buildLiteralExprFromJson(site, type.keyType, item[0], path + "[0]"),
						buildLiteralExprFromJson(site, type.valueType, item[1], path + "[1]"),
					]);
				} else {
					throw site.typeError(`expected array of pairs for parameter '${path}', got '${value}'`);
				}
			}
		} else {
			throw site.typeError(`expected array or object for parameter '${path}', got '${value}'`);
		}

		return new MapLiteralExpr(
			site, 
			new TypeExpr(site, type.keyType), 
			new TypeExpr(site, type.valueType),
			pairs
		);
	} else if (type instanceof StructStatementType || type instanceof EnumMemberStatementType) {
		if (value instanceof Object) {
			const nFields = type.statement.nFields(site);

			/**
			 * @type {StructLiteralField[]}
			 */
			const fields = new Array(nFields);

			const nActual = Object.entries(value).length;

			if (nFields != nActual) {
				throw site.typeError(`expected object with ${nFields.toString} fields for parameter '${path}', got '${value}' with ${nActual.toString()} fields`);
			}

			for (let i = 0; i < nFields; i++) {
				const key = type.statement.getFieldName(i);

				const subValue = value[key];

				if (subValue === undefined) {
					throw site.typeError(`expected object with key '${key}' for parameter '${path}', got '${value}`);
				}

				const fieldType = type.statement.getFieldType(site, i);

				const valueExpr = buildLiteralExprFromJson(site, fieldType, subValue, path + "." + key);

				fields[i] = new StructLiteralField(nFields == 1 ? null : new Word(site, key), valueExpr);
			}

			return new StructLiteralExpr(new TypeExpr(site, type), fields);
		} else {
			throw site.typeError(`expected object for parameter '${path}', got '${value}'`);
		}
	} else {
		throw site.typeError(`unhandled parameter type '${type.toString()}', for parameter ${path}`);
	}
}

/**
 * @package
 * @param {Site} site
 * @param {Type} type - expected type
 * @param {UplcValue} value 
 * @param {string} path - context for debugging
 * @returns {ValueExpr}
 */
export function buildLiteralExprFromValue(site, type, value, path) {
	if (type instanceof BoolType) {
		if (value instanceof UplcBool) {
			return new PrimitiveLiteralExpr(new BoolLiteral(site, value.bool));
		} else {
			throw site.typeError(`expected UplcBool for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof StringType) {
		if (value instanceof UplcDataValue && value.data instanceof ByteArrayData) {
			return new PrimitiveLiteralExpr(new StringLiteral(site, bytesToText(value.data.bytes)));
		} else {
			throw site.typeError(`expected ByteArrayData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof IntType) {
		if (value instanceof UplcDataValue && value.data instanceof IntData) {
			return new PrimitiveLiteralExpr(new IntLiteral(site, value.data.value));
		} else {
			throw site.typeError(`expected IntData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ByteArrayType) {
		if (value instanceof UplcDataValue && value.data instanceof ByteArrayData) {
			return new PrimitiveLiteralExpr(new ByteArrayLiteral(site, value.data.bytes));
		} else {
			throw site.typeError(`expected ByteArrayData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof ListType) {
		if (value instanceof UplcDataValue && value.data instanceof ListData) {
			/**
			 * @type {ValueExpr[]}
			 */
			const items = [];

			for (let data of value.data.list) {
				items.push(buildLiteralExprFromValue(site, type.itemType, new UplcDataValue(site, data), path + "[]"));
			}

			return new ListLiteralExpr(site, new TypeExpr(site, type.itemType), items);
		} else {
			throw site.typeError(`expected ListData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof MapType) {
		if (value instanceof UplcDataValue && value.data instanceof MapData) {
			/**
			 * @type {[ValueExpr, ValueExpr][]}
			 */
			const pairs = [];

			for (let dataPair of value.data.map) {
				const keyExpr = buildLiteralExprFromValue(site, type.keyType, new UplcDataValue(site, dataPair[0]), path + "{key}");
				const valueExpr = buildLiteralExprFromValue(site, type.valueType, new UplcDataValue(site, dataPair[1]), path + "{value}");

				pairs.push([keyExpr, valueExpr]);
			}

			return new MapLiteralExpr(
				site, 
				new TypeExpr(site, type.keyType), 
				new TypeExpr(site, type.valueType),
				pairs
			);
		} else {
			throw site.typeError(`expected ListData for parameter '${path}', got '${value}'`);
		}
	} else if (type instanceof StructStatementType || type instanceof EnumMemberStatementType) {
		if (value instanceof UplcDataValue && value.data instanceof ConstrData) {
			const nFields = type.statement.nFields(site);
			/**
			 * @type {StructLiteralField[]}
			 */
			const fields = new Array(nFields);

			if (nFields != value.data.fields.length) {
				throw site.typeError(`expected ConstrData with ${nFields.toString} fields for parameter '${path}', got '${value}' with ${value.data.fields.length.toString()} fields`);
			}

			for (let i = 0; i < nFields; i++) {
				const f = value.data.fields[i];

				const fieldType = type.statement.getFieldType(site, i);

				const valueExpr = buildLiteralExprFromValue(site, fieldType, new UplcDataValue(site, f), path + "." + i.toString());

				fields[i] = new StructLiteralField(nFields == 1 ? null : new Word(site, type.statement.getFieldName(i)), valueExpr);
			}

			return new StructLiteralExpr(new TypeExpr(site, type), fields);
		} else {
			throw site.typeError(`expected ConstrData for parameter '${path}', got '${value}'`);
		}
	} else {
		throw site.typeError(`unhandled parameter type '${type.toString()}', for parameter ${path}`);
	}
}