

import { Program, Site, UplcDataValue, UplcData, config } from "helios";
import { runTestScript } from "../test-runners.js";

export default async function test() {
    config.set({CHECK_CASTS: true})

    const program = Program.new(`
    testing enum_from_data

    enum Activity { 
        mintingCharter {
            owner: Address
            // we don't have a responsiblity to enforce delivery to the right location
            // govAuthority: RelativeDelegateLink   // not needed 
        }

        mintingUuts {
            seedTxn: TxId
            seedIndex: Int
            purposes: []String
        }
    }

    func main(data: Data) -> Bool {
        a = Activity::from_data(data);
        a.switch{
            mintingCharter => print("is minting charter"),
            mintingUuts => print("is minting uuts")
        };
        true
    }
    `);

    const uplc = program.compile(false)

    const data = UplcData.fromCbor("d87a9fd8799f5820d581ec83bb4b47c0da7350e9fc65f526677fd0aa313015c1f1d2fc77dffb9e3eff039f477265674372656450637265644c697374696e67417574687affff")
    const res = await uplc.run([new UplcDataValue(Site.dummy(), data)])

    console.log(res.toString())
}