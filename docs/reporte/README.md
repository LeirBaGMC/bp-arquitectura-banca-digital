# Informe de arquitectura

El informe se mantiene como fuente LaTeX en `reporte.tex`. Las figuras C4 vectoriales y raster se generan desde fuentes Graphviz DOT. Las figuras PNG y modelos BPMN 2.0 editables están en `diagramas/`; los modelos BPMN pueden abrirse y editarse con el modelador de bpmn.io.

## Compilar localmente

Se requiere MiKTeX y Graphviz. En Windows, se pueden instalar con:
```powershell
winget install --id MiKTeX.MiKTeX -e
winget install --id Graphviz.Graphviz -e
```
Reinicia la terminal para actualizar el PATH.

Desde la raíz del repositorio, ejecuta este bloque completo. Primero genera los diagramas C4 y luego compila el informe dos veces para actualizar las referencias:

```powershell
.\docs\render_c4.ps1
New-Item -ItemType Directory -Force .\output\pdf | Out-Null
$outDir = (Resolve-Path .\output\pdf).Path
Push-Location .\docs\reporte
try {
    & pdflatex -interaction=nonstopmode -halt-on-error "-output-directory=$outDir" .\reporte.tex
    if ($LASTEXITCODE -ne 0) { throw 'Falló la primera compilación de pdflatex.' }
    & pdflatex -interaction=nonstopmode -halt-on-error "-output-directory=$outDir" .\reporte.tex
    if ($LASTEXITCODE -ne 0) { throw 'Falló la segunda compilación de pdflatex.' }
}
finally {
    Pop-Location
}
```

El PDF actualizado se genera en `output/pdf/reporte.pdf`. El archivo `output/pdf/arquitectura_banca_digital_bp.pdf` es una versión anterior.

## Figuras

Para regenerar las figuras de costos, BPMN y riesgos con Python y Matplotlib (los C4 se generan con Graphviz):

```powershell
python .\generar_figuras.py
```

Los archivos `.bpmn` son los modelos BPMN 2.0 editables. Los C4 se mantienen en Graphviz DOT y se exportan como PDF vectorial para el informe.
