//@ts-check
// Highlighting function

import {
    Source
} from "./utils.js";

import {
    Group,
    Site,
    SymbolToken
} from "./tokens.js";

/**
 * Categories for syntax highlighting
 */
const SyntaxCategory = {
	Normal:     0,
	Comment:    1,
	Literal:    2,
	Symbol:     3,
	Type:       4,
	Keyword:    5,
	Error:      6,
};

/**
 * Returns Uint8Array with the same length as the number of chars in the script.
 * Each resulting byte respresents a different syntax category.
 * This approach should be faster than a RegExp based a approach.
 * @param {string} src
 * @returns {Uint8Array}
 */
export function highlight(src) {
	let n = src.length;

	const SyntaxState = {
		Normal:        0,
		SLComment:     1,
		MLComment:     2,
		String:        3,
		NumberStart:   4,
		HexNumber:     5,
		BinaryNumber:  6,
		OctalNumber:   7,
		DecimalNumber: 8,
		ByteArray:     9,
	};

	// array of categories
	let data = new Uint8Array(n);

	let j = 0; // position in data
	let state = SyntaxState.Normal;

	/** @type {SymbolToken[]} */
	let groupStack = [];
	
	for (let i = 0; i < n; i++) {
		let c = src[i];
		let isLast = i == n - 1;

		switch (state) {
			case SyntaxState.Normal:
				if (c == "/") {
					// maybe comment
					if (!isLast && src[i+1] == "/") {
						data[j++] = SyntaxCategory.Comment;
						data[j++] = SyntaxCategory.Comment;
		
						i++;
						state = SyntaxState.SLComment;
					} else if (!isLast && src[i+1] == "*") {
						data[j++] = SyntaxCategory.Comment;
						data[j++] = SyntaxCategory.Comment;

						i++;
						state = SyntaxState.MLComment;
					} else {
						data[j++] = SyntaxCategory.Symbol;
					}
				} else if (c == "[" || c == "]" || c == "{" || c == "}" || c == "(" || c == ")") {
					let s = new SymbolToken(new Site(new Source(src, ""), i), c);

					if (Group.isOpenSymbol(s)) {
						groupStack.push(s);
						data[j++] = SyntaxCategory.Normal;
					} else {
						let prevGroup = groupStack.pop();

						if (prevGroup === undefined) {
							data[j++] = SyntaxCategory.Error;
						} else if (c == Group.matchSymbol(prevGroup)) {
							data[j++] = SyntaxCategory.Normal;
						} else {
							data[prevGroup.site.startPos] = SyntaxCategory.Error;
							data[j++] = SyntaxCategory.Error;
						}
					}
				} else if (c == "%" || c == "!" || c == "&" || c == "*" || c == "+" || c == "-" || c == "<" || c == "=" || c == ">" || c == "|") {
					// symbol
					switch (c) {
						case "&":
							if (!isLast && src[i+1] == "&") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Normal;
							}
							break;
						case "|":
							if (!isLast && src[i+1] == "|") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Normal;
							}
							break;
						case "!":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "=":
							if (!isLast && (src[i+1] == "=" || src[i+1] == ">")) {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case ">":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "<":
							if (!isLast && src[i+1] == "=") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						case "-":
							if (!isLast && src[i+1] == ">") {
								data[j++] = SyntaxCategory.Symbol;
								data[j++] = SyntaxCategory.Symbol;
								i++;
							} else {
								data[j++] = SyntaxCategory.Symbol;
							}
							break;
						default:
							data[j++] = SyntaxCategory.Symbol;
					}
				} else if (c == "\"") {
					// literal string
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.String;
				} else if (c == "0") {
					// literal number
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.NumberStart;
				} else if (c >= "1" && c <= "9") {
					// literal decimal number
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.DecimalNumber;
				} else if (c == "#") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.ByteArray;
				} else if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_") {
					// maybe keyword, builtin type, or boolean
					let i0 = i;
					let chars = [c];
					// move i to the last word char
					while (i + 1 < n) {
						let d = src[i+1];

						if ((d >= "a" && d <= "z") || (d >= "A" && d <= "Z") || d == "_" || (d >= "0" && d <= "9")) {
							chars.push(d);
							i++;
						} else {
							break;
						}
					}

					let word = chars.join("");
					/** @type {number} */
					let type;
					switch (word) {
						case "true":
						case "false":
							type = SyntaxCategory.Literal;
							break;
						case "Bool":
						case "Int":
						case "ByteArray":
						case "String":
						case "Option":
							type = SyntaxCategory.Type;
							break;
						case "if":
						case "else":
						case "switch":
						case "func":
						case "const":
						case "struct":
						case "enum":
						case "import":
						case "print":
						case "error":
						case "self":
							type = SyntaxCategory.Keyword;
							break;
						case "testing":
						case "spending":
						case "staking":
						case "minting":
						case "linking":
						case "module":
							if (i0 == 0) {
								type = SyntaxCategory.Keyword;
							} else {
								type = SyntaxCategory.Normal;
							}
							break;
						default:
							type = SyntaxCategory.Normal;
					}

					for (let ii = i0; ii < i0 + chars.length; ii++) {
						data[j++] = type;
					}
				} else {
					data[j++] = SyntaxCategory.Normal;
				}
				break;
			case SyntaxState.SLComment:
				data[j++] = SyntaxCategory.Comment;
				if (c == "\n") {
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.MLComment:
				data[j++] = SyntaxCategory.Comment;

				if (c == "*" && !isLast && src[i+1] == "/") {
					i++;
					data[j++] = SyntaxCategory.Comment;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.String:
				data[j++] = SyntaxCategory.Literal;

				if (c == "\"") {
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.NumberStart:
				if (c == "x") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.HexNumber;
				} else if (c == "o") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.OctalNumber;
				} else if (c == "b") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.BinaryNumber;
				} else if (c >= "0" && c <= "9") {
					data[j++] = SyntaxCategory.Literal;
					state = SyntaxState.DecimalNumber;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.DecimalNumber:
				if (c >= "0" && c <= "9") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.HexNumber:
			case SyntaxState.ByteArray:
				if ((c >= "a" && c <= "f") || (c >= "0" && c <= "9")) {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.OctalNumber:
				if (c >= "0" && c <= "7") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			case SyntaxState.BinaryNumber:
				if (c == "0" || c == "1") {
					data[j++] = SyntaxCategory.Literal;
				} else {
					i--;
					state = SyntaxState.Normal;
				}
				break;
			default:
				throw new Error("unhandled SyntaxState");
		}		
	}

	for (let s of groupStack) {
		data[s.site.startPos] = SyntaxCategory.Error;
	}

	return data;
}