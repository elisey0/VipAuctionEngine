const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [owner] = await ethers.getSigners();
  const Contract = await hre.ethers.getContractFactory(
    "VipAuctionEngine",
    owner
  );
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

  saveFrontendFiles({
    VipAuctionEngine: 0x1a804ba5ec2e5f4a7618ac421c3cc1105a02e465,
  });
}
function saveFrontendFiles(contracts) {
  const contractsDir = path.join(__dirname, "/../..", "/next-front/contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  Object.entries(contracts).forEach((contract_item) => {
    const [name, contract] = contract_item;

    if (contract) {
      fs.writeFileSync(
        path.join(contractsDir, "/", name + "-contract-address.json"),
        JSON.stringify({ [name]: contract.address }, undefined, 2)
      );
    }

    const ContractArtifact = hre.artifacts.readArtifactSync(name);

    fs.writeFileSync(
      path.join(contractsDir, "/", name + ".json"),
      JSON.stringify(ContractArtifact, null, 2)
    );
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
