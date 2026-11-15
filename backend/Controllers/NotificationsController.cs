using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/notifications")]
public sealed class NotificationsController(DemoBankingService banking) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetNotifications() => Ok(await banking.GetNotificationsAsync(User.CustomerId()));
}
