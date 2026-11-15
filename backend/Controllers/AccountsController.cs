using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/accounts")]
public sealed class AccountsController(DemoBankingService banking) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAccounts() => Ok(await banking.GetAccountsAsync(User.CustomerId()));
}
