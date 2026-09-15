param([string]$PrivateKey = $env:PRIVATE_KEY)

$envFile = Join-Path (Get-Location) '.env'
if (Test-Path $envFile) {
  Get-Content $envFile | Where-Object { $_ -match '^\s*([^#=]+)\s*=\s*(.*)\s*$' } | ForEach-Object {
    $name = $matches[1].Trim(); $value = $matches[2].Trim().Trim('"')
    if (-not [string]::IsNullOrWhiteSpace($value)) { Set-Item -Path "Env:$name" -Value $value }
  }
  if ([string]::IsNullOrWhiteSpace($PrivateKey)) { $PrivateKey = $env:PRIVATE_KEY }
}
if ([string]::IsNullOrWhiteSpace($PrivateKey) -or $PrivateKey -eq 'PASTE_NEW_THROWAWAY_TESTNET_KEY_HERE') { throw 'Paste a funded testnet key into .env as PRIVATE_KEY.' }
$rpcUrl = $env:RH_RPC_URL; if ([string]::IsNullOrWhiteSpace($rpcUrl)) { $rpcUrl = 'https://rpc.testnet.chain.robinhood.com' }
$chainId = $env:RH_CHAIN_ID; if ([string]::IsNullOrWhiteSpace($chainId)) { $chainId = '46630' }
$args = @('create','contracts/RexiLaunchpad.sol:RexiTestStockToken','--rpc-url',$rpcUrl,'--chain-id',$chainId,'--private-key',$PrivateKey,'--broadcast')
& forge @args
if ($LASTEXITCODE -ne 0) { throw "Forge deployment failed with exit code $LASTEXITCODE." }
