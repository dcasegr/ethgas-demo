import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// import Chart from 'react-d3-core';
// import LineChart from 'react-d3-basic';

const STD_PRICE_TXNS = 5;
const SAFE_PRICE_TXNS = 10;
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pending: {},
      blocks: [],
      txns: [],
      txnCountByGwei: [],
    };

    this.pending = {};
    this.blocks = [];
    this.delays = [];
    this.gwei = [];
    this.blockNumbers = {};
  }

  async componentDidMount() {
    const eth = this.props.web3.eth;
    eth.getBlock('latest', (err, block) => {
      if(err) return;
      this.blockNumbers[block.hash] = block.number;
      this.updateState();
      eth.filter("pending").watch((err, txnHash) => {
        if(err) return;
        this.pending[txnHash] = this.currentBlock;
        this.updateState();
      });
      eth.filter("latest").watch((err, blockHash) => {
        this.currentBlock = blockHash;
        if(err) return;
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
      block.transactions.forEach((txn) => {
        if(!this.pending[txn.hash]) return;
        const delay = block.number - this.blockNumbers[this.pending[txn.hash]];
        const gwei = txn.gasPrice.dividedBy(1000000000).toNumber();
        if(!this.delays[delay]){
          this.delays[delay] = [];
        }
        this.delays[delay].push(gwei);
        delete this.pending[txn.hash];
      });
      this.updateState();
    });

  }

  updateState() {
    const delays = this.delays.map((prices) => prices.sort());
    const stdTxns = delays.slice(0, STD_PRICE_TXNS-1).reduce((acc, txns) => {
      return acc.concat(txns);
    }, []).sort();

    let stdPrice = 0;
    if(stdTxns.length) {
      stdPrice = stdTxns[Math.floor(stdTxns.length * .95)];
    }

    const safeTxns = delays.slice(0, SAFE_PRICE_TXNS-1).reduce((acc, txns) => {
      return acc.concat(txns);
    }, []).sort();

    let safePrice = 0;
    if(safeTxns.length) {
      safePrice = safeTxns[Math.floor(safeTxns.length * .95)];
    }

    const allDelays = delays.reduce((acc, txns, delay) => {
      return acc.concat(txns.map((txn) => delay));
    }, []).sort();

    const medianWait = allDelays[Math.floor(allDelays.length/2)];

    const txnByGasPrice = this.gwei.reduce((acc, delays, gwei) => {
      if(!delays) return acc;
      if(gwei <= 1){
        acc.count[0] += delays.length;
      }
      else if(gwei > 1 && gwei <= 4) {
        acc.count[1] += delays.length;
      }
      else if(gwei > 4 && gwei <= 20) {
        acc.count[2] += delays.length;
      }
      else if(gwei > 20 && gwei <= 50) {
        acc.count[3] += delays.length;
      }
      else if(gwei > 50) {
        acc.count[4] += delays.length;
      }

      delays.forEach((delay) => {
        if(delay > 10) {
          delay = 10;
        }
        else {
          delay -= 1;
        }
        acc.time[delay]++;
      });
      return acc;
    }, {
      count: [0,0,0,0,0],
      time: [0,0,0,0,0,0,0,0,0,0,0],
    });

    const delayByGwei = this.

    this.setState({
      stdPrice: stdPrice,
      safePrice: safePrice,
      txnByGasPrice: txnByGasPrice,
      medianWait: medianWait,
      currentBlockNumber: this.blockNumbers[this.currentBlock],
      pending: this.pending,
      blocks: this.blocks,
      txns: delays,
    });
  }

  render() {

    let txns = this.state.txns.map((qwai, delay) => {
      return qwai && (<div key={delay}>
        Delay:{delay}
        <ul>
          <li>Count: {qwai.length}</li>
          <li>Min: {Math.min(...qwai)}</li>
          <li>Max: {Math.max(...qwai)}</li>
          <li>Median: {Math.floor(qwai.length/2)}</li>
          <li>Mean: {qwai.reduce(((acc, value) => acc + value), 0) / qwai.length}</li>
        </ul>
      </div>);
    });


    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        Current Block: {this.state.currentBlockNumber}<br />
        Pending Count: {Object.keys(this.state.pending).length}<br />
        Std Price: {this.state.stdPrice}<br />
        Safe Price: {this.state.safePrice}<br />
        Median Wait: {this.state.medianWait}<br />
        Txns By Gas Price:
        <table><tbody>
          <tr><th>&lt;= 1:</th><td>{this.state.txnByGasPrice.count.count[0]}</td></tr>
          <tr><th>&gt; 1 &lt;= 4:</th><td>{this.state.txnByGasPrice.count[1]}</td></tr>
          <tr><th>&gt; 4 &lt;= 20:</th><td>{this.state.txnByGasPrice.count[2]}</td></tr>
          <tr><th>&gt; 20 &lt;= 50:</th><td>{this.state.txnByGasPrice.count[3]}</td></tr>
          <tr><th>&gt; 50</th><td>{this.state.txnByGasPrice.count[4]}</td></tr>
        </tbody></table>
        Confirmation Blocks By Gas Price:
        <table><tbody>
          <tr><th>&lt;= 1:</th><td>{this.state.txnByGasPrice.count.count[0]}</td></tr>
          <tr><th>&gt; 1 &lt;= 4:</th><td>{this.state.txnByGasPrice.count[1]}</td></tr>
          <tr><th>&gt; 4 &lt;= 20:</th><td>{this.state.txnByGasPrice.count[2]}</td></tr>
          <tr><th>&gt; 20 &lt;= 50:</th><td>{this.state.txnByGasPrice.count[3]}</td></tr>
          <tr><th>&gt; 50</th><td>{this.state.txnByGasPrice.count[4]}</td></tr>
          <tr><th>&lt;= 1:</th><td>{this.state.txnByGasPrice.count.count[0]}</td></tr>
          <tr><th>&gt; 1 &lt;= 4:</th><td>{this.state.txnByGasPrice.count[1]}</td></tr>
          <tr><th>&gt; 4 &lt;= 20:</th><td>{this.state.txnByGasPrice.count[2]}</td></tr>
          <tr><th>&gt; 20 &lt;= 50:</th><td>{this.state.txnByGasPrice.count[3]}</td></tr>
          <tr><th>&gt; 50</th><td>{this.state.txnByGasPrice.count[4]}</td></tr>
        </tbody></table>
        Txns: {txns}

      </div>
    );
  }
}

export default App;
