# Eth Gas Demo

Ethereum network statistics based on https://ethgasstation.info.

All statistics are calculated in the browser from the time the page was openned. It will take a few minutes before there is enough data to product significant results.

## Install
`npm install`

## Setup
Edit src/config.js and populate `rpc` value with Ethereum node address. Node must have RPC running and allow requests from http://localhost:3000.

Alternatively, you can use the MetaMask browser extension as your Ethereum node. This is NOT recommended as MetaMask does not expose pending transactions, to some of the data points will be inaccurate;


## Run
`npm start'

This should open your web browser automatically. If it does not, visit http://localhost:3000 in your browser.
