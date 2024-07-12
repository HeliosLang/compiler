import { config } from "helios"
import { runTestScript } from "../test-runners.js"

export default async function test() {
    config.set({ DEBUG: true })

    await runTestScript(
        `
    testing struct_show

    struct Struct {
        count: Int
        timestamp: Time
    }

    func main() -> Bool {
        s = Struct{10, Time::new(10)};
        s.show() == "Struct{count: 10, timestamp: 10}"
    }`,
        "data(1{})",
        []
    )

    config.set({ DEBUG: false })
}
