# Estimación de costos AWS — pendiente

El diseño base ya está documentado. A solicitud del usuario, la estimación se completará conjuntamente en AWS Pricing Calculator; este documento no contiene cotización ni subtotal inventado.

## Supuestos provisionales para completar después

- Región de referencia: `us-east-1` (N. Virginia); validar jurisdicción, residencia de datos y latencia antes de producción.
- Dos clientes frontales comparten backend; no duplicar los servicios backend por plataforma.
- Mantener dos zonas de disponibilidad en el escenario base.
- Incluir API Gateway, WAF, ECS Fargate, balanceador/VPC Link, RDS Multi-AZ, DynamoDB, SQS/EventBridge, S3/CloudFront, CloudWatch, respaldos, transferencia y salida a Internet.
- Comparar al menos MVP de baja demanda y crecimiento; indicar solicitudes, GB, tareas, almacenamiento y retención por mes.
- Costos de DR regional y proveedores externos deben aparecer como partidas separadas.

## Próximo cálculo

Completar los servicios y cantidades en [AWS Pricing Calculator](https://calculator.aws/), guardar la estimación compartible y luego dibujar el gráfico. No reutilizar el subtotal preliminar de la conversación como cotización final: faltan RDS y otras partidas importantes.
