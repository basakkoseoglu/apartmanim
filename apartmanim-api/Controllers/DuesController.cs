
using apartmanim_api.Data;
using apartmanim_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace apartmanim_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DuesController : ControllerBase
{
    private readonly AppDbContext _context;

    public DuesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDue(
        [FromBody] CreateDueRequest request)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new
            {
                message = "Aidat tutarı sıfırdan büyük olmalıdır."
            });
        }

        
var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

if (!int.TryParse(apartmentIdValue, out var apartmentId))
    return Unauthorized();

var unitExists = await _context.Units
    .AnyAsync(u => u.Id == request.UnitId &&
                   u.ApartmentId == apartmentId);

if (!unitExists)
{
    return BadRequest(new
    {
        message = "Belirtilen daire bulunamadı veya bu apartmana ait değil."
    });
}


        var due = new Due
        {
            UnitId = request.UnitId,
            Amount = request.Amount,
           DueDate = DateTime.SpecifyKind(
            request.DueDate,
            DateTimeKind.Utc
        ),
            Status = "Pending",
            PaidDate = null
        };

        _context.Dues.Add(due);
        await _context.SaveChangesAsync();

        return Created(
            "/api/dues",
            new
            {
                due.Id,
                due.UnitId,
                due.Amount,
                due.DueDate,
                due.PaidDate,
                due.Status
            });
    }
    

[HttpGet("my")]
public async Task<IActionResult> GetMyDues()
{
    var userIdValue = User.FindFirst(
        System.Security.Claims.ClaimTypes.NameIdentifier
    )?.Value;

    if (!int.TryParse(userIdValue, out var userId))
        return Unauthorized();

    var now = DateTime.UtcNow;

    var dues = await _context.Dues
        .Where(d => d.Unit != null &&
                    d.Unit.ResidentId == userId)
        .OrderByDescending(d => d.DueDate)
        .Select(d => new
        {
            d.Id,
            d.UnitId,
            FloorNo = d.Unit!.FloorNo,
            UnitNo = d.Unit.UnitNo,
            ResidentName = d.Unit.Resident != null
                ? d.Unit.Resident.FullName
                : null,
            d.Amount,
            d.DueDate,
            d.PaidDate,
            Status = d.Status == "Paid"
                ? "Paid"
                : d.DueDate < now
                    ? "Overdue"
                    : "Pending"
        })
        .ToListAsync();

    return Ok(dues);
}


[HttpPut("{id}/pay")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> MarkAsPaid(int id)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

if (!int.TryParse(apartmentIdValue, out var apartmentId))
    return Unauthorized();

var due = await _context.Dues
    .FirstOrDefaultAsync(d =>
        d.Id == id &&
        d.Unit != null &&
        d.Unit.ApartmentId == apartmentId);

    if (due == null)
        return NotFound(new { message = "Aidat bulunamadı." });

    if (due.Status == "Paid")
        return BadRequest(new { message = "Bu aidat zaten ödenmiş." });

    due.Status = "Paid";
    due.PaidDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        due.Id,
        due.UnitId,
        due.Amount,
        due.DueDate,
        due.PaidDate,
        due.Status
    });
}

[HttpDelete("{id}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> DeleteDue(int id)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var due = await _context.Dues
        .FirstOrDefaultAsync(d =>
            d.Id == id &&
            d.Unit != null &&
            d.Unit.ApartmentId == apartmentId);

    if (due == null)
    {
        return NotFound(new
        {
            message = "Aidat bulunamadı."
        });
    }

    _context.Dues.Remove(due);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Aidat başarıyla silindi."
    });
}

[HttpGet]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetAllDues(
    [FromQuery] string? status)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var now = DateTime.UtcNow;

    var query = _context.Dues
        .Where(d => d.Unit != null &&
                    d.Unit.ApartmentId == apartmentId);

    if (!string.IsNullOrWhiteSpace(status))
    {
        if (status != "Paid" &&
            status != "Pending" &&
            status != "Overdue")
        {
            return BadRequest(new
            {
                message = "Durum Paid, Pending veya Overdue olmalıdır."
            });
        }

        if (status == "Paid")
        {
            query = query.Where(d => d.Status == "Paid");
        }
        else if (status == "Overdue")
        {
            query = query.Where(d =>
                d.Status != "Paid" &&
                d.DueDate < now);
        }
        else
        {
            query = query.Where(d =>
                d.Status != "Paid" &&
                d.DueDate >= now);
        }
    }

    var dues = await query
        .OrderBy(d => d.DueDate)
        .Select(d => new
        {
            d.Id,
            d.UnitId,
            FloorNo = d.Unit!.FloorNo,
            UnitNo = d.Unit.UnitNo,
            ResidentName = d.Unit.Resident != null
                ? d.Unit.Resident.FullName
                : null,
            d.Amount,
            d.DueDate,
            d.PaidDate,
            Status = d.Status == "Paid"
                ? "Paid"
                : d.DueDate < now
                    ? "Overdue"
                    : "Pending"
        })
        .ToListAsync();

    return Ok(dues);
}




[HttpGet("summary")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetDuesSummary()
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var now = DateTime.UtcNow;

    var dues = _context.Dues
        .Where(d => d.Unit != null &&
                    d.Unit.ApartmentId == apartmentId);

    var summary = await dues
        .GroupBy(d => 1)
        .Select(g => new
        {
            TotalDueAmount = g.Sum(d => d.Amount),

            PaidAmount = g
                .Where(d => d.Status == "Paid")
                .Sum(d => d.Amount),

            PendingAmount = g
                .Where(d => d.Status != "Paid" &&
                            d.DueDate >= now)
                .Sum(d => d.Amount),

            OverdueAmount = g
                .Where(d => d.Status != "Paid" &&
                            d.DueDate < now)
                .Sum(d => d.Amount),

            TotalDueCount = g.Count(),

            PaidCount = g.Count(d => d.Status == "Paid"),

            PendingCount = g.Count(d =>
                d.Status != "Paid" &&
                d.DueDate >= now),

            OverdueCount = g.Count(d =>
                d.Status != "Paid" &&
                d.DueDate < now)
        })
        .FirstOrDefaultAsync();

    if (summary == null)
    {
        return Ok(new
        {
            TotalDueAmount = 0m,
            PaidAmount = 0m,
            PendingAmount = 0m,
            OverdueAmount = 0m,
            TotalDueCount = 0,
            PaidCount = 0,
            PendingCount = 0,
            OverdueCount = 0
        });
    }

    return Ok(summary);
}

}

public class CreateDueRequest
{
    public int UnitId { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
}
