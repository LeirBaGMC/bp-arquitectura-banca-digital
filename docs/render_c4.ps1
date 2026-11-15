$ErrorActionPreference = "Stop"
$sourceDirectory = Join-Path $PSScriptRoot "diagramas"
$outputDirectory = Join-Path $PSScriptRoot "reporte\diagramas"
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$dotCommand = Get-Command dot -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source
if (-not $dotCommand) {
    $dotCandidates = @(
        (Join-Path $env:ProgramFiles "Graphviz\bin\dot.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Graphviz\bin\dot.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\Graphviz\bin\dot.exe")
    )
    $dotCommand = $dotCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $dotCommand) {
    throw "No encontré dot.exe. Winget indica Graphviz instalado, pero revisa su carpeta de instalación o reinstálalo."
}
$diagrams = "c4-contexto", "c4-contenedores", "c4-componentes", "c4-despliegue", "c4-recuperacion"
foreach ($diagram in $diagrams) {
    $source = Join-Path $sourceDirectory "$diagram.dot"
    & $dotCommand -Tpdf $source -o (Join-Path $outputDirectory "$diagram.pdf")
    if ($LASTEXITCODE -ne 0) { throw "Graphviz falló al crear $diagram.pdf" }
    & $dotCommand -Tpng -Gdpi=220 $source -o (Join-Path $outputDirectory "$diagram.png")
    if ($LASTEXITCODE -ne 0) { throw "Graphviz falló al crear $diagram.png" }
}
Write-Host "Diagramas C4 vectoriales PDF y PNG regenerados."
