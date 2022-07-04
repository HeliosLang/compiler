# Part 5 of Plutus-Light how-to guide: Subscription contract
A subscription contract allows a beneficiary to withdraw a pre-specified amount from a script address at regular intervals.
The owner can cancel the contract at any time.

This contract can alternatively be called an 'allowance' contract.

## The script
```golang
data Datum {
    owner            PubKeyHash,
    beneficiary      PubKeyHash,
    total            Value, // remaining Value locked in script
    benefit          Value, 
    after            Time,  // must be incremented by 'interval' every time beneficiary withdraws
    interval         Duration
}

func main(datum Datum, ctx ScriptContext) Bool {
    tx Tx = getTx(ctx);

    if (isTxSignedBy(tx, datum.owner)) {
        true
    } else if (isTxSignedBy(tx, datum.beneficiary)) {
        now Time = getTimeRangeStart(getTxTimeRange(tx));
        if (now >= datum.after) {
             if (datum.benefit >= datum.total) {
                true
             } else {
                currentHash ValidatorHash = getCurrentValidatorHash(ctx);

                expectedRemaining Value = datum.total - datum.benefit;

                expectedDatum Datum = Datum{
                    datum.owner,
                    datum.beneficiary,
                    expectedRemaining,
                    datum.benefit,
                    datum.after + datum.interval,
                    datum.interval
                };

                checkRemaining Value = valueLockedByDatum(tx, currentHash, expectedDatum);

                if (checkRemaining >= expectedRemaining) {
                    true
                } else {
                    trace("too much", false)
                }
             }
        } else {
            trace("too early", false)
        }
    } else {
        trace("unauthorized", false)
    }
}
```