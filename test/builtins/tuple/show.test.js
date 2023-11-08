import { runTestScript } from "../../test-runners.js";

export default async function test() {
    await runTestScript(`
    testing tuple_show
    
    func main() -> Bool {
        t = (1, 2, 3);
        t.show() == "(1, 2, 3)"
    }`, "data(1{})", []);
}