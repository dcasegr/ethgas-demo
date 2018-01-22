import _ from 'lodash';
import React, { Component } from 'react';

class Calc extends Component {
    constructor(props) {
      super(props);
      this.state = {
        gasPrice: 4,
        gasUsed: 21000,
      };
      this.txns = props.txns;
      this.pendingTxns = props.pendingTxns;
      this._recalculate = () => this.recalculate();
    }

    handlePriceChange(event) {
        this.setState({
            gasPrice: event.target.value
        });
    }

    handleGasChange(event) {
        this.setState({
            gasUsed: event.target.value
        });
    }

    recalculate() {
        const acceptedBlocks = _.reduce(this.txns, (blocks, txn) => {
            if(this.state.gasPrice >= txn.gasPrice){
                blocks.add(txn.blockHash);
            }
            return blocks;
        }, new Set())
        const percentAccepted = this.props.blockCount ? Math.round(acceptedBlocks.size / this.props.blockCount * 100) + '%' : "";
        const txnCount = _.reduce(this.pendingTxns, (count, txn) => {
            if(this.state.gasPrice <= txn.gasPrice) {
                count++;
            }
            return count;
        }, 0);

        const txns = Object.values(this.txns).filter((txn) => txn.gasPrice === this.state.gasPrice);
        const totalTime = txns.reduce(((total, txn) => total += txn.time), 0);
        const totalBlocks = txns.reduce(((total, txn) => total += txn.blocks), 0);
        const fee = this.state.gasUsed * this.state.gasPrice / 1000000000;
        this.setState({
            percentAccepted: percentAccepted,
            txnCount: txnCount,
            time: txns.length && (Math.round(totalTime / txns.length / 1000)),
            blocks: txns.length && (Math.round(totalBlocks / txns.length / 1000)),
            // fee: new BigNumber(this.state.gasUsed).times(this.state.gasPrice).dividedBy(1000000000).toNumber(),
            fee: fee,
        });
    }

    render() {
        return (<div><h3>Calc</h3>
        <form className="row">
            <div className="col">
                <div className="form-group">
                    <label>Gas Price (Gwei)</label>
                    <input type="number" value={this.state.gasPrice} onChange={this.handlePriceChange}/>
                </div>
                <div className="form-group">
                    <label>Gas Used</label>
                    <input type="number" value={this.state.gasUsed} onChange={this.handleGasChange}/>
                </div>
                <input type="button" value="Calculate" onClick={this._recalculate}/>
            </div>
            <div className="col">
                <div className="form-group">
                    <label>Mean Time to Confirm (Blocks)</label>
                    {this.state.blocks}
                </div>
                <div className="form-group">
                    <label>Mean Time to Confirm (Seconds)</label>
                    {this.state.time}
                </div>
            </div>
            <div className="col">
            <div className="form-group">
                    <label>% of blocks accpeting this gas price</label>
                    {this.state.percentAccepted}
                </div>
                <div className="form-group">
                    <label>Transactions At or Above in Current Txpool</label>
                    {this.state.txnCount}
                </div>
                <div className="form-group">
                    <label>Transaction fee (ETH)</label>
                    {this.state.fee}
                </div>
            </div>
        </form></div>);
    }
}

export default Calc;