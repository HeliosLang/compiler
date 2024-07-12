#!/usr/bin/env node

import * as fs from "node:fs"
import * as path from "node:path"
import { correctDir } from "../utils/util.js"

correctDir()

/**
 * @param {string[]} paths
 * @returns {Promise<void>}
 */
async function runTests(paths) {
    await Promise.all(
        paths.map(async (p) => {
            console.log(`RUNNING ${p}`)

            try {
                await (await import(p)).default()

                console.log(`PASSED  ${p}`)
            } catch (e) {
                console.log(`FAILED  ${p}`)

                throw e
            }
        })
    )
}

async function main2() {
    console.log("Running all tests for Helios...")

    await runTests([
        //"./builtins.js",
        "./deserialize-uplc.js",
        "./ed25519.js",
        "./example-scripts.js",
        "./exbudget.js",
        "./inline.js",
        "./metadata.js",
        "./modules.js",
        "./profile.js",
        "./addresses.js",
        "./simplify.js",
        "./syntax.js",
        "./tx-building.js",
        "./user-types.js",
        "./native.js"
    ])
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function listFiles(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })

    const files = await Promise.all(
        entries.map((entry) => {
            const res = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                if (entry.name.endsWith("node_modules")) {
                    return []
                } else {
                    return listFiles(res)
                }
            } else {
                return res
            }
        })
    )

    return files.flat().filter((name) => name.endsWith(".test.js"))
}

async function main() {
    const dir = process.cwd()

    console.log(process.argv)

    const testName = process.argv[2]

    if (testName) {
        const p = path.join(dir, `${testName}.test.js`)

        await runTests([p])
    } else {
        const testFiles = await listFiles(dir)

        await runTests(testFiles)
    }
}

main()
