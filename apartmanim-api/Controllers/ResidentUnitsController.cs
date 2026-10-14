
using apartmanim_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace apartmanim_api.Controllers;

[ApiController]
[Route("api/units")]
[Authorize(Roles = "Resident")]
public class ResidentUnitsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ResidentUnitsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyUnit()
    {
        var userIdValue = User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var unit = await _context.Units
            .Where(u => u.ResidentId == userId)
            .Select(u => new
            {
                u.Id,
                u.ApartmentId,
                ApartmentName = u.Apartment != null
                    ? u.Apartment.Name
                    : null,
                ApartmentAddress = u.Apartment != null
                    ? u.Apartment.Address
                    : null,
                u.FloorNo,
                u.UnitNo
            })
            .FirstOrDefaultAsync();

        if (unit == null)
        {
            return NotFound(new
            {
                message = "Hesabınıza atanmış bir daire bulunamadı."
            });
        }

        return Ok(unit);
    }
}
