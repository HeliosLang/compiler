import { runTestScript } from "../../test-runners.js";

export default async function test() {
    await runTestScript(`
    testing tuple_first
    func main() -> Bool {
        t = (1, 2, 3);
        t.first == 1
    }`, "data(1{})", []);
}