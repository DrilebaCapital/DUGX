const fs = require('fs');
const { Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

async function main() {
    const CHAIN_ID = 333;
    const MSG_VERSION = 1;
    const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

    privateKey = ''; // get private key from keystore file

    zilliqa.wallet.addByPrivateKey(privateKey); // Initiate Wallet from privateKey

    const address = getAddressFromPrivateKey(privateKey);
    const myGasPrice = units.toQa('1000', units.Units.Li); // Gas Price that will be used by all transactions
    const code = fs.readFileSync("./contract/FungibleToken-Mintable.scilla").toString();

    const init = [
        // this parameter is mandatory for all init arrays
        {
            vname: "_scilla_version", // Version of scilla used to write & debug contract
            type: "Uint32",
            value: "0"
        },
        {
            vname: "contract_owner", // Owner of the contract computed from keystore file
            type: "ByStr20",
            value: `${address}`
        },
        {
            vname: "name", // Asset name 
            type: "String",
            value: `Digital Ugandan Shilling`
        },
        {
            vname: "symbol", // Asset symbol
            type: "String",
            value: `DUGX`
        },
        {
            vname: "decimals", // Fungbilibilty (divisibility of asset)
            type: "Uint32",
            value: `6`
        },
        {
            vname: "init_supply", // Initial supply of tokens
            type: "Uint128",
            value: "0"
        }
    ];

    const contract = zilliqa.contracts.new(code, init); // Contract deployment parameters

    try {
        const [deployTx, ftoken] = await contract.deployWithoutConfirm({
            version: VERSION,
            gasPrice: myGasPrice,
            gasLimit: Long.fromNumber(40000)
        }, false);

        if (ftoken.error) {
            console.error(ftoken.error);
            return;
        }

        // check the pending status
        const pendingStatus = await zilliqa.blockchain.getPendingTxn(deployTx.id);
        console.log(`Pending status is: `);
        console.log(pendingStatus.result);

        // process confirm
        console.log(`The transaction id is:`, deployTx.id);
        console.log(`Waiting transaction be confirmed`);
        const confirmedTxn = await deployTx.confirm(deployTx.id);

        // Introspect the state of the underlying transaction
        console.log(`Deployment Transaction ID: ${deployTx.id}`);

        // Get the deployed contract address
        console.log("The contract address is:");
        console.log(ftoken.address);

    } catch (e) {
        console.error(e);
    }

}

main(); // Invoke main method
