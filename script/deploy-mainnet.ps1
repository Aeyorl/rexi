param(
  [string]$PrivateKey = $env:PRIVATE_KEY,
  [switch]$Yes = $false
)

$envFile = Join-Path (Get-Location) '.env'
if (Test-Path $envFile) {
  Get-Content $envFile | Where-Object { $_ -match '^\s*([^#=]+)\s*=\s*(.*)\s*$' } | ForEach-Object {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    if (-not [string]::IsNullOrWhiteSpace($value)) { Set-Item -Path "Env:$name" -Value $value }
  }
  if ([string]::IsNullOrWhiteSpace($PrivateKey)) { $PrivateKey = $env:PRIVATE_KEY }
}

if ([string]::IsNullOrWhiteSpace($PrivateKey)) {
  throw 'PRIVATE_KEY must be set in your .env file or passed via -PrivateKey.'
}

$protocol = $env:REXI_PROTOCOL_TREASURY
$desks = $env:REXI_DESKS_TREASURY
$buyback = $env:REXI_BUYBACK_TREASURY

if ([string]::IsNullOrWhiteSpace($protocol) -or [string]::IsNullOrWhiteSpace($desks) -or [string]::IsNullOrWhiteSpace($buyback)) {
  throw 'Please set REXI_PROTOCOL_TREASURY, REXI_DESKS_TREASURY, and REXI_BUYBACK_TREASURY in your .env file.'
}

$rpcUrl = $env:RH_MAINNET_RPC_URL
if ([string]::IsNullOrWhiteSpace($rpcUrl)) { $rpcUrl = 'https://rpc.chain.robinhood.com' }

$chainId = $env:RH_MAINNET_CHAIN_ID
if ([string]::IsNullOrWhiteSpace($chainId)) { $chainId = '4663' }

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  REXI LAUNCHPAD MAINNET DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Network:          Robinhood Chain Mainnet"
Write-Host "Chain ID:         $chainId"
Write-Host "RPC Endpoint:     $rpcUrl"
Write-Host "Protocol Treasury: $protocol"
Write-Host "Desks Treasury:    $desks"
Write-Host "Buyback Treasury:  $buyback"
Write-Host "================================================="

$forgeArgs = @(
  'create', 'contracts/RexiLaunchpad.sol:RexiLaunchpad',
  '--rpc-url', $rpcUrl,
  '--chain-id', $chainId,
  '--private-key', $PrivateKey,
  '--broadcast',
  '--constructor-args', $protocol, $desks, $buyback
)

Write-Host "Broadcasting transaction to Mainnet via Foundry forge..." -ForegroundColor Yellow
& forge @forgeArgs

if ($LASTEXITCODE -ne 0) {
  throw "Forge mainnet deployment failed with exit code $LASTEXITCODE."
}

Write-Host "`nSUCCESS! RexiLaunchpad deployed to Mainnet." -ForegroundColor Green
Write-Host "Next step: Copy the 'Deployed to:' address above and set it as REXI_LAUNCHPAD_MAINNET in .env." -ForegroundColor Green
