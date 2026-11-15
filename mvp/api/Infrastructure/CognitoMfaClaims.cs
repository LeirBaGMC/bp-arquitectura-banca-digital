using System.Security.Claims;
using System.Text.Json;

public static class CognitoMfaClaims
{
    public const string RequiredAcr = "urn:cognito:loa:4";

    public static bool HasTotpMfa(ClaimsPrincipal principal)
    {
        if (principal.FindFirst("acr")?.Value != RequiredAcr)
            return false;

        return principal.FindAll("amr").Any(claim =>
            claim.Value == "mfa" || HasMfaMethodInArray(claim.Value));
    }

    private static bool HasMfaMethodInArray(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value[0] != '[')
            return false;

        try
        {
            using var document = JsonDocument.Parse(value);
            return document.RootElement.ValueKind == JsonValueKind.Array &&
                document.RootElement.EnumerateArray().Any(item =>
                    item.ValueKind == JsonValueKind.String && item.GetString() == "mfa");
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
