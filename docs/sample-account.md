*SimpleAccount: https://github.com/eth-infinitism/account-abstraction/blob/develop/contracts/samples/SimpleAccount.sol*

### 스마트 계정 예제
`SimpleAccount`는 ERC-4337의 표준에 맞게 구현한 단순한 SC Wallet 입니다. 가장 기본이 되는 지갑 인터페이스인 [`IAccount`](../contracts/interfaces/IAccount.sol)의 구현체가 되겠습니다.

표준에서 권고한 것처럼, 지갑을 변경할 수 있는 업그레이드 패턴을 사용하고 있습니다. 여기서는 오픈제펠린 UUPS(Universal Upgradeable Proxy Standard) 패턴을 이용하여 작성되었습니다. UUPS는 
오픈제펠린 업그레이드의 디폴트 패턴인 Transparent proxy 패턴과는 다르게, 업그레이드를 하는 코드(`upgradeTo`)가 로직 컨트랙트 쪽에 있습니다. 
따라서 `SimpleAccount`는 `Initializable`과 함께 `UUPSUpgradeable`를 상속 받아 구현합니다.

```solidity
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract SimpleAccount is BaseAccount, UUPSUpgradeable, Initializable {
    ...
}
```

UUPS에 대한 설명은 [여기](./uups.md)를 참조하기 바랍니다.  

`BaseAccount`는 `IAccount` 인터페이스를 구현한 추상 컨트랙트로, 표준에서 제안한 기본적인 메소드를 실행하고, 상세 구현은 다시 
이를 상속받은 `SimpleAccount`에서 구현합니다. 즉 `IAccount`에서 구현해야 하는 메소드는 하나인데, `validateUserOp`은 `BaseAccount`에 아래와 같이 
되어 있습니다.

```solidity
function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
    external override virtual returns (uint256 validationData) {
        _requireFromEntryPoint();
        validationData = _validateSignature(userOp, userOpHash);
        if (userOp.initCode.length == 0) {
            _validateAndUpdateNonce(userOp);
        }
        _payPrefund(missingAccountFunds);
}
```
`_requireFromEntryPoint`, `_validateSignature`, `_validateAndUpdateNonce`, 등은 `virtual`로 선언되어 있고 
상속받는 컨트랙트 `SimpleAccount`에서 오버라이드 할 수 있습니다.

외부에서 호출되는 `validateUserOp`은 번들러가 사용자 요청을 시뮬레이션하고 번들링을 할 때, 지갑에 전송하기 직전에 entry point를 통해 호출됩니다.
이 메소드를 호출할 수 있는 것은 entry point 뿐이기 때문에, `_requireFromEntryPoint`라는 조건이 걸려 있습니다.

```solidity
function _requireFromEntryPoint() internal virtual view {
    require(msg.sender == address(entryPoint()), "account: not from EntryPoint");
}
```
`entryPoint()`는 `SimpleAccount`에 하드코딩되어 있는 entry point의 주소를 반환합니다. 만약 entry point 주소가 바뀌면 
업그레이드를 통해 새로운 entry point를 가리키는 다른 지갑으로 대체해야 합니다.

`_validateSignature`는 사용자 요청인 `userOp`의 서명을 검사합니다. `UserOperation`은 구조체로 정의되어 있으며 `signature`라는 
항목을 가지고 있습니다. 여기서는 이더리움의 기본 전자서명 방식인 ECDSA를 사용하여(`ecrecover`) 서명을 검증합니다. 전자서명은 지갑마다 얼마든지 다를 수 있고, 변경 가능하므로 
`SimpleAccount`에서 오버라이드 됩니다.

```solidity
function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash) internal override virtual returns (uint256 validationData) {
    bytes32 hash = userOpHash.toEthSignedMessageHash();
    if (owner != hash.recover(userOp.signature))
        return SIG_VALIDATION_FAILED;
    return 0;
}
```
표준에서 정의된 것처럼 전자서명이 유효하지 않으면 `SIG_VALIDATION_FAILED`을 리턴합니다(revert 하지말고).  

`userOp.initCode`가 없으면, 즉 이미 배포된 지갑이라면 지갑의 nonce를 증가시킵니다. nonce는 업그레이드 메커니즘에 의해 코드가 업그레이드 되더라도 보존됩니다.
당연히 사용자 요청의 nonce와 일치하지 않으면 revert 됩니다.

```solidity
function _validateAndUpdateNonce(UserOperation calldata userOp) internal override {
    require(_nonce++ == userOp.nonce, "account: invalid nonce");
}
```

`_payPrefund`는 entry point에게 지급하는 수수료에 해당하는 것으로, 전달받은 사용자 요청의 가스비가 이미 예치되어 있는 
잔액보다 큰 경우에 모자란 가스비를 송금하는 함수 입니다.

```solidity
function _payPrefund(uint256 missingAccountFunds) internal virtual {
    if (missingAccountFunds != 0) {
        (bool success,) = payable(msg.sender).call{value : missingAccountFunds, gas : type(uint256).max}("");
        (success);
        //ignore failure (its EntryPoint's job to verify, not account.)
    }
}
```

