require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");

const keys = require("./keys");
const { getImplementationAddress } = require("@openzeppelin/upgrades-core");

task("getimpl", "Print implementation contract address")
    .addParam("proxy", "Proxy address")
    .setAction(async (args, hre) => {
        const provider = new ethers.providers.JsonRpcProvider(keys.RPC_ENDPOINT_SEPOLIA);
        const proxy = args.proxy;
        console.log(`${await getImplementationAddress(provider, proxy)}`);   
    });


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {

    networks: {

        hardhat: {
            allowUnlimitedContractSize: true
        },

        goerli: {
            url: keys.RPC_ENDPOINT_GOERLI,
            accounts: keys.pk
        },

        sepolia: {
            url: keys.RPC_ENDPOINT_SEPOLIA,
            accounts: keys.pk
        }
    },

    solidity: {
        compilers: [
            {version: "0.8.17", settings: {optimizer: {enabled: true}}},
            {version: "0.8.18", settings: {optimizer: {enabled: true}}}
        ]
    },

    etherscan: {
        apiKey: keys.ETHERSCAN_API_KEY
    },
};
