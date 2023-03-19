const hre = require("hardhat");
const {expect, assert} = require("chai");
const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const {handleOpsCalldata, getUserOpHash} = require("./userOp");

let signers;
let owner;
let proxy;
let entryPoint;
let chainId;
const provider = hre.ethers.provider;
const ENTRY_POINT_DUMMY = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";
const BUNDLER_DUMMY = "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB";
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

let test;

describe("SimpleAccount Test", function () {

    before(async () => {

        chainId = (await provider.getNetwork()).chainId;
        signers = await hre.ethers.getSigners();

        // entry point 컨트랙트
        const f = await hre.ethers.getContractFactory("EntryPoint");
        entryPoint = await f.deploy();
        await entryPoint.deployed();

        //const ep = ENTRY_POINT_DUMMY;
        const ep = entryPoint.address;

        // SimpleAccount 컨트랙트
        const simpleAccount = await hre.ethers.getContractFactory("SimpleAccount", signers[0]); 
        owner = await signers[0].getAddress(); // signer[0] is owner
        proxy = await hre.upgrades.deployProxy(simpleAccount, [owner], {kind: "uups", unsafeAllow: ["constructor","state-variable-immutable"], constructorArgs: [ep]});
        await proxy.deployed();


    });

    it ("Confirm the Entry Point address", async () => {
        assert.equal(entryPoint.address, (await proxy.entryPoint()));
    });

    it ("Confirm the implementation address", async () => {
        const impl = await getImplementationAddress(provider, proxy.address);
        const impl_slot = await provider.getStorageAt(proxy.address, IMPLEMENTATION_SLOT);
        expect(impl).to.be.equal(hre.ethers.utils.getAddress(hre.ethers.utils.hexStripZeros(impl_slot)));
    });

    it ("Wallet owner should be able to send ETH", async () => {
        await signers[0].sendTransaction({to: proxy.address, value: hre.ethers.utils.parseEther("5")});
        const recipient = await signers[2].getAddress();
        await proxy.execute(recipient, hre.ethers.utils.parseEther("1"), "0x");

        const balance = await provider.getBalance(proxy.address);
        assert.equal(hre.ethers.utils.parseEther("4").toString(), balance.toString());
    });

    it ("Wallet should be able to deposit ETH to EntryPoint", async () => {
        const deposit = hre.ethers.utils.parseEther("0.1");
        await proxy.addDeposit({value: deposit});
        const depositInfo = await entryPoint.getDepositInfo(proxy.address);
        assert.equal(depositInfo.deposit.toString(),deposit.toString());
    });


    it ("Wallet should be able to call handleOps", async () => {

        const {message, userOp} = getUserOpHash(proxy.address, 0, entryPoint.address, chainId);
        //console.log(`messageToBeSigned=${message}`);

        // 전달해야 하는 메시지는 이더리움 메시지로 만들어서 다시 해시한다.
        //console.log(hre.ethers.utils.hashMessage(hre.ethers.utils.arrayify(message)));

        // signMessage 에는 해시하기 전 메시지를 전달한다.
        const signature = await signers[0].signMessage(hre.ethers.utils.arrayify(message));
        //console.log(hre.ethers.utils.verifyMessage(hre.ethers.utils.arrayify(message), signature));

        const data = handleOpsCalldata(userOp, signature);
        // TODO 번들러를 signers[5] 으로 가정
        //await signers[5].sendTransaction({to: entryPoint.address, data});

        await expect(signers[5].sendTransaction({to: entryPoint.address, data}))
            .to.emit(entryPoint, "UserOperationEvent");

    });


})