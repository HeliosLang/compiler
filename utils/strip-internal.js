#!/usr/bin/env node

// strip statements containing @internal in the preceding comment block

import { readFileSync, writeFileSync } from "fs"
import { assert, correctDir } from "./util.js"

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
 * 
 * @param {string} line 
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
					}
				} else {
					m = line.match(/^\s*(const|function|class)\s+([a-zA-Z][a-zA-Z0-9_]*)/m)

					if (m) {
						const name = m[2]

						insideInternalName = true
						declStart = i
						braceCount = countBraces(line)
					}
				}
			}

			if (insideInternalName && (braceCount == 0 || (line.startsWith(`${TAB}}`) && (braceCount + countBraces(line)) == 0))) {
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

function hideOuterDeclaration(src) {
	const lines = src.split("\n")

	lines[0] = ""

	lines[lines.length-2] = ""

	return lines.join("\n")
}

async function main() {
	correctDir()

	const internalNames = findInternalNames(readFileSync(ORIG_FILE).toString())

	let src = readFileSync(INPUT_FILE).toString()

	src = hideInternalNames(src, internalNames)

	src = hideInternalMethods(src)

	src = hideOuterDeclaration(src)

	writeFileSync(OUTPUT_FILE, src)
}

main()
