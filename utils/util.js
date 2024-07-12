import process from "process"
import { dirname } from "path"

export function assert(cond, msg = "") {
    if (msg == "") {
        msg = "unexpected"
    }

    if (!cond) {
        throw new Error(msg)
    }
}

export function correctDir() {
    process.chdir(dirname(process.argv[1]))
}

export function runIfEntryPoint(fn, fileName) {
    if (process.argv[1].endsWith(fileName)) {
        fn()
    }
}
