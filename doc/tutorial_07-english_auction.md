# Part 7 of Helios tutorial: English Auction contract

## The script

```golang
spending english_auction

struct Datum {
    seller:         PubKeyHash
    bid_asset:      AssetClass // allow alternative assets (not just lovelace)
    min_bid:        Int
    deadline:       Time
    for_sale:       Value // the asset that is being auctioned
    highest_bid:    Int // initialized at 0, which signifies the auction doesn't yet have valid bids
    highest_bidder: PubKeyHash

    func update(self, highest_bid: Int, highest_bidder: PubKeyHash) -> Datum {
        Datum{
            seller:         self.seller,
            bid_asset:      self.bid_asset,
            min_bid:        self.min_bid,
            deadline:       self.deadline,
            for_sale:       self.for_sale,
            highest_bid:    highest_bid,
            highest_bidder: highest_bidder
        }
    }
}

enum Redeemer {
    Close {}
    Bid {
        bidder: PubKeyHash
        bid:    Int
    }
}

func main(datum: Datum, redeemer: Redeemer, ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;

    now: Time = tx.now();

    validator_hash: ValidatorHash = ctx.current_validator_hash();

    if (now < datum.deadline) {
        redeemer.switch{
            Close  => false,
            (b: Bid) => {
                if (b.bid < datum.min_bid) {
                    false
                } else if (datum.highest_bid == 0) {
                    // first bid
                    expected_datum: Datum = datum.update(b.bid, b.bidder);

                    tx.value_locked_by_datum(validator_hash, expected_datum) >= datum.for_sale + Value::new(datum.bid_asset, b.bid)
                } else if (b.bid <= datum.highest_bid) {
                    false
                } else {
                    expected_datum: Datum = datum.update(b.bid, b.bidder);

                    tx.value_locked_by_datum(validator_hash, expected_datum) >= datum.for_sale + Value::new(datum.bid_asset, b.bid) &&
                    tx.value_sent_to(datum.highest_bidder) >= Value::new(datum.bid_asset, datum.highest_bid)
                }
            }
        }
    } else {
        // after deadline -> must close
        redeemer.switch {
            Close => {
                if (datum.highest_bid < datum.min_bid) {
                    // the forSale asset must return to the seller, what happens to any erroneous bid value is irrelevant
                    tx.value_sent_to(datum.seller) >= datum.for_sale
                } else {
                    tx.value_sent_to(datum.seller) >= Value::new(datum.bid_asset, datum.highest_bid) &&
                    tx.value_sent_to(datum.highest_bidder) >= datum.for_sale
                }
            },
            else => false
        }
    }
}
```

## TODO: testing procedure
