[CmdletBinding()]
param(
  [ValidateSet('web', 'headless', 'sdk')]
  [string]$Profile = 'web',
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$DshArguments
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $projectRoot '.tools\deepseek-runtime'
$nodePath = Join-Path $runtimeRoot 'node_modules\node-win-x64\bin\node.exe'
$cliPath = Join-Path $runtimeRoot 'node_modules\@deepseek-ai\dsh\lib\bin.js'
if (!(Test-Path -LiteralPath $nodePath) -or !(Test-Path -LiteralPath $cliPath)) {
  throw 'Harness runtime is missing. See docs/DEEPSEEK_HARNESS_SETUP.md.'
}
$previousPath = $env:PATH
$previousDshHome = $env:DSH_HOME
$exitCode = 1
Push-Location -LiteralPath $projectRoot
try {
  $env:PATH = (Split-Path -Parent $nodePath) + ';' + $previousPath
  $env:DSH_HOME = Join-Path $projectRoot '.tools\deepseek-state'
  & $nodePath $cliPath --profile $Profile @DshArguments
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
  $env:PATH = $previousPath
  $env:DSH_HOME = $previousDshHome
}
exit $exitCode
