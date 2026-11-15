# Estimacion provisional de costos AWS

Este documento presenta un escenario para discutir y graficar; no reemplaza la estimacion compartible de AWS Pricing Calculator. No hay servicios desplegados ni una cotizacion aprobada.

## Escenario de referencia

- Region: `us-east-1` (N. Virginia), pendiente de validar por residencia de datos y latencia.
- Baja demanda: 1.000 MAU, 10.000 solicitudes HTTP API, 100 sesiones de verificacion facial y 10.000 correos/mes.
- API: dos tareas Linux/x86 Fargate, cada una con 0.5 vCPU y 1 GB, 730 horas al mes.
- Red y disponibilidad: un ALB con 1 LCU promedio; dos NAT Gateways; 20 GB de procesamiento NAT; cuatro IPv4 publicas entre NAT y ALB.
- Datos: RDS PostgreSQL `db.t4g.small` Multi-AZ, 20 GB gp3 por nodo; DynamoDB bajo demanda con 80.000 lecturas, 20.000 escrituras y 5 GB; S3 Standard 20 GB-mes.
- Integraciones y operaciones: WAF con una ACL y tres reglas, 20.000 solicitudes SQS, 10.000 notificaciones SNS, 5 GB de logs y tres secretos.

Con las tarifas publicas consultadas el 15 de noviembre de 2026, el escenario Multi-AZ queda en aproximadamente **USD 251.21 al mes** bajo los supuestos anteriores. El desglose reproducible esta en [aws-estimate-assumptions.csv](aws-estimate-assumptions.csv). La estimacion no incluye impuestos, soporte, egreso general a Internet, trafico/solicitudes que excedan los supuestos, copias de seguridad fuera de la asignacion, retencion adicional, grupos WAF administrados, SMS, rotacion de secretos, soporte de guardia ni DR en una segunda region.

## Sensibilidad de red

Una alternativa con un NAT Gateway queda aproximadamente en **USD 214.71/mes**, considerando una IPv4 de NAT, dos IPv4 del ALB y el mismo procesamiento de 20 GB. Esa alternativa ahorra unos USD 36.50, pero concentra la salida de dos zonas en un solo NAT y reduce la tolerancia a fallos. Para el modelo HA se conserva el escenario de dos NAT.

## Lectura de los niveles incluidos

Cognito, SQS, SNS, CloudFront, CloudWatch, CloudTrail y el almacenamiento de DynamoDB muestran cero cuando se asume que aplican sus asignaciones incluidas y no se consumen en otra carga de la cuenta. Confirmar los terminos vigentes y elegibilidad de la cuenta en AWS Pricing Calculator. CloudFront supone hasta 1 TB y 10 millones de solicitudes; CloudWatch supone hasta 5 GB de logs al mes. El descuento de nuevos clientes/creditos no se resta del total.

La referencia para RDS usa un precio publico provisional de instancia `db.t4g.small` Multi-AZ y gp3 replicado, y requiere validacion final en Calculator. El dimensionamiento es de presupuesto preliminar, no una recomendacion de capacidad para produccion. El cambio a una instancia mayor, IO, CPU burstable, backups, IPv4, salida a Internet y alarmas pueden elevar el costo.

## Fuentes oficiales y calculadora

- [AWS Pricing Calculator](https://calculator.aws/)
- [Amazon ECS / Fargate](https://aws.amazon.com/fargate/pricing/)
- [Application Load Balancer](https://aws.amazon.com/elasticloadbalancing/pricing/)
- [RDS para PostgreSQL](https://aws.amazon.com/rds/postgresql/pricing/)
- [AWS WAF](https://aws.amazon.com/waf/pricing/)
- [Amazon VPC, NAT e IPv4 publica](https://aws.amazon.com/vpc/pricing/)
- [Cognito](https://aws.amazon.com/cognito/pricing/)
- [API Gateway](https://aws.amazon.com/api-gateway/pricing/)
- [DynamoDB](https://aws.amazon.com/dynamodb/pricing/)
- [SQS](https://aws.amazon.com/sqs/pricing/)
- [Rekognition Face Liveness](https://aws.amazon.com/rekognition/pricing/)
- [SNS](https://aws.amazon.com/sns/pricing/)
- [SES](https://aws.amazon.com/ses/pricing/)
- [S3](https://aws.amazon.com/s3/pricing/)
- [CloudFront](https://aws.amazon.com/cloudfront/pricing/)
- [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/)
- [Secrets Manager](https://aws.amazon.com/secrets-manager/pricing/)

El siguiente paso es revisar estas cantidades juntos en AWS Pricing Calculator y guardar su enlace compartible. DR sigue como escenario separado hasta definir RTO/RPO.
