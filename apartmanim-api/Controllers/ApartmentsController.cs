
using apartmanim_api.Data;
using apartmanim_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace apartmanim_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ApartmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ApartmentsController(AppDbContext context)
    {
        _context = context;
    }

    // Yöneticinin kendi apartmanının kurulum durumunu getirir.
    [HttpGet("setup-status")]
    public async Task<IActionResult> GetSetupStatus()
    {
        if (!TryGetApartmentId(out var apartmentId))
            return Unauthorized();

        var apartment = await _context.Apartments
            .AsNoTracking()
            .Where(a => a.Id == apartmentId)
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.Address,
                a.TotalFloors,
                a.TotalUnits,
                a.IsSetupComplete
            })
            .FirstOrDefaultAsync();

        if (apartment == null)
        {
            return NotFound(new
            {
                message = "Apartman bulunamadı."
            });
        }

        return Ok(apartment);
    }

    // İlk kurulumu yapar ve tüm daireleri oluşturur.
    [HttpPost("setup")]
    public async Task<IActionResult> Setup(
        [FromBody] ApartmentSetupRequest request)
    {
        if (!TryGetApartmentId(out var apartmentId))
            return Unauthorized();

        if (request.Floors == null ||
            request.Floors.Count == 0 ||
            request.Floors.Count > 100)
        {
            return BadRequest(new
            {
                message = "1 ile 100 arasında kat tanımlamalısınız."
            });
        }

        if (request.Floors.Any(f =>
                f.FloorNo <= 0 ||
                f.UnitCount <= 0 ||
                f.UnitCount > 200))
        {
            return BadRequest(new
            {
                message = "Kat ve daire sayıları geçerli olmalıdır."
            });
        }

        var floorNumbers = request.Floors
            .Select(f => f.FloorNo)
            .ToList();

        if (floorNumbers.Distinct().Count() != floorNumbers.Count)
        {
            return BadRequest(new
            {
                message = "Aynı kat birden fazla kez eklenemez."
            });
        }

        var apartment = await _context.Apartments
            .FirstOrDefaultAsync(a => a.Id == apartmentId);

        if (apartment == null)
        {
            return NotFound(new
            {
                message = "Apartman bulunamadı."
            });
        }

        if (apartment.IsSetupComplete)
        {
            return Conflict(new
            {
                message = "Apartman kurulumu zaten tamamlanmış."
            });
        }

        // Eski test verilerinin üzerine yeni daire eklemeyelim.
        var existingUnits = await _context.Units
            .AnyAsync(u => u.ApartmentId == apartmentId);

        if (existingUnits)
        {
            return Conflict(new
            {
                message = "Bu apartmanda zaten daire kayıtları var. " +
                          "Kurulumdan önce mevcut daireler kontrol edilmeli."
            });
        }

        var units = new List<Unit>();

        foreach (var floor in request.Floors.OrderBy(f => f.FloorNo))
        {
            for (var unitNo = 1; unitNo <= floor.UnitCount; unitNo++)
            {
                units.Add(new Unit
                {
                    ApartmentId = apartmentId,
                    FloorNo = floor.FloorNo,
                    UnitNo = unitNo,
                    ResidentId = null
                });
            }
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            apartment.TotalFloors = request.Floors.Count;
            apartment.TotalUnits = units.Count;

            _context.Units.AddRange(units);
            apartment.IsSetupComplete = true;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return Ok(new
        {
            message = "Apartman kurulumu başarıyla tamamlandı.",
            apartment.Id,
            apartment.Name,
            apartment.TotalFloors,
            apartment.TotalUnits,
            apartment.IsSetupComplete
        });
    }

    private bool TryGetApartmentId(out int apartmentId)
    {
        return int.TryParse(
            User.FindFirst("ApartmentId")?.Value,
            out apartmentId);
    }
}

public class ApartmentSetupRequest
{
    public List<FloorSetupRequest> Floors { get; set; } = new();
}

public class FloorSetupRequest
{
    public int FloorNo { get; set; }

    public int UnitCount { get; set; }
}
