require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const BNBT_PRIVATE_KEY = process.env.BNBT_PRIVATE_KEY;
const BNBT_RPC_URL = process.env.BNBT_RPC_URL;
const SCAN_API_KEY = process.env.SCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bnbt: {
      url: BNBT_RPC_URL,
      accounts: [BNBT_PRIVATE_KEY],
      chainId: 97,
    },
  },
  etherscan: {
    apiKey: SCAN_API_KEY,
  },
};
