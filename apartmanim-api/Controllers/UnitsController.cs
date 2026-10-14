
using apartmanim_api.Data;
using apartmanim_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace apartmanim_api.Controllers;

[ApiController]
[Route("api/units")]
[Authorize(Roles = "Admin")]
public class UnitsController : ControllerBase
{
    private readonly AppDbContext _context;

    public UnitsController(AppDbContext context)
    {
        _context = context;
    }

    // Yöneticinin kendi apartmanındaki daireleri listelemesi
    [HttpGet]
    public async Task<IActionResult> GetUnits()
    {
        var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

        if (!int.TryParse(apartmentIdValue, out var apartmentId))
            return Unauthorized();

        var units = await _context.Units
            .Where(u => u.ApartmentId == apartmentId)
            .OrderBy(u => u.FloorNo)
            .ThenBy(u => u.UnitNo)
            .Select(u => new
            {
                u.Id,
                u.ApartmentId,
                u.FloorNo,
                u.UnitNo,
                u.ResidentId,
                ResidentName = u.Resident != null
                    ? u.Resident.FullName
                    : null
            })
            .ToListAsync();

        return Ok(units);
    }

    // Yeni daire oluşturma
    [HttpPost]
    public async Task<IActionResult> CreateUnit(
        [FromBody] CreateUnitRequest request)
    {
        var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

        if (!int.TryParse(apartmentIdValue, out var apartmentId))
            return Unauthorized();

        if (request.FloorNo <= 0 || request.UnitNo <= 0)
        {
            return BadRequest(new
            {
                message = "Kat ve daire numarası sıfırdan büyük olmalıdır."
            });
        }

        var apartment = await _context.Apartments
            .FirstOrDefaultAsync(a => a.Id == apartmentId);

        if (apartment == null)
        {
            return BadRequest(new
            {
                message = "Apartman bulunamadı."
            });
        }

        if (request.FloorNo > apartment.TotalFloors)
        {
            return BadRequest(new
            {
                message = "Girilen kat, apartmanın kat sayısını aşamaz."
            });
        }

        var unitExists = await _context.Units.AnyAsync(u =>
            u.ApartmentId == apartmentId &&
            u.FloorNo == request.FloorNo &&
            u.UnitNo == request.UnitNo);

        if (unitExists)
        {
            return BadRequest(new
            {
                message = "Bu katta aynı daire numarası zaten mevcut."
            });
        }

        var unit = new Unit
        {
            ApartmentId = apartmentId,
            FloorNo = request.FloorNo,
            UnitNo = request.UnitNo,
            ResidentId = null
        };

        _context.Units.Add(unit);
        await _context.SaveChangesAsync();

        return Created(
            $"/api/units/{unit.Id}",
            new
            {
                unit.Id,
                unit.ApartmentId,
                unit.FloorNo,
                unit.UnitNo,
                unit.ResidentId
            });
    }
    
[HttpPut("{id}/resident")]
public async Task<IActionResult> AssignResident(
    int id,
    [FromBody] AssignResidentRequest request)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var unit = await _context.Units
        .FirstOrDefaultAsync(u =>
            u.Id == id &&
            u.ApartmentId == apartmentId);

    if (unit == null)
    {
        return NotFound(new
        {
            message = "Daire bulunamadı."
        });
    }

    var user = await _context.Users
        .FirstOrDefaultAsync(u =>
            u.Id == request.ResidentId &&
            u.ApartmentId == apartmentId &&
            u.Role == "Resident");

    if (user == null)
    {
        return BadRequest(new
        {
            message = "Bu apartmanda kayıtlı bir sakin bulunamadı."
        });
    }

    var alreadyAssigned = await _context.Units
        .AnyAsync(u =>
            u.ResidentId == request.ResidentId &&
            u.Id != id);

    if (alreadyAssigned)
    {
        return BadRequest(new
        {
            message = "Bu sakin başka bir daireye zaten atanmış."
        });
    }

    unit.ResidentId = user.Id;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        unit.Id,
        unit.ApartmentId,
        unit.FloorNo,
        unit.UnitNo,
        unit.ResidentId,
        ResidentName = user.FullName
    });
}

public class AssignResidentRequest
{
    public int ResidentId { get; set; }
}


[HttpDelete("{id}/resident")]
public async Task<IActionResult> RemoveResident(int id)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var unit = await _context.Units
        .FirstOrDefaultAsync(u =>
            u.Id == id &&
            u.ApartmentId == apartmentId);

    if (unit == null)
    {
        return NotFound(new
        {
            message = "Daire bulunamadı."
        });
    }

    if (unit.ResidentId == null)
    {
        return BadRequest(new
        {
            message = "Bu dairede atanmış bir sakin bulunmuyor."
        });
    }

    unit.ResidentId = null;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Sakin daireden başarıyla kaldırıldı.",
        unit.Id,
        unit.ApartmentId,
        unit.FloorNo,
        unit.UnitNo,
        unit.ResidentId
    });
}

[HttpPut("{id}")]
public async Task<IActionResult> UpdateUnit(
    int id,
    [FromBody] UpdateUnitRequest request)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    if (request.FloorNo <= 0 || request.UnitNo <= 0)
    {
        return BadRequest(new
        {
            message = "Kat ve daire numarası sıfırdan büyük olmalıdır."
        });
    }

    var apartment = await _context.Apartments
        .FirstOrDefaultAsync(a => a.Id == apartmentId);

    if (apartment == null)
        return BadRequest(new { message = "Apartman bulunamadı." });

    if (request.FloorNo > apartment.TotalFloors)
    {
        return BadRequest(new
        {
            message = "Girilen kat, apartmanın kat sayısını aşamaz."
        });
    }

    var unit = await _context.Units
        .FirstOrDefaultAsync(u =>
            u.Id == id &&
            u.ApartmentId == apartmentId);

    if (unit == null)
    {
        return NotFound(new
        {
            message = "Daire bulunamadı."
        });
    }

    var duplicate = await _context.Units.AnyAsync(u =>
        u.ApartmentId == apartmentId &&
        u.FloorNo == request.FloorNo &&
        u.UnitNo == request.UnitNo &&
        u.Id != id);

    if (duplicate)
    {
        return BadRequest(new
        {
            message = "Bu katta aynı daire numarası zaten mevcut."
        });
    }

    unit.FloorNo = request.FloorNo;
    unit.UnitNo = request.UnitNo;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        unit.Id,
        unit.ApartmentId,
        unit.FloorNo,
        unit.UnitNo,
        unit.ResidentId
    });
}

}

public class CreateUnitRequest
{
    public int FloorNo { get; set; }
    public int UnitNo { get; set; }
}


public class UpdateUnitRequest
{
    public int FloorNo { get; set; }
    public int UnitNo { get; set; }
}
