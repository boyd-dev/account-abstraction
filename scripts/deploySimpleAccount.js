const hre = require("hardhat");

async function main() {

  const ENTRY_POINT = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";   // dummy address V1
  const signers = await hre.ethers.getSigners();
  const simpleAccount = await hre.ethers.getContractFactory("SimpleAccount", signers[0]);

  const owner = await signers[0].getAddress();
  const contract = await hre.upgrades.deployProxy(simpleAccount, [owner], {kind: "uups", unsafeAllow: ["constructor","state-variable-immutable"], constructorArgs: [ENTRY_POINT]});

  await contract.deployed();

  console.log(
    `SimpleAccount deployed to ${contract.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
