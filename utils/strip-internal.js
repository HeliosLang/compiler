#!/usr/bin/env node

// strip statements containing @internal in the preceding comment block

import { readFileSync, writeFileSync } from "fs"
import { correctDir } from "./util.js"

const ORIG_FILE = "../helios.js"
const INPUT_FILE = "../helios-internal.d.ts"
const OUTPUT_FILE = "../helios.d.ts"
const TAB = "    "

function extractTypedefName(src) {
	const re = /^\s*\*\s*@typedef\s*(\{[\s\S]*\}\s*)?([a-zA-Z][a-zA-Z0-9_]*)/m

	const m = src.match(re)

	if (m) {
		return m[2]
	} else {
		return null
	}
}

function extractExportedName(line) {
	let m = line.match(/^\s*export\s+async\s+[a-z]+\s*([a-zA-Z][a-zA-Z0-9_]*)/m)
	if (m) {
		return m[1]
	} else {
		m = line.match(/^\s*export\s*[a-z]+\s*([a-zA-Z][a-zA-Z0-9_]*)/m	)
		
		if (m) {
			return m[1]
		} else {
			return null
		}
	}
}

/**
 * @param {string} src 
 * @returns {Set<string>}
 */
function findInternalNames(src) {
	const lines = src.split("\n")

	const internalNames = new Set()

	// first search for all internal typedefs
	let start = -1
	let isInternal = false

	lines.forEach((line, i) => {
		line = line.trim()

		if (start == -1) {
			if (line.startsWith("/**")) {
				start = i
				isInternal = false
			}
		} else {
			if (line.startsWith("* @internal")) {
				isInternal = true
			} else if (line.startsWith("*/")) {
				if (isInternal) {
					const name = extractTypedefName(lines.slice(start, i+1).join("\n"))

					if (name) {
						internalNames.add(name)
					} else {
						const name = extractExportedName(lines[i+1])
						
						if (name) {
							internalNames.add(name)
						}
					}
				}
				start = -1
			}
		}
	})

	return internalNames
}

/**
 * @param {string} src 
 * @returns {Set<string>}
 */
function findInterfaces(src) {
	const lines = src.split("\n")

	const interfaces = new Set()

	let prevIsInterface = false

	lines.forEach(l => {
		if (prevIsInterface) {
			if (l.trim().startsWith("* @typedef {object}")) {
				const name = l.split("}").pop()

				if (!name) {
					throw new Error("unnamed interface")
				}

				interfaces.add(name.trim())
			}

			prevIsInterface = false
		} else {
			if (l.trim().startsWith("* @interface")) {
				prevIsInterface = true
			}
		}
	})

	return interfaces
}

/**
 * @typedef {{[name: string]: {[name: string]: string}}} NamespaceDoclets
 */

/**
 * 
 * @param {string} src 
 * @returns {NamespaceDoclets}
 */
function extractNamespaceDoclets(src) {
	const lines = src.split("\n")

	let docletStart = -1
	let isNamespaceDoclet = false
	let insideNamespace = false
	let namespaceName = ""
	let prevDoclet = ""
	let braceCount = 0

	/**
	 * @type {NamespaceDoclets}
	 */
	const doclets = {}

	lines.forEach((l, i) => {
		if (docletStart == -1) {
			if (insideNamespace && l.startsWith(`${TAB}/**`)) {
				isNamespaceDoclet = false
				docletStart = i
			} else if (l.startsWith(`/**`)) {
				isNamespaceDoclet = false
				docletStart = i
			} else if (isNamespaceDoclet && !insideNamespace) {
				const m = l.match(/^\s*export\s*const\s*([a-zA-Z][a-zA-Z0-9_]*)/m)

				if (m) {
					braceCount += countBraces(l)
					namespaceName = m[1]
					isNamespaceDoclet = false
					insideNamespace = true

					if (prevDoclet) {
						doclets[namespaceName] = {}
						doclets[namespaceName][""] = prevDoclet
						prevDoclet = ""
					}
				}
			} else if (insideNamespace) {
				if (braceCount == 1) {
					const m = l.match(/^\s*([a-zA-Z_][a-zA-Z_0-9]*):\s/m)

					if (m) {
						const memberName = m[1]

						if (prevDoclet) {
							doclets[namespaceName][memberName] = prevDoclet
							prevDoclet = ""
						}
					}
				}

				braceCount += countBraces(l)

				if (braceCount == 0) {
					insideNamespace = false
					namespaceName = ""
				}
			}
		} else if (l.trim().startsWith("*/")) {
			prevDoclet = lines.slice(docletStart, i+1).join("\n")
			docletStart = -1
		} else if (!insideNamespace && l.trim().startsWith("* @namespace")) {
			isNamespaceDoclet = true
		}
	})

	return doclets
}

