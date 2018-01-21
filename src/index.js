import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import Web3 from 'web3';

let web3js;
window.addEventListener('load', function() {
    // // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    // if (typeof window.web3 !== 'undefined') {
    //   // Use Mist/MetaMask's provider
    //   web3js = new Web3(window.web3.currentProvider);
    // } else {
    //   console.log('No web3? You should consider trying MetaMask!')
    //   // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    // }

    // Now you can start your app & access web3 freely:
    ReactDOM.render(<App web3={web3js}/>, document.getElementById('root'));
    registerServiceWorker();
});


