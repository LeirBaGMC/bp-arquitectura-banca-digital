using Microsoft.AspNetCore.Mvc;

public static class ApiProblemDetails
{
    public static ProblemDetails Create(HttpContext context, int status, string code, string title, string detail)
    {
        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = context.TraceIdentifier;
        return problem;
    }

    public static (string Code, string Title, string Detail) ForStatus(int status) => status switch
    {
        StatusCodes.Status400BadRequest => ("BAD_REQUEST", "Solicitud inválida", "Revisa los datos enviados."),
        StatusCodes.Status401Unauthorized => ("AUTHENTICATION_REQUIRED", "Autenticación requerida", "Inicia sesión para continuar."),
        StatusCodes.Status403Forbidden => ("ACCESS_DENIED", "Acceso denegado", "No tienes permiso para realizar esta acción."),
        StatusCodes.Status404NotFound => ("RESOURCE_NOT_FOUND", "Recurso no encontrado", "No encontramos el recurso solicitado."),
        StatusCodes.Status409Conflict => ("RESOURCE_CONFLICT", "Conflicto de operación", "La solicitud entra en conflicto con el estado actual."),
        StatusCodes.Status429TooManyRequests => ("RATE_LIMIT_EXCEEDED", "Demasiadas solicitudes", "Espera un momento antes de volver a intentarlo."),
        _ when status >= 500 => ("INTERNAL_ERROR", "Error interno", "No se pudo completar la solicitud."),
        _ => ("HTTP_ERROR", "Solicitud no completada", "No se pudo completar la solicitud.")
    };
}
