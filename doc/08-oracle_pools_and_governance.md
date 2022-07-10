# (WiP) Part 8 of Plutus-Light tutorial: Oracle Pools and Governance

Oracles post information on the blockchain periodically (eg. the ADA/USD exchange rate), and thanks to the recent Vasil upgrade it has become easier to use that information in smart contracts (eg. stable-coin contracts).

Of course relying on a single centralized oracle goes against the spirit of cryptocurrencies and blockchain technology, so oracles should be grouped in pools. An oracle pool is essentially a smart contract which periodically groups inputs from all participating oracles into a single UTXO. The participating oracles are also rewarded from the oracle pool contract.

A more complete description of oracle pools can be found (here)[https://github.com/Emurgo/Emurgo-Research/blob/master/oracles/Oracle-Pools.md].

## Oracle pool design decisions

### Membership
The first question we need to answer is who can be a member of the pool:
 1. new members can be voted in by existed members, malicious members can be voted out
 2. member performance is measured on-chain, and only the best performing X oracles can claim rewards, in case of a draw seniority wins, X can be changed by voting
 3. token-based membership

Of course the concept of individual 'members' doesn't really apply to an anonymous blockchain, as a single physical actor can control multiple memberships.
 
Membership based purely on voting allows the founder(s) to keep exerting strong control over the oracle pool. Initial membership distribution is also entirely obscured from the public. So closed or limited membership is probably a bad idea from a decentralization perspective.

Entry into the pool based on performance is essentially a time and resource intensive method of acquiring membership. Existing members will vote to keep the max number of members low, in order maximize individual rewards. To avoid that the max number of members might need to be fixed via the contract, but that way the contract loses a lot of flexibility.

Token-based membership is vulnerable to a 51% attack. An attacker could quietly acquire the majority of tokens. Any subsequent attack would instantly destroy all smart contracts relying on the oracle. Because oracle pools are expected to be critical infrastructure for DeFi on Cardano, such an attack must of course be avoided at all costs. So that means initial token distribution must be spread very well, for which several rounds of ISPOs can be used. There also needs to be high enough oracle operation reward, so the tokens are effectively staked and aren't floating around on exchanges.

Note that oracle pools with open membership are also vulnerable to 51% attacks, but that such attacks are made more difficult by the time-delay of requiring the membership.

For this example we will choose a token-based membership. So the first task will be minting the tokens (see (how-to guide to mintin)[06-minting_policy_scripts.md]).

### Data-point collection
Data-point submission happens in three phases.

An active oracle must own some oracle tokens. Every posting period it calculates the data-point and sends a UTXO into the oracle pool contract. The data-point is described in a conventional hash, along with salt. The posting UTXO must also contain the oracle tokens and sufficient collateral.

In a second phase each participating oracle resends the UTXO into the oracle pool contract, while adding a provable time-stamp to the datum.

In the last phase the datum is 'unhidden' by resending the UTXO into the oracle pool contract with an inline-datum. At this point the script can check if sufficient time has passed since unhiding. The 'unhidden' UTXO must also be registered in a special registration UTXO (of which there can be multiple for parallel posting).

Note that data-point submission also contains governance parameters.

### Data-point aggregation
This is the most complex transaction of the oracle pool contract.

This transaction can be submitted after a predefined period after the first entry in one of the registration UTXOs.

In this transaction all 'unhidden' UTXOs, with a time-stamp lying in the correct range, are used to resend the data carrying UTXO into the script contract with the new data-point (inline-datum of course). The submitting oracle must use all the 'unhidden' UTXOs that have been registered in the registration UTXOs. A token-weighted median of the data-point is calculated. Any oracles that lie within a predefined range of the median receive rewards according to how many oracle tokens they own (the submitting transaction gets double the rewards). Any oracles that lie outside the predefined range lose their collateral to the contract. The registration UTXOs are emptied, and the oracle tokens/left-over collateral is sent back to the owners.

The uniqueness of each input UTXO datum must also be checked. Two or more UTXOs with the same datum are obviously colluding (they would've had to have picked the same salt) and lose their collateral. 

The final data-point UTXO can also contain governance parameters, which are updated if there is a sufficient majority. One of these parameters is the number of registration UTXOs, for which additional ones need to be minted if the number increases, and superfluous ones need to burned if the number decreases.

The final data-point UTXO must be marked by a unique data-NFT.

## Minting
The oracle pool described above requires minting 3 different kinds of tokens:
1. oracle pool membership tokens (unique minting)
2. a single data NFT (unique minting)
3. registration NFT (non-unique minting/burning)

## Governance parameters
* submissionPeriod             Duration (period in which the first two phases of data submission must be completed, unhiding must happen after this period)
* unhidingPeriod               Duration (period in which data-point UTXOs are unhidden and registered in registration UTXOs)
* nRegistrationQueues          Integer (number of registration UTXOs)
* collateralPerMembershipToken Integer (collateral asset will probably be ADA)
* validDataRange               Integer (+- around the median, could be in 'points', so '1' is 1%)
* governanceQuorum             Integer (could be '75' for 75%)
* postRewardForWholePool       Integer (postReward asset will probably be ADA)
* extraRewardForPoster         Integer (could be '100' for 100% extra i.e. x2)

The datum of the data-point UTXO will contain the governance parameters and the data-point itself:
* dataPoint  Integer

This could be extended to multiple data-points at some, although makes (dis)incentives more difficult to calulate.

## Other datums
Registration UTXO datum:
* inputs []TxOutputId

Submission UTXO datum:
* owner     PubKeyHash
* salt      Integer
* dataPoint Integer
* all the governance parameters

The sometimes vastly differing datum types probably made it worthwhile to introduce union types:
```golang
enum Datum {
    Post {
        dataPoint: Integer,
        govParams: GovernanceParams
    }, 
    Submit {
        owner:     PubKeyHash,
        salt:      Integer,
        dataPoint: Integer,
        time:      Time,
        govParams: GovernanceParams
    },
    Queue {
        inputs: []TxOutputId
    }
}
```

Data constructors must have a unique order, and can only be used in a single union. The data constructor type can be referenced using the `::` symbol (eg. `Datum::Post`).