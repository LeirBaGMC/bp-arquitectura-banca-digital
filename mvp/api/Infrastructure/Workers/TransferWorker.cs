using Microsoft.Data.Sqlite;

public sealed class TransferWorker(DemoDatabase database, ILogger<TransferWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await ProcessOneAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Transfer processing failed."); }
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }

    private async Task ProcessOneAsync(CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenAsync();
        await using var find = connection.CreateCommand();
        // Interbank requests are reserved and remain PENDING until a real provider confirms the outcome.
        // For AWS, publish the outbox event to SQS, add idempotent retries and a DLQ, and update status only from the provider response.
        find.CommandText = "SELECT o.id,o.aggregate_id FROM outbox o JOIN transfers t ON t.id=o.aggregate_id WHERE o.processed_at IS NULL AND t.status='PENDING' AND t.destination_type='OWN' ORDER BY o.created_at LIMIT 1";
        await using var reader = await find.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return;
        var outboxId = reader.GetString(0);
        var transferId = reader.GetString(1);
        await reader.DisposeAsync();

        await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        using var transaction = connection.BeginTransaction();
        string customerId, sourceId, destinationType, recipient, bank, description;
        string? destinationId;
        long amount;
        await using (var transfer = connection.CreateCommand())
        {
            transfer.Transaction = transaction;
            transfer.CommandText = "SELECT customer_id,source_account_id,destination_type,destination_account_id,recipient_name,recipient_bank,amount_cents,description FROM transfers WHERE id=$id AND status='PENDING' AND destination_type='OWN'";
            transfer.Parameters.AddWithValue("$id", transferId);
            await using var transferReader = await transfer.ExecuteReaderAsync(cancellationToken);
            if (!await transferReader.ReadAsync(cancellationToken)) { transaction.Rollback(); return; }
            customerId = transferReader.GetString(0); sourceId = transferReader.GetString(1); destinationType = transferReader.GetString(2); destinationId = transferReader.IsDBNull(3) ? null : transferReader.GetString(3);
            recipient = transferReader.GetString(4); bank = transferReader.GetString(5); amount = transferReader.GetInt64(6); description = transferReader.GetString(7);
        }

        var now = DateTimeOffset.UtcNow.ToString("O");
        await DemoDatabase.ExecuteAsync(connection, transaction, "UPDATE transfers SET status='COMPLETED' WHERE id=$id", ("$id", transferId));
        await DemoDatabase.ExecuteAsync(connection, transaction, "INSERT INTO movements(account_id,title,detail,amount_cents,direction,status,created_at) VALUES ($account,'Transferencia enviada',$detail,$amount,'OUT','COMPLETED',$now)", ("$account", sourceId), ("$detail", recipient + " · " + bank), ("$amount", -amount), ("$now", now));
        if (destinationType == "OWN" && destinationId is not null)
        {
            await DemoDatabase.ExecuteAsync(connection, transaction, "UPDATE accounts SET balance_cents=balance_cents+$amount WHERE id=$id", ("$amount", amount), ("$id", destinationId));
            await DemoDatabase.ExecuteAsync(connection, transaction, "INSERT INTO movements(account_id,title,detail,amount_cents,direction,status,created_at) VALUES ($account,'Transferencia recibida','Desde cuenta principal',$amount,'IN','COMPLETED',$now)", ("$account", destinationId), ("$amount", amount), ("$now", now));
        }
        await DemoDatabase.ExecuteAsync(connection, transaction, "INSERT INTO notifications(customer_id,title,message,created_at) VALUES ($customer,'Transferencia completada',$message,$now)", ("$customer", customerId), ("$message", description + " · " + (amount / 100m).ToString("C")), ("$now", now));
        await DemoDatabase.ExecuteAsync(connection, transaction, "INSERT INTO audit_log(actor,action,resource,result,created_at) VALUES ($customer,'TRANSFER_COMPLETED',$id,'COMPLETED',$now)", ("$customer", customerId), ("$id", transferId), ("$now", now));
        await DemoDatabase.ExecuteAsync(connection, transaction, "UPDATE outbox SET processed_at=$now WHERE id=$id", ("$now", now), ("$id", outboxId));
        transaction.Commit();
        logger.LogInformation("Completed transfer {TransferId}.", transferId);
    }
}
