param(
  [string]$proxy,
  [string]$impl
)

if (-not $PSBoundParameters.ContainsKey('proxy')) {
  Write-Host "Missing parameter: proxy"
  exit 1
}

if (-not $PSBoundParameters.ContainsKey('impl')) {
  Write-Host "Missing parameter: impl"
  exit 1
}


npx hardhat verify $impl --constructor-args args.js --network sepolia
npx hardhat verify $proxy --network sepolia


