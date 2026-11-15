using Microsoft.AspNetCore.Diagnostics;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        var traceId = context.TraceIdentifier;
        logger.LogError(exception, "Unhandled request exception. TraceId={TraceId}", traceId);

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        var (code, title, detail) = ApiProblemDetails.ForStatus(context.Response.StatusCode);
        await context.Response.WriteAsJsonAsync(
            ApiProblemDetails.Create(context, context.Response.StatusCode, code, title, detail),
            options: null,
            contentType: "application/problem+json",
            cancellationToken: cancellationToken);
        return true;
    }
}
