const hre = require("hardhat");

const userOpType = "tuple(address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)";
const abi = ["function handleOps(" + userOpType + "[],address)"];
const iface = new hre.ethers.utils.Interface(abi);


const BUNDLER_DUMMY = "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB";

const initCode = "0x";
const callData = "0x2b1ea9aa"; // noname()
const callGasLimit = "21000";
const verificationGasLimit = "500000";
const preVerificationGas = "100000";
const maxFeePerGas = "20000000000"; //20 gwei
const maxPriorityFeePerGas = "1000000000"; //1 gwei
const paymasterAndData = "0x";
const signature = "0x";

const  handleOpsCalldata = (userOp, signature) => {

    return iface.encodeFunctionData("handleOps",
        [
            [
                [
                    userOp.sender,
                    userOp.nonce,
                    userOp.initCode,
                    userOp.callData,
                    userOp.callGasLimit,
                    userOp.verificationGasLimit,
                    userOp.preVerificationGas,
                    userOp.maxFeePerGas,
                    userOp.maxPriorityFeePerGas,
                    userOp.paymasterAndData,
                    signature
                ]
            ],
            BUNDLER_DUMMY
        ]
    );
}

const getUnsignedUserOp = (sender, nonce) => {

    return {
        sender,
        nonce,
        initCode,
        callData,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymasterAndData,
        signature
    }
}
const getUserOpHash = (sender, nonce, entryPoint, chainId) => {

    const userOp = getUnsignedUserOp(sender, nonce);

    let encodedUserOp = hre.ethers.utils.defaultAbiCoder.encode([userOpType],
        [
            [
                userOp.sender,
                userOp.nonce,
                userOp.initCode,
                userOp.callData,
                userOp.callGasLimit,
                userOp.verificationGasLimit,
                userOp.preVerificationGas,
                userOp.maxFeePerGas,
                userOp.maxPriorityFeePerGas,
                userOp.paymasterAndData,
                userOp.signature
            ]
        ]);

    // remove leading word (total length) and trailing word (zero-length signature)
    // packed 하면서 원래 서명 대상인 길이 0인 signature 를 제외한 메시지
    encodedUserOp = '0x' + encodedUserOp.slice(66, encodedUserOp.length - 64);

    return {
        message: hre.ethers.utils.keccak256(hre.ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "address", "uint256"],
            [hre.ethers.utils.keccak256(encodedUserOp), entryPoint, chainId]
        )),
        userOp
    };
}


module.exports = {
    handleOpsCalldata,
    getUserOpHash
}