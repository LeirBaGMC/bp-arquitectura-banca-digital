using System.Threading.RateLimiting;
using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var problem = ApiProblemDetails.Create(
            context.HttpContext,
            StatusCodes.Status400BadRequest,
            "VALIDATION_FAILED",
            "Solicitud inválida",
            "Revisa los campos indicados.");
        problem.Extensions["errors"] = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                entry => entry.Key,
                entry => entry.Value!.Errors.Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage) ? "Valor inválido." : error.ErrorMessage).ToArray());
        return new BadRequestObjectResult(problem);
    };
});
builder.Services.AddHealthChecks();
if (builder.Environment.IsDevelopment())
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    builder.Services.AddCors(options => options.AddPolicy("Development", policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
}
var authority = builder.Configuration["Authentication:Authority"];
var clientIds = builder.Configuration.GetSection("Authentication:ClientIds")
    .Get<string[]>()?
    .Where(id => !string.IsNullOrWhiteSpace(id))
    .ToHashSet(StringComparer.Ordinal) ?? new HashSet<string>(StringComparer.Ordinal);
var singleClientId = builder.Configuration["Authentication:ClientId"];
if (clientIds.Count == 0 && !string.IsNullOrWhiteSpace(singleClientId))
    clientIds.Add(singleClientId);
var cognitoDomain = builder.Configuration["Authentication:Domain"];
var requiredScope = builder.Configuration["Authentication:RequiredScope"] ?? "bp/banking-api";
var localIdentityEnabled = builder.Environment.IsDevelopment() &&
    builder.Configuration.GetValue<bool>("Authentication:EnableLocalDevelopmentIdentity");

// AWS handoff: configure a Cognito user pool, public SPA app client with Authorization Code + PKCE, and the banking-api resource-server scope.
if (!localIdentityEnabled &&
    (string.IsNullOrWhiteSpace(authority) || clientIds.Count == 0 ||
     !Uri.TryCreate(cognitoDomain, UriKind.Absolute, out var parsedCognitoDomain) || parsedCognitoDomain.Scheme != Uri.UriSchemeHttps))
    throw new InvalidOperationException("A valid HTTPS Authentication:Domain, Authentication:Authority, and Authentication:ClientId are required when local development identity is disabled.");

if (localIdentityEnabled)
{
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "Development";
        options.DefaultChallengeScheme = "Development";
    }).AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, DevelopmentAuthenticationHandler>(
        "Development", _ => { });
}
else
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.RequireHttpsMetadata = true;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            RoleClaimType = "cognito:groups"
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                var principal = context.Principal;
                var tokenClientId = principal?.FindFirst("client_id")?.Value;
                var tokenUse = principal?.FindFirst("token_use")?.Value;
                var scopes = principal?.FindFirst("scope")?.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries) ?? [];
                if (tokenClientId is null || !clientIds.Contains(tokenClientId) || tokenUse != "access" ||
                    string.IsNullOrWhiteSpace(principal?.FindFirst("sub")?.Value) || !scopes.Contains(requiredScope, StringComparer.Ordinal))
                    context.Fail("The access token is missing required banking claims.");
                return Task.CompletedTask;
            }
        };
    });
}
builder.Services.AddAuthorization(options => options.AddPolicy("StrongMfa", policy =>
    policy.RequireAuthenticatedUser().RequireAssertion(context =>
        (localIdentityEnabled && context.User.Identity?.AuthenticationType == "Development") ||
        CognitoMfaClaims.HasTotpMfa(context.User))));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("transfers", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirst("sub")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("identity-onboarding", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirst("sub")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 3,
            Window = TimeSpan.FromMinutes(10),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});
builder.Services.AddSingleton<DemoDatabase>();
builder.Services.AddScoped<DemoBankingService>();
// Replace the local outbox poller with an SQS consumer after the queue, task role, retry policy, and DLQ exist.
builder.Services.AddHostedService<TransferWorker>();

var app = builder.Build();
await app.Services.GetRequiredService<DemoDatabase>().InitializeAsync();

app.UseExceptionHandler();
app.UseStatusCodePages(async (StatusCodeContext statusContext) =>
{
    var context = statusContext.HttpContext;
    var status = context.Response.StatusCode;
    var (code, title, detail) = ApiProblemDetails.ForStatus(status);
    context.Response.ContentType = "application/problem+json";
    await context.Response.WriteAsJsonAsync(
        ApiProblemDetails.Create(context, status, code, title, detail),
        options: null,
        contentType: "application/problem+json");
});

var requestLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("HttpRequest");
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Request-Id"] = context.TraceIdentifier;
    var stopwatch = Stopwatch.StartNew();
    try
    {
        await next();
    }
    finally
    {
        requestLogger.LogInformation(
            "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMilliseconds}ms. TraceId={TraceId}",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds,
            context.TraceIdentifier);
    }
});

app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        if (!app.Environment.IsDevelopment())
        {
            var cognitoOrigin = new Uri(cognitoDomain!).GetLeftPart(UriPartial.Authority);
            context.Response.Headers["Content-Security-Policy"] = $"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' {cognitoOrigin}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
        }
        return Task.CompletedTask;
    });
    await next();
});

app.UseRouting();
if (app.Environment.IsDevelopment())
    app.UseCors("Development");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers().RequireAuthorization();
app.MapHealthChecks("/health").AllowAnonymous();
app.MapFallback("/api/{**path}", async context =>
{
    var problem = ApiProblemDetails.Create(
        context,
        StatusCodes.Status404NotFound,
        "API_ROUTE_NOT_FOUND",
        "Endpoint no encontrado",
        "La ruta de API solicitada no existe.");
    context.Response.StatusCode = StatusCodes.Status404NotFound;
    context.Response.ContentType = "application/problem+json";
    await context.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
}).RequireAuthorization();
app.MapFallbackToFile("index.html");
app.Run();
