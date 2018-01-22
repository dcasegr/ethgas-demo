import * as _ from 'lodash';
import React, { Component } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Calc from './Calculator';
// import Chart from 'react-d3-core';
// import LineChart from 'react-d3-basic';

// Number of transactions
const STD_PRICE_MIN = 30;
const STD_PRICE_PCT = .80;
const SAFE_PRICE_MIN = 60;
const SAFE_PRICE_PCT = .80;
// const FAST_PRICE_MIN = 2;
// const FAST_PRICE_PCT = .80;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      txnCountByPrice: [],
      medConfirmTimeByPrice: [],
      syncing: false,
      loading: true,
    };

    this.delays = [];
    this.blockNumbers = {};

    this.pendingTxns = {};
    this.txns = {};
    this.blocks = [];
  }

  componentDidMount() {
    const eth = this.props.web3.eth;
    eth.getBlock('latest', (err, block) => {
      if(err) throw err;
      this.blockNumbers[block.hash] = block.number;
      this.updateState();
      eth.filter("pending").watch((err, txnHash) => {
        if(err) return;
        this.pendingTxns[txnHash] = {
          receivedBlock: this.currentBlockHash,
          receivedBlockNumber: this.blockNumbers[this.currentBlockHash],
          receivedTime: Date.now(),
        };

        eth.getTransaction(txnHash, (err, txn) => {
          if(err || !txn || !this.pendingTxns[txn.hash]) return;
          this.pendingTxns[txn.hash].gasPrice = txn.gasPrice.dividedBy(1000000000).toNumber();
        })
        this.updateState();
      });
      eth.filter("latest").watch((err, blockHash) => {
        if(err) return;
        this.currentBlockHash = blockHash;
        this.processBlock(blockHash);
      });
    });
  }

  processBlock(blockHash) {
    const web3 = this.props.web3;
    const eth = web3.eth;
    eth.getBlock(blockHash, true, (err, block) => {
      if(err) return;
      this.blockNumbers[block.hash] = block.number;
      this.currentBlockNumber = block.number;
      block.transactions.forEach((txn) => {
        const pendingTxn = this.pendingTxns[txn.hash];
        if(!pendingTxn) return;
        this.txns[txn.hash] = {
          blocks: block.number - pendingTxn.receivedBlockNumber,
          time: Date.now() - pendingTxn.receivedTime,
          price: txn.gasPrice.dividedBy(1000000000).toNumber(),
          gas: txn.gas,
        };
        delete this.pendingTxns[txn.hash];
        this.blocks.push(_.pick(block, ['miner', 'gasLimit', 'gasUsed']))
      });
      this.updateState();
    });

  }

  updateState() {
    const txns = Object.values(this.txns).sort((a, b) => a.blocks - b.blocks);
    const stdTxns = txns.filter((txn) => txn.time / 60000 < STD_PRICE_MIN);
    const stdTxn = stdTxns[Math.round(stdTxns.length * STD_PRICE_PCT)];
    const safeTxns = txns.filter((txn) => txn.time / 60000 < SAFE_PRICE_MIN);
    const safeTxn = safeTxns[Math.round(safeTxns.length * SAFE_PRICE_PCT)];

    const medianTxn = txns[Math.round(txns.length / 2)];
    const txnCountByPrice = [0,0,0,0,0];
    const confirmTimesByPrice = [];
    let cheapestGas = Number.MAX_SAFE_INTEGER;
    let highestGas = 0;
    txns.forEach((txn) => {
      if(txn.price <= 1) {
        txnCountByPrice[0]++;
      } else if(txn.price > 1 && txn.price <= 4) {
        txnCountByPrice[1]++;
      } else if(txn.price > 4 && txn.price <= 20) {
        txnCountByPrice[2]++;
      } else if(txn.price > 20 && txn.price <= 50) {
        txnCountByPrice[3]++;
      } else {
        txnCountByPrice[4]++;
      }

      let price = Math.round(txn.price)
      if(price < 1) {
        price = 0;
      } else if(price > 40) {
        price = 40;
      }

      if(!confirmTimesByPrice[price]) {
        confirmTimesByPrice[price] = [];
      }
      confirmTimesByPrice[price].push(txn.time);

      if(txn.price < cheapestGas) {
        cheapestGas = txn.price;
      }
      if(txn.price > highestGas) {
        highestGas = txn.price;
      }
    })
    const medConfirmTimeByPrice = confirmTimesByPrice.map((times, price) => Math.round(_.mean(times) / 6000) / 10);

    let gasLimit = 0, gasUsed = 0;
    this.blocks.slice(-100).forEach((block) => {
      gasLimit += block.gasLimit;
      gasUsed += block.gasUsed;
    });
    const gasUse = gasLimit ? Math.round(gasUsed / gasLimit * 100) + '%' : "";

    const txnByGasPrice = Object.values(this.txns).sort((a, b) => a.price - b.price);
    const medianGas = _.get(txnByGasPrice[Math.round(txnByGasPrice.length / 2)], 'price');
    this.setState({
      currentBlockNumber: this.currentBlockNumber,
      txns: this.txns,
      pendingTxns: this.pendingTxns,
      blocksProcessed: this.blocks.length,
      pendingTxnCount: Object.keys(this.pendingTxns).length,
      txnCount: Object.keys(this.txns).length,
      stdPrice: stdTxn && stdTxn.price,
      safePrice: safeTxn && safeTxn.price,
      medianWaitTime: Math.round(medianTxn && medianTxn.time / 1000),
      medianWaitBlocks: (medianTxn && medianTxn.blocks) || "",
      txnCountByPrice: txnCountByPrice,
      medConfirmTimeByPrice: medConfirmTimeByPrice,
      gasUse: gasUse,
      cheapestGas: cheapestGas,
      highestGas: highestGas,
      medianGas: medianGas,
      loading: !this.blocks.length,
    });
  }

  render() {
    const medConfirmTimeByPriceHeaders = this.state.medConfirmTimeByPrice.map((time, price) =>{
      let label;
      switch(price) {
        case 0:
          label = "<1";
          break;
        case 40:
          label = ">40";
          break;
        default:
          label = price;
      }
      return (<th key={price}>{label}</th>);
    });
    const medConfirmTimeByPriceValues = this.state.medConfirmTimeByPrice.map((time, price) => (<td key={price}>{time}</td>));
    const medConfirmTimeByPrice = (<table>
      <tbody>
        <tr>{medConfirmTimeByPriceHeaders}</tr>
        <tr>{medConfirmTimeByPriceValues}</tr>
      </tbody>
    </table>);
    let mask = "";
    if(this.state.loading) {
      mask = (<div id="mask">Initializing...</div>);
    }

    return (
      <div className="App container-fluid">
        <header className="App-header">
          <h1 className="App-title">Eth Gas</h1>
          Current Block: {this.state.currentBlockNumber}<br />
          Blocks Processed: {this.state.blocksProcessed}<br />
          Transactions Processed: {this.state.txnCount}<br/>
        </header>
        <div className="row">
          <div className="col">
            <h4>Recommended Gas Price</h4>
            <table><tbody>
              <tr><th>Speed</th><th>Gas Price</th></tr>
              <tr><td>Safe (&lt;30m)</td><td>{this.state.safePrice}</td></tr>
              <tr><td>Standard (&lt;5m)</td><td>{this.state.stdPrice}</td></tr>
              <tr><td>Fast (&lt;2m)</td><td>{this.state.fastPrice}</td></tr>
            </tbody></table>
            <h4>Transaction Count By Gas Price</h4>
            <table><tbody>
              <tr>
                <th>&lt;1</th>
                <th>&gt;1 &lt;=4</th>
                <th>&gt;4 &lt;=20</th>
                <th>&gt;20 &lt;=50</th>
                <th>&gt;50</th>
              </tr>
              <tr>
                <td>{this.state.txnCountByPrice[0]}</td>
                <td>{this.state.txnCountByPrice[1]}</td>
                <td>{this.state.txnCountByPrice[2]}</td>
                <td>{this.state.txnCountByPrice[3]}</td>
                <td>{this.state.txnCountByPrice[4]}</td>
              </tr>
            </tbody></table>
          </div>
          <div className="col">
            <h4>Stats</h4>
            <label>Pending Transaction Count:</label> {this.state.pendingTxnCount}<br />
            <label>Median Wait Seconds:</label> {this.state.medianWaitTime}<br />
            <label>Median Wait Blocks:</label> {this.state.medianWaitBlocks}<br />
            <label>Real-time Gas Use:</label> {this.state.gasUse}<br/>
            <label>Cheapest Gas Price:</label> {this.state.cheapestGas}<br/>
            <label>Highest Gas Price:</label> {this.state.highestGas}<br/>
            <label>Median Gas Price:</label> {this.state.medianGas}<br/>
          </div>
        </div>
        <div className="row">
        <div className="col">
            <h4>Confirmation Time By Gas Price (minutes)</h4>
            {medConfirmTimeByPrice}
          </div>
        </div>
        <hr />
        <Calc txns={this.txns} pendingTxns={this.pendingTxns} blockCount={this.state.blocksProcessed}/>
        {mask}
      </div>
    );
  }
}

export default App;
