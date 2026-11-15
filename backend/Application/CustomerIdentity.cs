using System.Security.Claims;

public static class CustomerIdentity
{
    public static string CustomerId(this ClaimsPrincipal principal)
    {
        var customerId = principal.FindFirst("sub")?.Value;
        return string.IsNullOrWhiteSpace(customerId)
            ? throw new UnauthorizedAccessException("The access token has no customer identity.")
            : customerId;
    }
}
