using Microsoft.Data.Sqlite;

public sealed class DemoDatabase
{
    private readonly string _connectionString;
    public DemoDatabase(IWebHostEnvironment environment, IConfiguration configuration)
    {
        // SQLite is intentionally local-only. Before AWS deployment, replace this adapter with RDS PostgreSQL and add versioned schema migrations.
        if (!environment.IsDevelopment() || !configuration.GetValue<bool>("Authentication:EnableLocalDevelopmentIdentity"))
            throw new InvalidOperationException("The SQLite database is enabled only in Development. Configure the managed database adapter before deployment.");
        var configuredPath = configuration["Banking:DatabasePath"];
        var databasePath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(environment.ContentRootPath, "Data", "bp-demo.db")
            : Path.GetFullPath(configuredPath);
        var folder = Path.GetDirectoryName(databasePath)
            ?? throw new InvalidOperationException("La ruta de la base de datos no tiene un directorio válido.");
        Directory.CreateDirectory(folder);
        _connectionString = new SqliteConnectionStringBuilder { DataSource = databasePath, ForeignKeys = true, Pooling = true }.ToString();
    }

    public async Task<SqliteConnection> OpenAsync()
    {
        var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        return connection;
    }

    public async Task InitializeAsync()
    {
        await using var connection = await OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, segment TEXT NOT NULL, updated_at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL DEFAULT 'CUS-1001', alias TEXT NOT NULL, kind TEXT NOT NULL, masked_number TEXT NOT NULL, balance_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'USD', FOREIGN KEY(customer_id) REFERENCES customers(id));
            CREATE TABLE IF NOT EXISTS movements (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT NOT NULL REFERENCES accounts(id), title TEXT NOT NULL, detail TEXT NOT NULL, amount_cents INTEGER NOT NULL, direction TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS transfers (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL DEFAULT 'CUS-1001', idempotency_key TEXT NOT NULL UNIQUE, source_account_id TEXT NOT NULL REFERENCES accounts(id), destination_type TEXT NOT NULL, destination_account_id TEXT NULL REFERENCES accounts(id), recipient_name TEXT NOT NULL, recipient_bank TEXT NOT NULL, destination_account_number TEXT NOT NULL, amount_cents INTEGER NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id));
            CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, aggregate_id TEXT NOT NULL, created_at TEXT NOT NULL, processed_at TEXT NULL);
            CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL DEFAULT 'CUS-1001', title TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(customer_id) REFERENCES customers(id));
            CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, resource TEXT NOT NULL, result TEXT NOT NULL, created_at TEXT NOT NULL);
            """;
        await command.ExecuteNonQueryAsync();
        // Keep this compatibility migration for the local SQLite file; production schema changes belong in versioned RDS migrations.
        await EnsureColumnAsync(connection, "accounts", "customer_id", "TEXT NOT NULL DEFAULT 'CUS-1001'");
        await EnsureColumnAsync(connection, "transfers", "customer_id", "TEXT NOT NULL DEFAULT 'CUS-1001'");
        await EnsureColumnAsync(connection, "notifications", "customer_id", "TEXT NOT NULL DEFAULT 'CUS-1001'");
        await ExecuteAsync(connection, null, "CREATE INDEX IF NOT EXISTS ix_accounts_customer_id ON accounts(customer_id); CREATE INDEX IF NOT EXISTS ix_transfers_customer_id ON transfers(customer_id); CREATE INDEX IF NOT EXISTS ix_notifications_customer_id ON notifications(customer_id)");
        // In AWS, provision customers using the verified Cognito subject (sub) and associate core-account records with that same subject.
        await ExecuteAsync(connection, null,
            "INSERT OR IGNORE INTO customers(id,name,email,segment,updated_at) VALUES ('CUS-1001','María Fernanda López','maria.lopez@example.test','Personal',$now)",
            ("$now", DateTimeOffset.UtcNow.ToString("O")));
        await using var count = connection.CreateCommand();
        count.CommandText = "SELECT COUNT(*) FROM accounts";
        if (Convert.ToInt64(await count.ExecuteScalarAsync()) > 0) return;
        using var transaction = connection.BeginTransaction();
        var now = DateTimeOffset.UtcNow;
        await ExecuteAsync(connection, transaction, "INSERT INTO accounts(id,alias,kind,masked_number,balance_cents) VALUES ('ACC-001','Cuenta principal','Corriente','•••• 4821',425000),('ACC-002','Ahorros','Ahorros','•••• 1076',186500)");
        await ExecuteAsync(connection, transaction, "INSERT INTO movements(account_id,title,detail,amount_cents,direction,status,created_at) VALUES ('ACC-001','Pago de nómina','ACME Servicios',248000,'IN','COMPLETED',$d1),('ACC-001','Supermercado El Portal','Compra con débito',-8640,'OUT','COMPLETED',$d2),('ACC-002','Aporte mensual','Transferencia propia',50000,'IN','COMPLETED',$d3),('ACC-001','Internet hogar','Pago de servicio',-3299,'OUT','COMPLETED',$d4),('ACC-001','Cafetería Central','Compra con débito',-1275,'OUT','COMPLETED',$d5)",
            ("$d1", now.AddDays(-1).ToString("O")), ("$d2", now.AddDays(-2).ToString("O")), ("$d3", now.AddDays(-4).ToString("O")), ("$d4", now.AddDays(-5).ToString("O")), ("$d5", now.AddDays(-6).ToString("O")));
        await ExecuteAsync(connection, transaction, "INSERT INTO notifications(title,message,created_at) VALUES ('Tu banca digital está lista','Consulta el saldo y los movimientos de tus cuentas.', $now),('Seguridad primero','No compartas tus credenciales con nadie.', $before)", ("$now", now.ToString("O")), ("$before", now.AddMinutes(-3).ToString("O")));
        await ExecuteAsync(connection, transaction, "INSERT INTO audit_log(actor,action,resource,result,created_at) VALUES ('CUS-1001','SESSION_STARTED','CUS-1001','OK',$now)", ("$now", now.ToString("O")));
        transaction.Commit();
    }

    private static async Task EnsureColumnAsync(SqliteConnection connection, string table, string column, string definition)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info({table})";
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (reader.GetString(1) == column) return;
        }
        await reader.DisposeAsync();
        await ExecuteAsync(connection, null, $"ALTER TABLE {table} ADD COLUMN {column} {definition}");
    }

    public static async Task ExecuteAsync(SqliteConnection connection, SqliteTransaction? transaction, string sql, params (string Name, object Value)[] parameters)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;
        foreach (var (name, value) in parameters) command.Parameters.AddWithValue(name, value);
        await command.ExecuteNonQueryAsync();
    }
}
