import { runTestScript } from "../../test-runners.js";

export default async function test() {
    await runTestScript(`
    testing tuple_first

    func main() -> Bool {
        t = (1, 2, (3, 4));
        (_, _, (c: Int, _)) = t;
        c == 3 && t.third.first == 3
    }`, "data(1{})", []);
}