import React, { Component } from 'react';
import BigNumber from 'bignumber'

class Calc extends Component {
    constructor(props) {
      super(props);
      this.state = {
        gasPrice: 4,
        gasUsed: 21000,
      };
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
        const acceptedBlocks = this.props.txns.reduce((blocks, txn) => {
            if(this.state.gasPrice >= txn.gasPrice){
                blocks.add(txn.blockHash);
            }
            return blocks;
        }, new Set())
        const percentAccepted = this.props.blockCount ? Math.round(acceptedBlocks / this.props.blockCount * 100) + '%' : "";
        const txnCount = this.props.pendingTxns.reduce((count, txn) => {
            if(this.state.gasPrice <= txn.gasPrice) {
                count++;
            }
            return count;
        }, 0);

        const txns = txns.filter((txn) => txn.gasPrice == this.state.gasPrice);
        const totalTime = txns.reduce(((total, txn) => total += txn.time), 0);
        const totalBlocks = txns.reduce(((total, txn) => total += txn.blocks), 0);

        this.setState({
            percentAccepted: percentAccepted,
            txnCount: txnCount,
            time: txns.length && (Math.round(totalTime / txns.length / 1000)),
            blocks: txns.length && (Math.round(totalBlocks / txns.length / 1000)),
            fee: new BigNumber(this.state.gasUsed).times(this.state.gasPrice).dividedBy(1000000000).toNumber(),
        });
    }

    render() {
        return (<form>
            <h3>Calc</h3>
            <div class="form-group">
                <label>Gas Price (Gwei)</label>
                <input type="number" value={this.state.gasPrice} onChange={this.handlePriceChange}/>
            </div>
            <div class="form-group">
                <label>Gas Used</label>
                <input type="number" value={this.state.gasUsed} onChange={this.handleGasChange}/>
            </div>
            <input type="button" value="Calculate" onclick={this.recalculate}/>
            <div class="form-group">
                <label>% of blocks accpeting this gas price</label>
                {this.state.percentAccepted}
            </div>
            <div class="form-group">
                <label>Transactions At or Above in Current Txpool</label>
                {this.state.txnCount}
            </div>
            <div class="form-group">
                <label>Mean Time to Confirm (Blocks)</label>
                {this.state.blocks}
            </div>
            <div class="form-group">
                <label>Mean Time to Confirm (Seconds)</label>
                {this.state.time}
            </div>
            <div class="form-group">
                <label>Transaction fee (ETH)</label>
                {this.state.fee}
            </div>
        </form>);
    }
}

export default Calc;