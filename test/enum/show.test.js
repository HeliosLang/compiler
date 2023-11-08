import { config } from "helios";
import { runTestScript } from "../test-runners.js";

export default async function test() {
    config.set({DEBUG: false});
    await runTestScript(`
    testing enum_show

    struct Nested {
        a: Int
        b: Time
    }

    enum Enum {
        A {
            a: Int
        }

        B {
            nested: Nested
        }

        C {
            c: Int
        }
    }

    func main() -> Bool {
        e: Enum::B = Enum::B{Nested{10, Time::new(10)}};
        e.show() == "Enum::B{nested: Nested{a: 10, b: 10}}"
    }`, "data(1{})", []);

    config.set({DEBUG: false});
}