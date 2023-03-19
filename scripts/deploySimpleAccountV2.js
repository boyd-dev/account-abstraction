const hre = require("hardhat");

async function main() {

  const ENTRY_POINT = "0xdD870fA1b7C4700F2BD7f44238821C26f7392148";   // dummy address V2
  const signers = await hre.ethers.getSigners();
  const simpleAccountV2 = await hre.ethers.getContractFactory("SimpleAccountV2", signers[0]);
  
  const proxyAddress = "0xf05A1f128412D78e13e037ED04A53d4670b044D7";
  const contract = await hre.upgrades.upgradeProxy(proxyAddress, simpleAccountV2, {kind: "uups", unsafeAllow: ["constructor","state-variable-immutable"], constructorArgs: [ENTRY_POINT]});
  
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