/**
 * @param {string} line 
 * @returns {number}
 */
function countBraces(line) {
	let count = 0

	for (let i = 0; i < line.length; i++) {
		const c = line.charAt(i)

		if (c == '{') {
			count += 1
		} else if (c == '}') {
			count -= 1
		}
	}

	return count
}

function hideInternalNames(src, internalNames) {
	const lines = src.split("\n")
	const keep = (new Array(lines.length)).fill(true)
	
	let insideInternalName = false
	let insideNamespace = false
	let docletStart = -1
	let isInternalDoclet = false
	let braceCount = 0
	let declStart = -1

	lines.forEach((line, i) => {
		if (docletStart == -1) {
			if (line.startsWith(`${TAB}/**`)) {
				docletStart = i
			} else if (!insideInternalName) {
				let m = line.match(/^\s*export\s*([a-z]+)\s+([a-zA-Z][a-zA-Z0-9_]*)/m)

				if (m) {
					const name = m[2]
		
					if (internalNames.has(name)) {
						insideInternalName = true
						declStart = i
						braceCount = countBraces(line)
					} else if (m[1] == "namespace") {
						insideNamespace = true
					}
				} else if (!insideNamespace) {
					m = line.match(/^\s*(const|function|class)\s+([a-zA-Z][a-zA-Z0-9_]*)/m)

					if (m) {
						const name = m[2]

						insideInternalName = true
						declStart = i
						braceCount = countBraces(line)
					}
				} else if (insideNamespace) {
					if (line.startsWith(`${TAB}}`)) {
						insideNamespace = false
					}
				}
			}

			if (!insideNamespace && insideInternalName && (braceCount == 0 || (line.startsWith(`${TAB}}`) && (braceCount + countBraces(line)) == 0))) {
				let start = declStart
				const end = i

				for (let j = start; j <= end; j++) {
					keep[j] = false
				}

				declStart = -1
				braceCount = 0
				insideInternalName = false
			}
		} else {
			if (line.trim().startsWith("* @internal")) {
				isInternalDoclet = true
			} else if (line.trim().startsWith("*/")) {
				if (isInternalDoclet) {
					for (let j = docletStart; j <= i; j++) {
						keep[j] = false
					}
				}

				isInternalDoclet = false
				docletStart = -1
			}
		}
	})

	return lines.filter((l, i) => keep[i]).join("\n")
}

function hideInternalMethods(src) {
	const lines = src.split("\n")
	const keep = (new Array(lines.length)).fill(true)

	let insideExportedClass = false
	let docletStart = -1
	let isInternal = false

	lines.forEach((line, i) => {
		if (!insideExportedClass) {
			if (line.startsWith(`${TAB}export class`)) {
				insideExportedClass = true
				docletStart = -1
				isInternal = false
			}
		} else {
			if (line.startsWith(`${TAB}}`)) {
				insideExportedClass = false
				docletStart = -1
				isInternal = false
			} else if (docletStart == -1) {
				if (line.startsWith(`${TAB}${TAB}/**`)) { // must be precisely 4 spaces
					docletStart = i
					isInternal = false
				}
			} else {
				if (line.trim().startsWith("* @internal")) {
					isInternal = true
				} else if (line.trim().startsWith("*/")) {
					if (isInternal && lines[i+1].match(/\s*[a-zA-Z_]/)) {
						let end = i+1

						let count = countBraces(lines[end])
						while (count != 0) {
							end++
							count += countBraces(lines[end])
						}
					
						for (let j = docletStart; j <= end; j++) {
							keep[j] = false
						}

						isInternal = false
					}

					docletStart = -1
				}
			}
		}
	})

	return lines.filter((l, i) => keep[i]).join("\n")
}

