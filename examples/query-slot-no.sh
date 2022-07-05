#!/bin/bash
cardano-cli query tip --testnet-magic $TESTNET_MAGIC_NUM | tr -d -c [:digit:][=,=] | cut -d ',' -f 5
