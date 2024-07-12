//@ts-check
import fs from "fs"

///////////////////////////////////////////////////////////
// Inline unit tests
///////////////////////////////////////////////////////////
// These tests are defined JSDoc strings of helios.js
export default async function main() {
    // import  the helios library and remove the export keywords so we can use a plain eval

    let heliosSrc = fs.readFileSync("../helios.js").toString()

    heliosSrc = heliosSrc.replace(/^\ *export /gm, "")

    let lines = heliosSrc.split("\n")

    let tests = []
    let fnCount = 0
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]

        if (line.trim().startsWith("* @example")) {
            i++

            line = lines[i]

            line = line
                .trim()
                .slice(1)
                .trim()
                .replace(/\/\/.*/, "")
                .trim()

            tests.push(line)
        } else if (line.startsWith("function") || line.startsWith("async")) {
            fnCount += 1
        }
    }

    heliosSrc =
        "'use strict';\n" +
        heliosSrc +
        "\n" +
        tests
            .map((t) => {
                let parts = t.split("==")

                const rhs = parts[parts.length - 1].trim()

                const lhs = parts
                    .slice(0, parts.length - 1)
                    .join("==")
                    .trim()

                return `assertEq(${lhs}, ${rhs}, 'unit test ${t} failed')`
            })
            .join(";\n") +
        ";"

    eval(heliosSrc)

    console.log(
        `unit tested ${tests.length} out of ${fnCount} top-level js function statements using the inline examples`
    )
    for (let test of tests) {
        console.log("  " + test)
    }
}
