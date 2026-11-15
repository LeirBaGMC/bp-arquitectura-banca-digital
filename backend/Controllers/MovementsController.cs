using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/movements")]
public sealed class MovementsController(DemoBankingService banking) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMovements() => Ok(await banking.GetMovementsAsync(User.CustomerId()));
}