이 함수는 entry point가 호출하게 되므로 `msg.sender`는 entry point 가 됩니다. 가스 `gas`가 사실상 무한대인 것은 
이 메소드가 반드시 끝까지 수행되어야 한다는 의미로, 계정은 송금 트랜잭션을 호출하고 바로 종료합니다(리턴 값을 검사하지 않고). 그 이후 처리는 entry point가 수행합니다.

업그레이드 컨트랙트는 생성자를 사용하지 않고 별도의 일반 함수를 초기화 함수로 사용합니다. 오픈제펠린의 초기화 함수 이름은
`initialize`입니다.

```solidity
function initialize(address anOwner) public virtual initializer {
    _initialize(anOwner);
}

function _initialize(address anOwner) internal virtual {
    owner = anOwner;
    emit SimpleAccountInitialized(_entryPoint, owner);
}
```

UUPS는 로직 컨트랙트가 업그레이드를 수행하는 함수를 가지고 있으므로 특정 관리자 권한을 가진 계정만이 실행해야 합니다. 그래서
`UUPSUpgradeable._authorizeUpgrade`를 상속하여 구현합니다.

```solidity
function _authorizeUpgrade(address) internal view override {
    _onlyOwner();
}
```

entry point는 지갑의 `execute` 함수를 호출하여 사용자 요청을 전달합니다. 이 함수는 `_requireFromEntryPointOrOwner`의 조건이 
적용되어 entry point 또는 지갑 소유자만이 실행할 수 있습니다. 

```solidity
function execute(address dest, uint256 value, bytes calldata func) external {
    _requireFromEntryPointOrOwner();
    _call(dest, value, func);
}
```
지갑은 low-level 호출함수인 `call`을 통해 사용자 요청을 실행합니다. 이 요청은 단순 송금일 수도 있고 컨트랙트 호출일 수도 있습니다.

지갑을 통해 entry point에 이더를 예치하거나 인출할 수 있는 함수도 구현되어 있습니다.  

```solidity
function addDeposit() public payable {
    entryPoint().depositTo{value : msg.value}(address(this));
}

function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public onlyOwner {
    entryPoint().withdrawTo(withdrawAddress, amount);
}
```
당연한 것이지만 이더를 받을 수 있도록 `receive`가 있어야 합니다. 지갑 소유자는 직접 이더를 보낼 수 있습니다.

```solidity
receive() external payable {}
```

### 컴파일과 배포

오픈제펠린은 업그레이드 컨트랙트 배포를 관리해주는 하드햇 플러그인 [hardhat-upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/)을 
제공합니다. 로직 컨트랙트만 작성하면 플러그인이 나머지 업그레이드 관련 컨트랙트들을 자동으로 생성합니다. 그리고
업그레이드 과정 중에 발생하는 스토리지 충돌이나 기타 보안적인 문제들고 함께 체크해주기 때문에 안전하고 편리하기도 합니다. 

이 예제에서는 `SimpleAccount`를 처음에 배포하고 entry point 주소를 변경한 `SimpleAccountV2`를 새로 배포하여 
로직 컨트랙트를 교체합니다.

두 번의 배포에서 프록시 컨트랙트의 주소는 변경되지 않지만 로직 컨트랙트의 주소는 달라집니다. 최초 배포는 `upgrades.deployProxy`을 통해서 프록시와 
관련 컨트랙트를 배포하고 그 이후에는 `upgrades.upgradeProxy`으로 로직 컨트랙트를 배포하면 프록시가 새로운 컨트랙트를 가리키게 됩니다.

`SimpleAccount`는 entry point의 주소를 하드코딩하는데 `immutable`로 선언되어 있습니다. `immutable`은 생성자에서 초기화되기 때문에 
로직 컨트랙트에 생성자를 작성합니다.  

```solidity
IEntryPoint private immutable _entryPoint;

constructor(IEntryPoint anEntryPoint) {
    _entryPoint = anEntryPoint;
    _disableInitializers();
}
```

플러그인에서는 로직 컨트랙트의 생성자를 디폴트로 막기 때문에 배포 스크립트에서 `unsafeAllow` 옵션을 주어야 정상적으로 배포가 가능합니다.

```javascript
upgrades.deployProxy(simpleAccount, [owner], {kind: "uups", unsafeAllow: ["constructor","state-variable-immutable"], constructorArgs: [ENTRY_POINT]})
```

배포 후에 출력되는 컨트랙트 주소는 프록시 컨트랙트 주소이고 이더스캔에서 조회해보면 로직 컨트랙트의 주소를 알 수 있습니다.
또는 `@openzeppelin/upgrades-core` 패키지에 있는 `getImplementationAddress`을 사용하여 알 수도 있습니다.

* 컨트랙트
  [SimpleAccount](https://github.com/boyd-dev/account-abstraction/blob/main/contracts/SimpleAccount.sol)
* 배포 스크립트
  [depolySimpleAccount](https://github.com/boyd-dev/account-abstraction/tree/main/scripts)
  [depolySimpleAccountV2](https://github.com/boyd-dev/account-abstraction/tree/main/scripts)
* 테스트 케이스  
  [SimpleAccount-test](https://github.com/boyd-dev/account-abstraction/blob/main/test/SimpleAccount-test.js)