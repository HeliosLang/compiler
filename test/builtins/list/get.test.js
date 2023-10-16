import { config } from "helios";
import { runTestScript } from "../../test-runners.js";

export default async function test() {
    config.set({DEBUG: true});

    await runTestScript(`
    testing list_get
    func main() -> Bool {
        x = []Int{1, 2, 3};
        print(x.get(0).show());
        x.get(-1) == 3
    }`, "index out of range", ["1"]);

    config.set({DEBUG: false});
}