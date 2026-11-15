$ErrorActionPreference = 'Stop'
$apiPath = Join-Path $PSScriptRoot '..\api'
$databasePath = Join-Path $env:TEMP ("bp-test-{0}.sqlite" -f [Guid]::NewGuid().ToString('N'))
$stdoutLog = "$databasePath.stdout.log"
$stderrLog = "$databasePath.stderr.log"
$portProbe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$portProbe.Start()
$port = ([System.Net.IPEndPoint]$portProbe.LocalEndpoint).Port
$portProbe.Stop()
$baseUrl = "http://127.0.0.1:$port"
$results = [System.Collections.Generic.List[string]]::new()
$process = $null
$client = [System.Net.Http.HttpClient]::new()
$previousEnvironment = @{
    ASPNETCORE_ENVIRONMENT = $env:ASPNETCORE_ENVIRONMENT
    Authentication__EnableLocalDevelopmentIdentity = $env:Authentication__EnableLocalDevelopmentIdentity
    Banking__DatabasePath = $env:Banking__DatabasePath
}

function Send-ApiRequest([string]$method, [string]$path, $body = $null) {
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($method), "$baseUrl$path")
    if ($null -ne $body) {
        $json = ConvertTo-Json -InputObject $body -Depth 10 -Compress
        $request.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, 'application/json')
    }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $payload = $null
    try { $payload = ConvertFrom-Json -InputObject $content } catch { }
    $requestId = $null
    if ($response.Headers.Contains('X-Request-Id')) { $requestId = $response.Headers.GetValues('X-Request-Id') | Select-Object -First 1 }
    $result = [pscustomobject]@{
        Status = [int]$response.StatusCode
        ContentType = $response.Content.Headers.ContentType.MediaType
        RequestId = $requestId
        Location = $response.Headers.Location
        Body = $payload
    }
    $response.Dispose()
    $request.Dispose()
    return $result
}

function Assert-Status($result, [int]$expected, [string]$name) {
    if ($result.Status -ne $expected) { throw "${name}: esperado HTTP $expected, recibido HTTP $($result.Status). $($result.Body | ConvertTo-Json -Compress -Depth 5)" }
    $results.Add("PASS HTTP $expected - $name")
}

function Assert-Problem($result, [int]$expected, [string]$name) {
    Assert-Status $result $expected $name
    if ($result.ContentType -ne 'application/problem+json' -or [string]::IsNullOrWhiteSpace($result.Body.code) -or [string]::IsNullOrWhiteSpace($result.Body.traceId) -or [string]::IsNullOrWhiteSpace($result.RequestId)) {
        throw "${name}: faltan Problem Details. contentType=$($result.ContentType), requestId=$($result.RequestId), body=$($result.Body | ConvertTo-Json -Compress -Depth 5)"
    }
}

