import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import Web3 from 'web3';
import config from './config';

let web3js;
window.addEventListener('load', function() {
    // // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (config.enableMetaMask && typeof window.web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      web3js = new Web3(window.web3.currentProvider);
    } else {
      web3js = new Web3(new Web3.providers.HttpProvider(config.rpc));
    }

    ReactDOM.render(<App web3={web3js}/>, document.getElementById('root'));
    registerServiceWorker();
});


