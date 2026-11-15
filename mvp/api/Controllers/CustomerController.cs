using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/customer")]
public sealed class CustomerController(DemoBankingService banking) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCustomer()
    {
        var customer = await banking.GetCustomerAsync(User.CustomerId());
        return customer is null ? NotFound() : Ok(customer);
    }
}
 