try {
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:Authentication__EnableLocalDevelopmentIdentity = 'true'
    $env:Banking__DatabasePath = $databasePath
    $process = Start-Process -FilePath 'dotnet' -ArgumentList @('bin\Debug\net10.0\api.dll', '--urls', $baseUrl) -WorkingDirectory $apiPath -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog

    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($process.HasExited) { throw "La API terminó al iniciar (exit $($process.ExitCode))." }
        try {
            $health = Send-ApiRequest 'GET' '/health'
            if ($health.Status -eq 200) { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $ready) { throw 'La API no respondió en el tiempo permitido.' }

    Assert-Status $health 200 'health check'
    if ([string]::IsNullOrWhiteSpace($health.RequestId)) { throw 'El health check no incluye X-Request-Id.' }
    $webApp = Send-ApiRequest 'GET' '/'
    Assert-Status $webApp 200 'carga de la SPA'
    if ($webApp.ContentType -ne 'text/html') { throw "La ruta raíz debe servir HTML, no $($webApp.ContentType)." }

    $customer = Send-ApiRequest 'GET' '/api/customer'
    $accounts = Send-ApiRequest 'GET' '/api/accounts'
    $movements = Send-ApiRequest 'GET' '/api/movements'
    $notifications = Send-ApiRequest 'GET' '/api/notifications'
    Assert-Status $customer 200 'consulta de cliente'
    Assert-Status $accounts 200 'consulta de cuentas'
    Assert-Status $movements 200 'consulta de movimientos'
    Assert-Status $notifications 200 'consulta de notificaciones'
    if ($accounts.Body.Count -lt 2 -or $movements.Body.Count -lt 1) { throw 'La API no devolvió productos y actividad de cuenta.' }

    Assert-Problem (Send-ApiRequest 'GET' '/api/audit') 403 'auditoría sin rol de operaciones'
    Assert-Problem (Send-ApiRequest 'GET' '/api/not-an-endpoint') 404 'ruta API desconocida'
    Assert-Problem (Send-ApiRequest 'POST' '/api/onboarding/face-verification/sessions' @{ consent = $false }) 400 'verificación facial sin consentimiento'
    Assert-Problem (Send-ApiRequest 'POST' '/api/onboarding/face-verification/sessions' @{ consent = $true }) 503 'verificación facial bloqueada hasta configurar proveedor'

    $invalid = @{ sourceAccountId = 'ACC-001'; destinationType = 'OWN'; destinationAccountId = 'ACC-002'; amount = 3000; idempotencyKey = 'no-guid' }
    Assert-Problem (Send-ApiRequest 'POST' '/api/transfers' $invalid) 400 'monto y clave inválidos'

    $sqlInjection = @{ sourceAccountId = "ACC-001' OR 1=1--"; destinationType = 'OWN'; destinationAccountId = 'ACC-002'; amount = 5; idempotencyKey = [Guid]::NewGuid().ToString() }
    Assert-Problem (Send-ApiRequest 'POST' '/api/transfers' $sqlInjection) 400 'entrada tipo SQL injection'

    $xss = @{ sourceAccountId = 'ACC-001'; destinationType = 'INTERBANK'; recipientName = '<script>alert(1)</script>'; recipientBank = 'Banco Andino'; destinationAccountNumber = '123456789'; amount = 5; idempotencyKey = [Guid]::NewGuid().ToString() }
    Assert-Problem (Send-ApiRequest 'POST' '/api/transfers' $xss) 400 'nombre de beneficiario tipo XSS'

    $key = [Guid]::NewGuid().ToString()
    $ownTransfer = @{ sourceAccountId = 'ACC-001'; destinationType = 'OWN'; destinationAccountId = 'ACC-002'; amount = 10; description = 'Prueba de transferencia'; idempotencyKey = $key }
    $accepted = Send-ApiRequest 'POST' '/api/transfers' $ownTransfer
    Assert-Status $accepted 202 'transferencia propia aceptada'
    if ($accepted.Body.status -ne 'PENDING' -or [string]::IsNullOrWhiteSpace($accepted.Body.id) -or $null -eq $accepted.Location) { throw 'La transferencia 202 no devolvió estado inicial, identificador y Location.' }

    $duplicate = Send-ApiRequest 'POST' '/api/transfers' $ownTransfer
    Assert-Status $duplicate 200 'reintento idempotente'
    if (-not $duplicate.Body.duplicate -or $duplicate.Body.id -ne $accepted.Body.id) { throw 'El reintento no devolvió la misma operación.' }

    $completed = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        $transfers = Send-ApiRequest 'GET' '/api/transfers'
        $completedTransfer = $transfers.Body | Where-Object id -EQ $accepted.Body.id | Select-Object -First 1
        if ($completedTransfer.status -eq 'COMPLETED') { $completed = $true; break }
    }
    if (-not $completed) { throw 'La transferencia propia no avanzó a COMPLETED mediante el worker.' }
    $results.Add('PASS worker actualizó la transferencia propia')
    $updatedAccounts = Send-ApiRequest 'GET' '/api/accounts'
    $sourceBalance = ($updatedAccounts.Body | Where-Object id -EQ 'ACC-001' | Select-Object -First 1).balance
    $destinationBalance = ($updatedAccounts.Body | Where-Object id -EQ 'ACC-002' | Select-Object -First 1).balance
    if ($sourceBalance -ne 4240 -or $destinationBalance -ne 1875) { throw "La transferencia no actualizó los saldos esperados. Origen=$sourceBalance, destino=$destinationBalance." }
    $results.Add('PASS los saldos de origen y destino se actualizaron')
    $updatedMovements = Send-ApiRequest 'GET' '/api/movements'
    if ($updatedMovements.Body.Count -lt 7) { throw 'No se registraron los dos movimientos de la transferencia.' }
    $results.Add('PASS la transferencia generó movimientos para ambas cuentas')
    $updatedNotifications = Send-ApiRequest 'GET' '/api/notifications'
    if (-not ($updatedNotifications.Body | Where-Object title -EQ 'Transferencia completada')) { throw 'No se generó una notificación para la transferencia completada.' }
    $results.Add('PASS se generó la notificación de transferencia')

    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Wait-Process -Id $process.Id -Timeout 10 -ErrorAction SilentlyContinue
    $process = $null
    $process = Start-Process -FilePath 'dotnet' -ArgumentList @('bin\Debug\net10.0\api.dll', '--urls', $baseUrl) -WorkingDirectory $apiPath -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($process.HasExited) { throw "La API terminó al reiniciar (exit $($process.ExitCode))." }
        try {
            $health = Send-ApiRequest 'GET' '/health'
            if ($health.Status -eq 200) { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $ready) { throw 'La API no respondió después de reiniciarla.' }

    $interbank = @{ sourceAccountId = 'ACC-001'; destinationType = 'INTERBANK'; recipientName = 'Ana Pérez'; recipientBank = 'Banco Andino'; destinationAccountNumber = '123456789'; amount = 5; idempotencyKey = [Guid]::NewGuid().ToString() }
    $interbankAccepted = Send-ApiRequest 'POST' '/api/transfers' $interbank
    Assert-Status $interbankAccepted 202 'transferencia interbancaria aceptada'
    Start-Sleep -Seconds 3
    $interbankState = Send-ApiRequest 'GET' "/api/transfers/$($interbankAccepted.Body.id)"
    Assert-Status $interbankState 200 'consulta de estado interbancario'
    if ($interbankState.Body.status -ne 'PENDING') { throw 'Una transferencia interbancaria no debe completarse sin confirmación del proveedor.' }
    $results.Add('PASS transferencia interbancaria espera confirmación externa')

    $precision = @{ sourceAccountId = 'ACC-001'; destinationType = 'OWN'; destinationAccountId = 'ACC-002'; amount = 1.005; idempotencyKey = [Guid]::NewGuid().ToString() }
    Assert-Problem (Send-ApiRequest 'POST' '/api/transfers' $precision) 400 'monto con más de dos decimales'

    $invalidRequest = @{ sourceAccountId = 'ACC-001'; destinationType = 'OWN'; destinationAccountId = 'ACC-002'; amount = 0; idempotencyKey = [Guid]::NewGuid().ToString() }
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        Assert-Problem (Send-ApiRequest 'POST' '/api/transfers' $invalidRequest) 400 "validación antes del límite $attempt"
    }
    Assert-Problem (Send-ApiRequest 'POST' '/api/transfers' $invalidRequest) 429 'límite de solicitudes'

    $results | ForEach-Object { Write-Output $_ }
    Write-Output "Resultado: $($results.Count) comprobaciones aprobadas."
}
catch {
    if (Test-Path $stdoutLog) { Get-Content $stdoutLog -Tail 30 | ForEach-Object { Write-Output $_ } }
    if (Test-Path $stderrLog) { Get-Content $stderrLog -Tail 30 | ForEach-Object { Write-Output $_ } }
    throw
}
finally {
    $client.Dispose()
    if ($null -ne $process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $databasePath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath "$databasePath-shm" -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath "$databasePath-wal" -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stdoutLog -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stderrLog -Force -ErrorAction SilentlyContinue
    foreach ($name in $previousEnvironment.Keys) {
        $oldValue = $previousEnvironment[$name]
        if ($null -eq $oldValue) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
        else { Set-Item "Env:$name" $oldValue }
    }
}
