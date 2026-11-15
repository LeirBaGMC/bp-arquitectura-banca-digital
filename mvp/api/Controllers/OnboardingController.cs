using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

[ApiController]
[Route("api/onboarding/face-verification")]
public sealed class OnboardingController : ControllerBase
{
    [HttpPost("sessions")]
    [EnableRateLimiting("identity-onboarding")]
    [RequestSizeLimit(1024)]
    public IActionResult CreateFaceVerificationSession([FromBody] FaceVerificationConsent request)
    {
        if (request.Consent is not true)
            return BadRequest(ApiProblemDetails.Create(
                HttpContext,
                StatusCodes.Status400BadRequest,
                "BIOMETRIC_CONSENT_REQUIRED",
                "Consentimiento requerido",
                "Debes aceptar el tratamiento de datos biométricos antes de iniciar la verificación."));

        return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiProblemDetails.Create(
            HttpContext,
            StatusCodes.Status503ServiceUnavailable,
            "FACE_VERIFICATION_NOT_CONFIGURED",
            "Verificación no disponible",
            "El servicio de verificación facial todavía no está configurado."));
    }
}

public sealed record FaceVerificationConsent([Required] bool? Consent);
