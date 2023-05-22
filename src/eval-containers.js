//@ts-check
// Eval container types

import {
	assertDefined
} from "./utils.js";

import {
	Word,
	Site,
	FTPP,
	TTPP
} from "./tokens.js";

import {
	HeliosData,
	HMap,
	HList,
	Option
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
	AllType,
	ArgType,
    FuncType,
    GenericEnumMemberType,
    GenericType,
    VoidType,
	applyTypes
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EnumMemberType} EnumMemberType
 */

/**
 * @typedef {import("./eval-common.js").Named} Named
 */

/**
 * @typedef {import("./eval-common.js").Parametric} Parametric
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */

/**
 * @typedef {import("./eval-common.js").InstanceMembers} InstanceMembers
 */

/**
 * @typedef {import("./eval-common.js").TypeMembers} TypeMembers
 */

import {
	BoolType,
	ByteArrayType,
	IntType,
	RealType,
	StringType,
	genCommonInstanceMembers,
	genCommonTypeMembers
} from "./eval-primitives.js";

import {
	AnyTypeClass,
	Parameter,
    ParametricFunc,
	ParametricType,
	DefaultTypeClass
} from "./eval-parametric.js";

/**
 * Builtin list type
 * @package
 * @type {Parametric}
 */
export const ListType = new ParametricType({
	name: "[]",
	offChainType: HList,
	parameters: [new Parameter("ItemType", `${TTPP}0`, new DefaultTypeClass())],
	apply: ([itemType]) => {
		const offChainItemType = itemType.asDataType?.offChainType ?? null;
		const offChainType = offChainItemType ? HList(offChainItemType) : null;

		return new GenericType({
			offChainType: offChainType,
			name: `[]${itemType.toString()}`,
			path: `__helios__list[${assertDefined(itemType.asDataType).path}]`,
			genInstanceMembers: (self) => {
				/**
				 * @type {InstanceMembers}
				 */
				const specialMembers = {};

				if (IntType.isBaseOf(itemType)) {
					specialMembers.sum = new FuncType([], itemType);
				} else if (RealType.isBaseOf(itemType)) {
					specialMembers.sum = new FuncType([], itemType);
				} else if (StringType.isBaseOf(itemType)) {
					specialMembers.join = new FuncType([
						new ArgType(new Word(Site.dummy(), "separator"), StringType, true)
					], StringType);
				} else if (ByteArrayType.isBaseOf(itemType)) {
					specialMembers.join = new FuncType([
						new ArgType(new Word(Site.dummy(), "separator"), ByteArrayType, true)
					], ByteArrayType);
				} else if (itemType.asNamed?.name.startsWith("[]")) {
					specialMembers.flatten = new FuncType([], itemType);
				}

				return {
					...genCommonInstanceMembers(self),
					...specialMembers,
					all: new FuncType([new FuncType([itemType], BoolType)], BoolType),
					any: new FuncType([new FuncType([itemType], BoolType)], BoolType),
					drop: new FuncType([IntType], self),
					drop_end: new FuncType([IntType], self),
					filter: new FuncType([new FuncType([itemType], BoolType)], self),
					find: new FuncType([new FuncType([itemType], BoolType)], itemType),
					find_safe: new FuncType([new FuncType([itemType], BoolType)], OptionType$(itemType)),
					fold: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([a.ref, itemType], a.ref), a.ref], a.ref));
					})(),
					fold_lazy: (() => {
						const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType, new FuncType([], a.ref)], a.ref), a.ref], a.ref));
					})(),
					for_each: new FuncType([new FuncType([itemType], new VoidType())], new VoidType()),
					get: new FuncType([IntType], itemType),
					get_singleton: new FuncType([], itemType),
					head: itemType,
					is_empty: new FuncType([], BoolType),
					length: IntType,
					map: (() => {
						const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
						return new ParametricFunc([a], new FuncType([new FuncType([itemType], a.ref)], ListType$(a.ref)));
					})(),
					prepend: new FuncType([itemType], self),
					sort: new FuncType([new FuncType([itemType, itemType], BoolType)], self),
					tail: self,
					take: new FuncType([IntType], self),
					take_end: new FuncType([IntType], self),
				}
			},
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
				__add: new FuncType([self, self], self),
				new: new FuncType([IntType, new FuncType([IntType], itemType)], self),
				new_const: new FuncType([IntType, itemType], self)
			})
		})
	}
});

/**
 * @param {Type} itemType 
 * @returns {DataType}
 */
export function ListType$(itemType) {
	return applyTypes(ListType, itemType);
}

/**
 * Builtin map type (in reality list of key-value pairs)
 * @package
 * @type {Parametric}
 */