/**
 * Also unindents
 * @param {string} src 
 * @returns {string}
 */
function hideOuterDeclaration(src) {
	const lines = src.split("\n")

	lines[0] = ""

	lines[lines.length-2] = ""

	return lines.map(l => {
		if (l.startsWith(TAB)) {
			return l.slice(TAB.length)
		} else {
			return l
		}
	}).join("\n")
}

/**
 * 
 * @param {string} src 
 * @param {NamespaceDoclets} doclets 
 * @returns {string}
 */
function injectNamespaceDoclets(src, doclets) {
	let lines = src.split("\n")

	let insideNamespace = false
	let namespaceName = ""
	let braceCount = 0

	lines = lines.map(l => {
		if (!insideNamespace) {
			if (l.trim().startsWith("export namespace")) {
				const m = l.match(/^\s*export\s*namespace\s*([a-zA-Z_][a-zA-Z_0-9]*)\s/m)

				if (!m) {
					console.error("invalid namespace syntax: " + l)
				} else {

					namespaceName = m[1]
					insideNamespace = true

					braceCount += countBraces(l)

					if (namespaceName in doclets && "" in doclets[namespaceName]) {
						return doclets[namespaceName][""] + "\n" + l
					}
				}
			}
		} else {
			if (braceCount == 1 && l.trim().startsWith("const") || l.trim().startsWith("function")) {
				
				const m = l.match(/^\s*const\s*([a-zA-Z_][a-zA-Z_0-9]*)\s*:/m)
				if (m) {
					const memberName = m[1]

					if (namespaceName in doclets && memberName in doclets[namespaceName]) {
						braceCount += countBraces(l)
						return doclets[namespaceName][memberName] + "\n" + l
					}
				} else {
					
					const m = l.match(/^\s*function\s*([a-zA-Z_][a-zA-Z_0-9]*)\s*\(/m)

					if (m) {
						const memberName = m[1]

						if (namespaceName in doclets && memberName in doclets[namespaceName]) {
							braceCount += countBraces(l)
							return doclets[namespaceName][memberName] + "\n" + l
						}
					}
				}
			}

			braceCount += countBraces(l)

			if (braceCount == 0) {
				insideNamespace = false
				namespaceName = ""
			}
		}

		return l
	})

	return lines.join("\n")
}

/**
 * @param {string} src 
 * @param {Set<string>} interfaces 
 * @returns {string}
 */
function convertTypesToInterfaces(src, interfaces) {
	const lines = src.split("\n")

	let braceCount = 0
	let insideInterface = false

	return lines.map(l => {
		if (!insideInterface) {
			const m = l.match(/^\s*export\s*type\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=/m)

			if (m && interfaces.has(m[1])) {
				insideInterface = true
				braceCount = countBraces(l)

				return `export interface ${m[1]} ${l.split("=").slice(1).join("=")}`
			} else {
				return l
			}
		} else {
			braceCount += countBraces(l)

			if (braceCount == 0) {
				insideInterface = false

				if (l.trim().endsWith(";")) {
					const parts = l.split(";")

					return parts.slice(0, parts.length-1).join(";")
				} else {
					return l
				}
			} else {
				return l
			}
		}
	}).join("\n")
}

async function main() {
	correctDir()

	const origSrc = readFileSync(ORIG_FILE).toString()

	const internalNames = findInternalNames(origSrc)

	const interfaces = findInterfaces(origSrc)

	const namespaceDoclets = extractNamespaceDoclets(origSrc)

	let src = readFileSync(INPUT_FILE).toString()

	src = hideInternalNames(src, internalNames)

	src = hideInternalMethods(src)

	src = hideOuterDeclaration(src)

	src = injectNamespaceDoclets(src, namespaceDoclets)

	src = convertTypesToInterfaces(src, interfaces)

	writeFileSync(OUTPUT_FILE, src)
}

main()
