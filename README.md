## Account Abstraction

이더리움의 계정은, 특히 EOA라고 하는 것은 지갑을 의미합니다. 그래서 애플리케이션 관점에서 할 수 있는 것이 별로 없습니다. 현재 지갑의 기능이란 개인키를 생성하고 
트랜잭션 전송이나 메시지에 서명하는 일이 전부입니다.

그래서 EOA로부터 지갑을 분리해서 지갑에 다양한 기능을 추가해보자는 것이 "계정 추상화(Account Abstraction, AA)"의 방향이 되겠습니다.
계정 추상화를 설계하고 있는 이더리움 재단의 요압 바이스(Yoav Weiss)는 "abstraction"이라는 용어가 마음에 안든다고 합니다. 이 용어는 
의미의 혼란을 일으키기 때문에 "스마트 계정"이 오히려 더 맞는 것 같다고 합니다.

바이스에 의하면 "abstraction"이란 순전히 프로토콜 관점에서 붙여진 이름으로, 현재 프로토콜 레벨에 있는(즉 EOA에 통합된) 계정으로부터
"추출"하자는 뜻이라고 합니다("The Road to Account Abstraction", WalletCon in 2023). 


* 알케미 블로그에 실린 [계정 추상화](https://www.alchemy.com/blog/account-abstraction)에 대한 번역입니다. 

  1. [Part 1: You Could Have Invented Account Abstraction](./docs/1.md)
  2. [Part 2: Sponsoring Transactions Using Paymasters](./docs/2.md)
  3. [Part 3: Wallet Creation](./docs/3.md)
  4. [Part 4: Aggregate Signatures](./docs/4.md)

* ERC-4337 
  1. [표준(요약)](./docs/eip-4337.md)
  2. 인터페이스  
     - [`IAccount`](./contracts/interfaces/IAccount.sol)
     - [`IAggregator`](./contracts/interfaces/IAggregator.sol)
     - [`IEntryPoint`](./contracts/interfaces/IEntryPoint.sol)
     - [`IPaymaster`](./contracts/interfaces/IPaymaster.sol)
     - [`IStakeManager`](./contracts/interfaces/IStakeManager.sol)
     - [`UserOperation`](./contracts/interfaces/UserOperation.sol)
  3. 구현 예제
     - [SimpleAccount](./docs/sample-account.md)