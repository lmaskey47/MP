param(
    [ValidateSet('Check', 'Database', 'Api', 'Metro', 'Android', 'Build', 'Seed', 'Test')]
    [string]$Mode = 'Check'
)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$nodePath = Join-Path $projectRoot '.tools\node_modules\node\bin\node.exe'
if (!(Test-Path -LiteralPath $nodePath)) {
    throw 'Node local absent. Depuis ce dossier, exécuter : npm install --prefix .tools node@24'
}
$env:Path = (Split-Path -Parent $nodePath) + ';' + $env:Path
$apiDirectory = Join-Path $projectRoot 'TP3-M2-APi'
$frontDirectory = Join-Path $projectRoot 'TP3-M2-Front'
function Invoke-NodeChecked {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$NodeArguments)
    & $nodePath @NodeArguments
    if ($LASTEXITCODE -ne 0) { throw "La commande Node a échoué (code $LASTEXITCODE)." }
}
function Set-AndroidEnvironment {
    if (!$env:ANDROID_HOME) {
        $sdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
        if (Test-Path -LiteralPath $sdkPath) { $env:ANDROID_HOME = $sdkPath }
    }
    if (!$env:JAVA_HOME) {
        $javaPath = 'C:\Program Files\Android\Android Studio\jbr'
        if (Test-Path -LiteralPath $javaPath) { $env:JAVA_HOME = $javaPath }
    }
    if ($env:JAVA_HOME) { $env:Path = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:Path }
    if ($env:ANDROID_HOME) {
        $env:Path = (Join-Path $env:ANDROID_HOME 'platform-tools') + ';' + (Join-Path $env:ANDROID_HOME 'emulator') + ';' + $env:Path
    }
}
Push-Location $projectRoot
try {
    switch ($Mode) {
        'Check' {
            Invoke-NodeChecked -NodeArguments @('--version')
            Push-Location $apiDirectory
            try { Invoke-NodeChecked -NodeArguments @('node_modules/typescript/bin/tsc','--noEmit') } finally { Pop-Location }
            Push-Location $frontDirectory
            try {
                Invoke-NodeChecked -NodeArguments @('node_modules/typescript/bin/tsc','--noEmit')
                Invoke-NodeChecked -NodeArguments @('node_modules/eslint/bin/eslint.js','.')
                Invoke-NodeChecked -NodeArguments @('node_modules/jest/bin/jest.js','--runInBand')
            } finally { Pop-Location }
            Set-AndroidEnvironment
            Write-Host "SDK Android détecté : $([bool]$env:ANDROID_HOME)"
            Write-Host "Java détecté : $([bool](Get-Command java -ErrorAction SilentlyContinue))"
        }
        'Database' {
            $existing = docker ps -a --filter 'name=^/logichain-mongodb$' --format '{{.Names}}'
            if ($LASTEXITCODE -ne 0) { throw 'Démarrer Docker Desktop puis relancer cette commande.' }
            if ($existing -eq 'logichain-mongodb') {
                docker start logichain-mongodb
            } else {
                Push-Location $apiDirectory
                try { docker compose up -d } finally { Pop-Location }
            }
            if ($LASTEXITCODE -ne 0) { throw 'MongoDB ne peut pas démarrer.' }
        }
        'Api' {
            Set-Location $apiDirectory
            Invoke-NodeChecked -NodeArguments @('node_modules/typescript/bin/tsc')
            Invoke-NodeChecked -NodeArguments @('dist/server.js')
        }
        'Metro' {
            Set-Location $frontDirectory
            Invoke-NodeChecked -NodeArguments @('node_modules/react-native/cli.js','start')
        }
        'Build' {
            Set-AndroidEnvironment
            if (!$env:ANDROID_HOME -or !(Get-Command java -ErrorAction SilentlyContinue)) { throw 'Installer le SDK Android et Java avant la compilation.' }
            Set-Location (Join-Path $frontDirectory 'android')
            & .\gradlew.bat :app:assembleDebug --no-daemon
            if ($LASTEXITCODE -ne 0) { throw 'La compilation Android a échoué.' }
            Write-Host ('APK : ' + (Join-Path $frontDirectory 'android\app\build\outputs\apk\debug\app-debug.apk'))
        }
        'Android' {
            Set-AndroidEnvironment
            if (!$env:ANDROID_HOME -or !(Get-Command java -ErrorAction SilentlyContinue)) { throw 'Installer Android Studio, son SDK et Java avant le lancement Android.' }
            Set-Location $frontDirectory
            Invoke-NodeChecked -NodeArguments @('node_modules/react-native/cli.js','run-android','--no-packager')
        }
        'Seed' {
            Set-Location $apiDirectory
            Invoke-NodeChecked -NodeArguments @('node_modules/typescript/bin/tsc')
            Invoke-NodeChecked -NodeArguments @('scripts/seed-demo.js')
        }
        'Test' {
            Set-Location $apiDirectory
            Invoke-NodeChecked -NodeArguments @('node_modules/typescript/bin/tsc')
            Invoke-NodeChecked -NodeArguments @('scripts/test-mobile.cjs')
        }
    }
} finally { Pop-Location }
