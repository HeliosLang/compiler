# Part 7 of Plutus-Light tutorial: English Auction contract

## The script

```golang
struct Datum {
    seller:         PubKeyHash,
    bid_asset:      AssetClass, // allow alternative assets (not just lovelace)
    min_bid:        Int,
    deadline:       Time,
    for_sale:       Value, // the asset that is being auctioned
    highest_bid:    Int, // initialized at 0, which signifies the auction doesn't yet have valid bids
    highest_bidder: PubKeyHash
}

enum Redeemer {
    Close {},
    Bid {
        bidder: PubKeyHash,
        bid:    Int
    }
}

func update_datum(old: Datum, highest_bid: Int, highest_bidder: PubKeyHash) -> Datum {
    Datum{
        seller:         old.seller,
        bid_asset:      old.bid_asset,
        min_bid:        old.min_bid,
        deadline:       old.deadline,
        for_sale:       old.for_sale,
        highest_bid:    highest_bid,
        highest_bidder: highest_bidder
    }
}

func main(datum: Datum, redeemer: Redeemer, ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;

    now: Time = tx.now();

    validator_hash: ValidatorHash = ctx.current_validator_hash();

    if (now < datum.deadline) {
        switch (redeemer) {
            case Redeemer::Close {false}
            case (b: Redeemer::Bid) {
                if (b.bid < datum.min_bid) {
                    false
                } else if (datum.highest_bid == 0) {
                    // first bid
                    expected_datum: Datum = update_datum(datum, b.bid, b.bidder);

                    tx.value_locked_by_datum(validator_hash, expected_datum) >= datum.for_sale + Value::new(datum.bid_asset, b.bid)
                } else if (b.bid <= datum.highest_bid) {
                    false
                } else {
                    expected_datum: Datum = update_datum(datum, b.bid, b.bidder);

                    tx.value_locked_by_datum(validator_hash, expected_datum) >= datum.for_sale + Value::new(datum.bid_asset, b.bid) &&
                    tx.value_sent_to(datum.highest_bidder) >= Value::new(datum.bid_asset, datum.highest_bid)
                }
            }
        }
    } else {
        // after deadline -> must close
        switch (redeemer) {
            case Redeemer::Close {
                if (datum.highest_bid < datum.min_bid) {
                    // the forSale asset must return to the seller, what happens to any erroneous bid value is irrelevant
                    tx.value_sent_to(datum.seller) >= datum.for_sale
                } else {
                    tx.value_sent_to(datum.seller) >= Value::new(datum.bid_asset, datum.highest_bid) &&
                    tx.value_sent_to(datum.highest_bidder) >= datum.for_sale
                }
            }
            default {false}
        }
    }
}
```

## TODO: testing procedure