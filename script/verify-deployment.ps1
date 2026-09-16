# Verifies that the RexiLaunchpad deployed on Robinhood Chain Testnet was built
# from this repository's contract source.
#
#   powershell -ExecutionPolicy Bypass -File script/verify-deployment.ps1
#
# The immutable constructor values (the three treasury addresses) are masked out
# of the on-chain copy before comparing, because the compiler leaves zero
# placeholders for them in the locally built artifact.

$ErrorActionPreference = 'Stop'

$envFile = Join-Path (Get-Location) '.env'
if (Test-Path $envFile) {
  Get-Content $envFile | Where-Object { $_ -match '^\s*([^#=]+)\s*=\s*(.*)\s*$' } | ForEach-Object {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    if (-not [string]::IsNullOrWhiteSpace($value)) { Set-Item -Path "Env:$name" -Value $value }
  }
}

$deploymentsFile = Join-Path (Get-Location) 'src/services/deployments.js'
if (-not (Test-Path $deploymentsFile)) { throw 'src/services/deployments.js not found.' }
$deployments = Get-Content $deploymentsFile -Raw

$address = $env:REXI_LAUNCHPAD_TESTNET
if ([string]::IsNullOrWhiteSpace($address)) {
  if ($deployments -match "export const REXI_LAUNCHPAD = '(0x[0-9a-fA-F]{40})'") {
    $address = $matches[1]
  } else {
    throw 'Could not read REXI_LAUNCHPAD from src/services/deployments.js.'
  }
}

$rpcUrl = $env:RH_RPC_URL
if ([string]::IsNullOrWhiteSpace($rpcUrl)) { $rpcUrl = 'https://rpc.testnet.chain.robinhood.com' }

Write-Host "Verifying RexiLaunchpad at $address"

& forge build
if ($LASTEXITCODE -ne 0) { throw "forge build failed with exit code $LASTEXITCODE." }

$local = (& forge inspect contracts/RexiLaunchpad.sol:RexiLaunchpad deployedBytecode).Trim().ToLower()
$onchain = (& cast code $address --rpc-url $rpcUrl).Trim().ToLower()

if ([string]::IsNullOrWhiteSpace($onchain) -or $onchain -eq '0x') {
  throw "No contract code found at $address."
}

$masked = $onchain
foreach ($treasury in @($env:REXI_PROTOCOL_TREASURY, $env:REXI_DESKS_TREASURY, $env:REXI_BUYBACK_TREASURY)) {
  if ([string]::IsNullOrWhiteSpace($treasury)) { continue }
  $needle = $treasury.ToLower().Replace('0x', '')
  if ($masked.Contains($needle)) { $masked = $masked.Replace($needle, ('0' * 40)) }
}

Write-Host "local runtime length  : $($local.Length)"
Write-Host "onchain runtime length: $($masked.Length)"

if ($masked -eq $local) {
  Write-Host 'PASS: deployed runtime code matches this repository build (immutables masked).'
  exit 0
}

Write-Host 'FAIL: deployed runtime code differs from this repository build.'
exit 1