export const MapType = new ParametricType({
	name: "Map",
	offChainType: HMap,
	parameters: [
		new Parameter("KeyType", `${TTPP}0`, new DefaultTypeClass()), 
		new Parameter("ValueType", `${TTPP}1`, new DefaultTypeClass())
	],
	apply: ([keyType, valueType]) => {
		const offChainKeyType = keyType.asDataType?.offChainType ?? null;
		const offChainValueType = valueType.asDataType?.offChainType ?? null;
		const offChainType = offChainKeyType && offChainValueType ? HMap(offChainKeyType, offChainValueType) : null;

		return new GenericType({
			offChainType: offChainType,
			name: `Map[${keyType.toString()}]${valueType.toString()}`,
			path: `__helios__map[${assertDefined(keyType.asDataType).path}@${assertDefined(valueType.asDataType).path}]`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				all: new FuncType([new FuncType([keyType, valueType], BoolType)], BoolType),
				any: new FuncType([new FuncType([keyType, valueType], BoolType)], BoolType),
				delete: new FuncType([keyType], self),
				filter: new FuncType([new FuncType([keyType, valueType], BoolType)], self),
				find: new FuncType([new FuncType([keyType, valueType], BoolType)], [keyType, valueType]),
				find_key: new FuncType([new FuncType([keyType], BoolType)], keyType),
				find_key_safe: new FuncType([new FuncType([keyType], BoolType)], OptionType$(keyType)),
				find_safe: new FuncType([new FuncType([keyType, valueType], BoolType)], [new FuncType([], [keyType, valueType]), BoolType]),
				find_value: new FuncType([new FuncType([valueType], BoolType)], valueType),
				find_value_safe: new FuncType([new FuncType([valueType], BoolType)], OptionType$(valueType)),
				fold: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([a.ref, keyType, valueType], a.ref), a.ref], a.ref));
				})(),
				fold_lazy: (() => {
					const a = new Parameter("a", `${FTPP}0`, new AnyTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([keyType, valueType, new FuncType([], a.ref)], a.ref), a.ref], a.ref));
				})(),
				for_each: new FuncType([new FuncType([keyType, valueType], new VoidType())], new VoidType()),
				get: new FuncType([keyType], valueType),
				get_safe: new FuncType([keyType], OptionType$(valueType)),
				head: new FuncType([], [keyType, valueType]),
				head_key: keyType,
				head_value: valueType,
				is_empty: new FuncType([], BoolType),
				length: IntType,
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					const b = new Parameter("b", `${FTPP}1`, new DefaultTypeClass());

					return new ParametricFunc([a, b], new FuncType([new FuncType([keyType, valueType], [a.ref, b.ref])], MapType$(a.ref, b.ref)));
				})(),
				prepend: new FuncType([keyType, valueType], self),
				set: new FuncType([keyType, valueType], self),
				sort: new FuncType([new FuncType([keyType, valueType, keyType, valueType], BoolType)], self),
				tail: self,
				update: new FuncType([keyType, new FuncType([valueType], valueType)], self),
				update_safe: new FuncType([keyType, new FuncType([valueType], valueType)], self)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
				__add: new FuncType([self, self], self)
			})
		})
	}
});

/**
 * @param {Type} keyType 
 * @param {Type} valueType
 * @returns {DataType}
 */
export function MapType$(keyType, valueType) {
	return applyTypes(MapType, keyType, valueType);
}

/**
 * Builtin option type
 * @package
 * @type {Parametric}
 */
export const OptionType = new ParametricType({
	name: "Option",
	offChainType: Option,
	parameters: [new Parameter("SomeType", `${TTPP}0`, new DefaultTypeClass())],
	apply: ([someType]) => {
		const someOffChainType = someType.asDataType?.offChainType ?? null;
		const offChainType = someOffChainType ? Option(someOffChainType) : null;
		const someTypePath = assertDefined(someType.asDataType).path;

		/**
		 * @type {DataType}
		 */
		const AppliedOptionType = new GenericType({
			offChainType: offChainType,
			name: `Option[${someType.toString()}]`,
			path: `__helios__option[${someTypePath}]`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				map: (() => {
					const a = new Parameter("a", `${FTPP}0`, new DefaultTypeClass());
					return new ParametricFunc([a], new FuncType([new FuncType([someType], a.ref)], OptionType$(a.ref)));
				})(),
				unwrap: new FuncType([], someType)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
           		None: NoneType,
            	Some: SomeType
			})
		});

		/**
		 * @type {EnumMemberType}
		 */
		const SomeType = new GenericEnumMemberType({
			name: "Some",
			constrIndex: 0,
			fieldNames: ["some"],
			parentType: AppliedOptionType,
			path: `__helios__option[${someTypePath}]__some`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				some: someType
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self)
			})
		});

		/**
		 * @type {EnumMemberType}
		 */
		const NoneType = new GenericEnumMemberType({
			name: "None",
			constrIndex: 1,
			parentType: AppliedOptionType,
			path: `__helios__option[${someTypePath}]__none`,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self)
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self)
			})
		});

		return AppliedOptionType;
	}
});

/**
 * @param {Type} someType 
 * @returns {DataType}
 */
export function OptionType$(someType) {
	return applyTypes(OptionType, someType);
}