using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/transfers")]
public sealed class TransfersController(DemoBankingService banking) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTransfers() => Ok(await banking.GetTransfersAsync(User.CustomerId()));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTransfer(string id)
    {
        var transfer = await banking.GetTransferAsync(id, User.CustomerId());
        return transfer is null ? NotFound() : Ok(transfer);
    }

    [HttpPost]
    [Authorize(Policy = "StrongMfa")]
    [RequestSizeLimit(16_384)]
    [EnableRateLimiting("transfers")]
    public async Task<IActionResult> CreateTransfer([FromBody] TransferRequest request)
    {
        var outcome = await banking.CreateTransferAsync(request, User.CustomerId());
        if (outcome.ErrorCode is not null)
        {
            var problem = ApiProblemDetails.Create(
                HttpContext,
                outcome.StatusCode,
                outcome.ErrorCode,
                outcome.ErrorTitle ?? "Solicitud no completada",
                outcome.ErrorDetail ?? "No se pudo completar la transferencia.");
            return StatusCode(outcome.StatusCode, problem);
        }

        return outcome.StatusCode == StatusCodes.Status202Accepted
            ? Accepted(outcome.Location, outcome.Body)
            : StatusCode(outcome.StatusCode, outcome.Body);
    }
}

public sealed class TransferRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(32, MinimumLength = 1)]
    [System.ComponentModel.DataAnnotations.RegularExpression("^[A-Za-z0-9_-]+$")]
    public string SourceAccountId { get; init; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.RegularExpression("^(OWN|INTERBANK)$")]
    public string DestinationType { get; init; } = string.Empty;

    [System.ComponentModel.DataAnnotations.StringLength(32)]
    [System.ComponentModel.DataAnnotations.RegularExpression("^[A-Za-z0-9_-]*$")]
    public string? DestinationAccountId { get; init; }

    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public string? RecipientName { get; init; }

    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public string? RecipientBank { get; init; }

    [System.ComponentModel.DataAnnotations.RegularExpression("^\\d{6,20}$")]
    public string? DestinationAccountNumber { get; init; }

    [System.ComponentModel.DataAnnotations.Range(1.0, 2500.0)]
    public decimal Amount { get; init; }

    [System.ComponentModel.DataAnnotations.StringLength(120)]
    public string? Description { get; init; }

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(36, MinimumLength = 32)]
    public string IdempotencyKey { get; init; } = string.Empty;
}
