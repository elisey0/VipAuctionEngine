const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [owner] = await ethers.getSigners();
  const Contract = await hre.ethers.getContractFactory("VipAuctionEngine");
  const contract = await Contract.deploy();

  await contract.deployed();

  console.log("owner address: ${owner.address}");

  console.log("deployed contract address: ${contract.address}");

  const WAIT_BLOCK_CONFIRMATIONS = 6;
  await contract.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);

  const network = await ethers.provider.getNetwork();
  console.log("Contract deployed to: ${contract.address} on ${network.name}");

  console.log("Verifying contract on Etherscan...");

  await run("verify:verify", {
    address: contract.address,
    constructorArguments: [],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
