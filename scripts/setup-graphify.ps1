$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolRoot = Join-Path $projectRoot '.tools\graphify'
$uvPath = Join-Path $toolRoot 'uv.exe'
$pythonPath = Join-Path $toolRoot 'venv\Scripts\python.exe'
$graphifyPath = Join-Path $toolRoot 'venv\Scripts\graphify.exe'
$env:UV_PYTHON_INSTALL_DIR = Join-Path $toolRoot 'python'
$env:UV_CACHE_DIR = Join-Path $toolRoot 'cache'
$env:UV_PYTHON_INSTALL_REGISTRY = 'false'
$env:PYTHONUTF8 = '1'

New-Item -ItemType Directory -Path $toolRoot -Force | Out-Null
if (-not (Test-Path -LiteralPath $uvPath)) {
    $archivePath = Join-Path $toolRoot 'uv.zip'
    & curl.exe --fail --location --retry 2 'https://github.com/astral-sh/uv/releases/download/0.13.6/uv-x86_64-pc-windows-msvc.zip' --output $archivePath
    if ($LASTEXITCODE -ne 0) { throw 'Cannot download uv from its official repository.' }
    Expand-Archive -LiteralPath $archivePath -DestinationPath $toolRoot -Force
}
if (-not (Test-Path -LiteralPath $pythonPath)) {
    & $uvPath venv (Join-Path $toolRoot 'venv') --python '3.12.16' --managed-python
    if ($LASTEXITCODE -ne 0) { throw 'Cannot create the project-local Python environment.' }
}
& $uvPath pip install --python $pythonPath --requirement (Join-Path $PSScriptRoot 'graphify-requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Graphify installation failed.' }
& $uvPath pip check --python $pythonPath
if ($LASTEXITCODE -ne 0) { throw 'Graphify dependency check failed.' }
& $graphifyPath --version
if ($LASTEXITCODE -ne 0) { throw 'Graphify executable check failed.' }
Write-Output 'Ready. Run npm.cmd run graph:build from the project root.'
