# Informe de arquitectura

El informe se mantiene como fuente LaTeX en `reporte.tex`. Las figuras PNG y modelos BPMN 2.0 editables están en `diagramas/`; los modelos BPMN pueden abrirse y editarse con el modelador de bpmn.io.

## Compilar localmente

Se requiere Tectonic o una distribución LaTeX con paquetes estándar. Desde esta carpeta:

```powershell
tectonic .\reporte.tex --outdir ..\..\output\pdf
```

El PDF actualizado se genera en `output/pdf/reporte.pdf`. El archivo `output/pdf/arquitectura_banca_digital_bp.pdf` es una versión anterior.

## Figuras

Para regenerar las figuras con Python y Matplotlib:

```powershell
python .\generar_figuras.py
```

Los dos archivos `.bpmn` son los modelos fuente editables; los PNG incluidos en el informe son sus representaciones visuales.
