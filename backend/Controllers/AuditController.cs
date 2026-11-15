using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/audit")]
[Authorize(Roles = "Operations")]
public sealed class AuditController(DemoBankingService banking) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAudit() => Ok(await banking.GetAuditAsync());
}
