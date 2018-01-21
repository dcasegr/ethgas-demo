import * as _ from 'lodash';
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
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
          time: Date.now - pendingTxn.receivedTime,
          price: txn.gasPrice.dividedBy(1000000000).toNumber(),
          gas: txn.gas,
        };
        delete this.pending[txn.hash];
        this.blocks.push(_.pick(block, ['miner', 'gasPrice', 'gasLimit', 'gasUsed']))
      });
      this.updateState();
    });

  }

  updateState() {
    const txns = Object.values(this.txns).sort((a, b) => a.blocks - b.blocks);

    const stdTxns = txns
      .filter((txn) => txn.time / 60000 < STD_PRICE_MIN);
    const stdTxn = stdTxns[Math.round(stdTxns.length * STD_PRICE_PCT)];

    const safeTxns = txns
      .filter((txn) => txn.time / 60000 < SAFE_PRICE_MIN);
    const safeTxn = safeTxns[Math.round(safeTxns.length * SAFE_PRICE_PCT)];

    const medianTxn = txns[Math.round(txns.length / 2)];
    const txnCountByPrice = [0,0,0,0,0];
    const confirmTimesByPrice = [];
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
    })
    const medConfirmTimeByPrice = confirmTimesByPrice.map((times, price) => _.mean(times));

    const gasUse = this.blocks.slice(-10).reduce((acc, block) => {
      acc.limit += block.gasLimit;
      acc.used += block.gasPrice;
      return acc;
    }, {limit: 0, used: 0});


    this.setState({
      currentBlockNumber: this.currentBlockNumber,
      pendingTxnCount: this.pendingTxns.length,
      stdPrice: stdTxn && stdTxn.price,
      safePrice: safeTxn && safeTxn.Price,
      medianWaitTime: medianTxn && medianTxn.time,
      medianWaitBlocks: medianTxn && medianTxn.blocks,
      txnCountByPrice: txnCountByPrice,
      medConfirmTimeByPrice: medConfirmTimeByPrice,
      syncing: this.props.web3.eth.syncing,
      gasUse: Math.round(gasUse.used / gasUse.limit * 100) / 100,
    });
  }

  render() {
    const txnCountByGasPriceRows = this.state.txnCountByPrice.map((count, price) => {
      let label;
      switch(price) {
        case 0:
          label = "<1";
          break;
        case 1:
          label = ">=1 <4";
          break;
        case 2:
          label = ">=4 <20";
          break;
        case 3:
          label = ">=20 <50";
          break;
        default:
          label = ">50";
          break;
      }
      return (<tr key={price}><th>{label}</th><td>{count}</td></tr>);
    });

    const medConfirmTimeByPriceRows = this.state.medConfirmTimeByPrice.map((time, price) =>{
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
      return (<tr key={price}><th>{label}</th><td>{time}</td></tr>);
    });

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        Syncing: {JSON.stringify(this.state.syncing)}<br />
        Current Block: {this.state.currentBlockNumber}<br />
        Pending Count: {this.state.pendingTxnCount}<br />
        Std Price: {this.state.stdPrice}<br />
        Safe Price: {this.state.safePrice}<br />
        Median Wait Time: {this.state.medianWaitTime}<br />
        Median Wait Blocks: {this.state.medianWaitBlocks}<br />
        Transaction Count By Gas Price: <table><tbody>{txnCountByGasPriceRows}</tbody></table>
        Confirmation Time By Gas Price: <table><tbody>{medConfirmTimeByPriceRows}</tbody></table>
        Real-time Gas Use: {this.state.gasUse && this.state.gasUse}%
      </div>
    );
  }
}

export default App;
