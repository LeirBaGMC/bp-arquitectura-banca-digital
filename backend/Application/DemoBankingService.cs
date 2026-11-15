using Microsoft.Data.Sqlite;
using System.Text.RegularExpressions;

public sealed class DemoBankingService(DemoDatabase database, ILogger<DemoBankingService> logger)
{
    // Current queries target the local SQLite adapter. Move this persistence boundary to a PostgreSQL repository and versioned migrations during AWS onboarding.
    private static readonly HashSet<string> SupportedBanks = ["Banco Andino", "Cooperativa Sol", "Banco del Centro"];
    private static readonly Regex ValidRecipientName = new("^[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]{0,99}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex ValidAccountNumber = new("^\\d{6,20}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public async Task<object?> GetCustomerAsync(string customerId)
    {
        await using var connection = await database.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id,name,email,segment,updated_at FROM customers WHERE id=$id";
        command.Parameters.AddWithValue("$id", customerId);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync()
            ? new { id = reader.GetString(0), name = reader.GetString(1), email = reader.GetString(2), segment = reader.GetString(3), updatedAt = reader.GetString(4) }
            : null;
    }

    public async Task<IReadOnlyList<object>> GetAccountsAsync(string customerId)
    {
        await using var connection = await database.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, alias, kind, masked_number, balance_cents, currency FROM accounts WHERE customer_id=$customer ORDER BY id";
        command.Parameters.AddWithValue("$customer", customerId);
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new List<object>();
        while (await reader.ReadAsync()) rows.Add(new { id = reader.GetString(0), alias = reader.GetString(1), kind = reader.GetString(2), number = reader.GetString(3), balance = reader.GetInt64(4) / 100m, currency = reader.GetString(5) });
        return rows;
    }

    public async Task<IReadOnlyList<object>> GetMovementsAsync(string customerId)
    {
        await using var connection = await database.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT m.id, m.account_id, a.alias, m.title, m.detail, m.amount_cents, m.direction, m.status, m.created_at FROM movements m JOIN accounts a ON a.id=m.account_id WHERE a.customer_id=$customer ORDER BY m.created_at DESC LIMIT 30";
        command.Parameters.AddWithValue("$customer", customerId);
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new List<object>();
        while (await reader.ReadAsync()) rows.Add(new { id = reader.GetInt64(0), accountId = reader.GetString(1), account = reader.GetString(2), title = reader.GetString(3), detail = reader.GetString(4), amount = reader.GetInt64(5) / 100m, direction = reader.GetString(6), status = reader.GetString(7), createdAt = reader.GetString(8) });
        return rows;
    }

    public async Task<IReadOnlyList<object>> GetTransfersAsync(string customerId)
    {
        await using var connection = await database.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, destination_type, recipient_name, recipient_bank, amount_cents, description, status, created_at FROM transfers WHERE customer_id=$customer ORDER BY created_at DESC LIMIT 10";
        command.Parameters.AddWithValue("$customer", customerId);
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new List<object>();
        while (await reader.ReadAsync()) rows.Add(new { id = reader.GetString(0), destinationType = reader.GetString(1), recipient = reader.GetString(2), bank = reader.GetString(3), amount = reader.GetInt64(4) / 100m, description = reader.GetString(5), status = reader.GetString(6), createdAt = reader.GetString(7) });
        return rows;
    }

    public async Task<object?> GetTransferAsync(string transferId, string customerId)
    {
        await using var connection = await database.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id,destination_type,recipient_name,recipient_bank,amount_cents,description,status,created_at FROM transfers WHERE id=$id AND customer_id=$customer";
        command.Parameters.AddWithValue("$id", transferId);
        command.Parameters.AddWithValue("$customer", customerId);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync()
            ? new { id = reader.GetString(0), destinationType = reader.GetString(1), recipient = reader.GetString(2), bank = reader.GetString(3), amount = reader.GetInt64(4) / 100m, description = reader.GetString(5), status = reader.GetString(6), createdAt = reader.GetString(7) }
            : null;
    }

    public async Task<IReadOnlyList<object>> GetNotificationsAsync(string customerId)
    {
        await using var connection = await database.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id, title, message, created_at, is_read FROM notifications WHERE customer_id=$customer ORDER BY created_at DESC LIMIT 10";
        command.Parameters.AddWithValue("$customer", customerId);
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new List<object>();
        while (await reader.ReadAsync()) rows.Add(new { id = reader.GetInt64(0), title = reader.GetString(1), message = reader.GetString(2), createdAt = reader.GetString(3), isRead = reader.GetInt64(4) == 1 });
        return rows;
    }

    public async Task<IReadOnlyList<object>> GetAuditAsync()
    {
        await using var connection = await database.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT id,actor,action,resource,result,created_at FROM audit_log ORDER BY created_at DESC LIMIT 50";
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new List<object>();
        while (await reader.ReadAsync()) rows.Add(new { id = reader.GetInt64(0), actor = reader.GetString(1), action = reader.GetString(2), resource = reader.GetString(3), result = reader.GetString(4), createdAt = reader.GetString(5) });
        return rows;
    }

    public async Task<TransferOutcome> CreateTransferAsync(TransferRequest request, string customerId)
    {
        if (request.Amount < 1m || request.Amount > 2500m)
            return TransferOutcome.BadRequest("El monto debe estar entre $1 y $2,500.");

        var exactCents = request.Amount * 100m;
        if (exactCents != decimal.Truncate(exactCents))
            return TransferOutcome.BadRequest("El monto solo puede incluir hasta dos decimales.");

        var cents = (long)exactCents;
        var sourceAccountId = request.SourceAccountId?.Trim();
        var destinationAccountId = request.DestinationAccountId?.Trim();
        var idempotencyKey = request.IdempotencyKey?.Trim();
        var destinationType = (request.DestinationType ?? "").Trim().ToUpperInvariant();
        if (destinationType is not ("OWN" or "INTERBANK")) return TransferOutcome.BadRequest("Selecciona una cuenta propia o una transferencia interbancaria.");
        if (string.IsNullOrWhiteSpace(sourceAccountId) || sourceAccountId.Length > 32) return TransferOutcome.BadRequest("Selecciona una cuenta de origen válida.");
        if (string.IsNullOrWhiteSpace(idempotencyKey) || !Guid.TryParse(idempotencyKey, out _)) return TransferOutcome.BadRequest("La clave de idempotencia no es válida.");
        if (destinationType == "OWN" && (string.IsNullOrWhiteSpace(destinationAccountId) || destinationAccountId.Length > 32 || destinationAccountId == sourceAccountId)) return TransferOutcome.BadRequest("Selecciona una cuenta propia distinta como destino.");
        if (destinationType == "INTERBANK")
        {
            var recipientName = request.RecipientName?.Trim() ?? string.Empty;
            var recipientBank = request.RecipientBank?.Trim() ?? string.Empty;
            var accountNumber = request.DestinationAccountNumber?.Trim() ?? string.Empty;
            if (!ValidRecipientName.IsMatch(recipientName) || !SupportedBanks.Contains(recipientBank) || !ValidAccountNumber.IsMatch(accountNumber))
                return TransferOutcome.BadRequest("Revisa el nombre, banco y número de cuenta del beneficiario.");
        }
        if (!string.IsNullOrWhiteSpace(request.Description) && (request.Description.Trim().Length > 120 || request.Description.Any(char.IsControl)))
            return TransferOutcome.BadRequest("La descripción debe tener hasta 120 caracteres y no contener caracteres de control.");


        await using var connection = await database.OpenAsync();
        using var transaction = connection.BeginTransaction();
        try
        {
            await using (var existing = connection.CreateCommand())
            {
                existing.Transaction = transaction;
                existing.CommandText = "SELECT id, status FROM transfers WHERE customer_id=$customer AND idempotency_key=$key";
                existing.Parameters.AddWithValue("$customer", customerId);
                existing.Parameters.AddWithValue("$key", idempotencyKey);
                await using var reader = await existing.ExecuteReaderAsync();
                if (await reader.ReadAsync()) return new(200, new { id = reader.GetString(0), status = reader.GetString(1), duplicate = true, message = "Esta solicitud ya fue recibida." });
            }

            await using (var account = connection.CreateCommand())
            {
                account.Transaction = transaction;
                account.CommandText = "SELECT balance_cents FROM accounts WHERE id=$id AND customer_id=$customer";
                account.Parameters.AddWithValue("$id", sourceAccountId);
                account.Parameters.AddWithValue("$customer", customerId);
                var balance = await account.ExecuteScalarAsync();
                if (balance is null) return TransferOutcome.BadRequest("No encontramos la cuenta de origen.");
                if (Convert.ToInt64(balance) < cents) return TransferOutcome.BadRequest("La cuenta no tiene saldo suficiente.");
            }

            if (destinationType == "OWN")
            {
                await using var destination = connection.CreateCommand();
                destination.Transaction = transaction;
                destination.CommandText = "SELECT COUNT(*) FROM accounts WHERE id=$id AND customer_id=$customer";
                destination.Parameters.AddWithValue("$id", destinationAccountId!);
                destination.Parameters.AddWithValue("$customer", customerId);
                if (Convert.ToInt64(await destination.ExecuteScalarAsync()) == 0) return TransferOutcome.BadRequest("La cuenta propia de destino no existe.");
            }

            var id = Guid.NewGuid().ToString("N");
            var now = DateTimeOffset.UtcNow.ToString("O");
            await using (var debit = connection.CreateCommand())
            {
                // Reserve funds while the request is pending; a real provider response must settle or release this reservation.
                debit.Transaction = transaction;
                debit.CommandText = "UPDATE accounts SET balance_cents=balance_cents-$amount WHERE id=$id AND customer_id=$customer AND balance_cents >= $amount";
                debit.Parameters.AddWithValue("$amount", cents);
                debit.Parameters.AddWithValue("$id", sourceAccountId);
                debit.Parameters.AddWithValue("$customer", customerId);
                if (await debit.ExecuteNonQueryAsync() != 1) return TransferOutcome.BadRequest("No se pudo reservar el saldo.");
            }
            await using (var insert = connection.CreateCommand())
            {
                insert.Transaction = transaction;
                insert.CommandText = "INSERT INTO transfers (id,customer_id,idempotency_key,source_account_id,destination_type,destination_account_id,recipient_name,recipient_bank,destination_account_number,amount_cents,description,status,created_at) VALUES ($id,$customer,$key,$source,$type,$dest,$name,$bank,$number,$amount,$description,'PENDING',$now)";
                insert.Parameters.AddWithValue("$id", id); insert.Parameters.AddWithValue("$key", idempotencyKey); insert.Parameters.AddWithValue("$source", sourceAccountId); insert.Parameters.AddWithValue("$type", destinationType);
                insert.Parameters.AddWithValue("$customer", customerId);
                insert.Parameters.AddWithValue("$dest", destinationType == "OWN" ? destinationAccountId! : DBNull.Value);
                insert.Parameters.AddWithValue("$name", destinationType == "OWN" ? "Cuenta propia" : request.RecipientName!.Trim()); insert.Parameters.AddWithValue("$bank", destinationType == "OWN" ? "BP" : request.RecipientBank!.Trim());
                insert.Parameters.AddWithValue("$number", destinationType == "OWN" ? "" : request.DestinationAccountNumber!.Trim()); insert.Parameters.AddWithValue("$amount", cents);
                insert.Parameters.AddWithValue("$description", string.IsNullOrWhiteSpace(request.Description) ? "Transferencia" : request.Description.Trim()); insert.Parameters.AddWithValue("$now", now);
                await insert.ExecuteNonQueryAsync();
            }
            await DemoDatabase.ExecuteAsync(connection, transaction, "INSERT INTO outbox (id,event_type,aggregate_id,created_at) VALUES ($id,'TransferRequested',$transfer,$now)", ("$id", Guid.NewGuid().ToString("N")), ("$transfer", id), ("$now", now));
            await DemoDatabase.ExecuteAsync(connection, transaction, "INSERT INTO audit_log (actor,action,resource,result,created_at) VALUES ($actor,'TRANSFER_REQUESTED',$id,'PENDING',$now)", ("$actor", customerId), ("$id", id), ("$now", now));
            transaction.Commit();
            return new(202, new { id, status = "PENDING", amount = cents / 100m, message = "Transferencia recibida para procesamiento." }, $"/api/transfers/{id}");
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19)
        {
            logger.LogWarning(ex, "Transfer persistence constraint conflict for customer {CustomerId}.", customerId);
            return TransferOutcome.Conflict("No se pudo registrar la transferencia por un conflicto con el estado actual.");
        }
    }
}

public sealed record TransferOutcome(
    int StatusCode,
    object? Body,
    string? Location = null,
    string? ErrorCode = null,
    string? ErrorTitle = null,
    string? ErrorDetail = null)
{
    public static TransferOutcome BadRequest(string message) => new(
        400,
        null,
        ErrorCode: "TRANSFER_VALIDATION_FAILED",
        ErrorTitle: "Transferencia inválida",
        ErrorDetail: message);

    public static TransferOutcome Conflict(string message) => new(
        409,
        null,
        ErrorCode: "TRANSFER_CONFLICT",
        ErrorTitle: "Conflicto de transferencia",
        ErrorDetail: message);
}
