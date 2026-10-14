using apartmanim_api.Data;
using apartmanim_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace apartmanim_api.Controllers;

[ApiController]
[Route("api/maintenance-requests")]
[Authorize]
public class MaintenanceRequestsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MaintenanceRequestsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRequest(
        [FromBody] CreateMaintenanceRequest request)
    {
        var userIdValue = User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdValue, out var userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new
            {
                message = "Başlık ve açıklama zorunludur."
            });
        }

        var unit = await _context.Units
            .FirstOrDefaultAsync(u => u.ResidentId == userId);

        if (unit == null)
        {
            return BadRequest(new
            {
                message = "Kullanıcıya atanmış bir daire bulunamadı."
            });
        }

        var maintenanceRequest = new MaintenanceRequest
        {
            ApartmentId = unit.ApartmentId,
            UnitId = unit.Id,
            RequesterId = userId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.MaintenanceRequests.Add(maintenanceRequest);
        await _context.SaveChangesAsync();

        return Created(
            $"/api/maintenance-requests/my",
            new
            {
                maintenanceRequest.Id,
                maintenanceRequest.ApartmentId,
                maintenanceRequest.UnitId,
                maintenanceRequest.Title,
                maintenanceRequest.Description,
                maintenanceRequest.Status,
                maintenanceRequest.CreatedAt,
                maintenanceRequest.RequesterId
            });
    }

    
[HttpGet("my")]
public async Task<IActionResult> GetMyRequests()
{
    var userIdValue = User.FindFirst(
        ClaimTypes.NameIdentifier)?.Value;

    if (!int.TryParse(userIdValue, out var userId))
        return Unauthorized();

    var requests = await _context.MaintenanceRequests
        .Where(r => r.RequesterId == userId)
        .OrderByDescending(r => r.CreatedAt)
        .Select(r => new
        {
            r.Id,
            r.UnitId,
            FloorNo = r.Unit != null
                ? r.Unit.FloorNo
                : (int?)null,
            UnitNo = r.Unit != null
                ? r.Unit.UnitNo
                : (int?)null,
            r.Title,
            r.Description,
            r.Status,
            r.CreatedAt,
            r.UpdatedAt
        })
        .ToListAsync();

    return Ok(requests);
}


    
[HttpGet]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetAllRequests(
    [FromQuery] string? status)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var query = _context.MaintenanceRequests
        .Where(r => r.ApartmentId == apartmentId);

    if (!string.IsNullOrWhiteSpace(status))
    {
        var allowedStatuses = new[] 
        { 
            "Pending", 
            "InProgress", 
            "Completed" 
        };

        if (!allowedStatuses.Contains(status))
        {
            return BadRequest(new
            {
                message = "Geçersiz durum. Pending, InProgress veya Completed kullanın."
            });
        }

        query = query.Where(r => r.Status == status);
    }

    
var requests = await query
    .OrderByDescending(r => r.CreatedAt)
    .Select(r => new
    {
        r.Id,
        r.UnitId,
        FloorNo = r.Unit != null
            ? r.Unit.FloorNo
            : (int?)null,
        UnitNo = r.Unit != null
            ? r.Unit.UnitNo
            : (int?)null,
        RequesterName = r.Requester != null
            ? r.Requester.FullName
            : null,
        r.Title,
        r.Description,
        r.Status,
        r.CreatedAt,
        r.UpdatedAt,
        r.RequesterId
    })
    .ToListAsync();

return Ok(requests);

}


[HttpPut("{id}/status")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> UpdateRequestStatus(
    int id,
    [FromBody] UpdateMaintenanceRequestStatus request)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var allowedStatuses = new[]
    {
        "Pending",
        "InProgress",
        "Completed"
    };

    if (string.IsNullOrWhiteSpace(request.Status) ||
        !allowedStatuses.Contains(request.Status))
    {
        return BadRequest(new
        {
            message = "Geçersiz durum. Pending, InProgress veya Completed kullanın."
        });
    }

    var maintenanceRequest = await _context.MaintenanceRequests
        .FirstOrDefaultAsync(r =>
            r.Id == id &&
            r.ApartmentId == apartmentId);

    if (maintenanceRequest == null)
    {
        return NotFound(new
        {
            message = "Bakım talebi bulunamadı."
        });
    }

    maintenanceRequest.Status = request.Status;
    maintenanceRequest.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        maintenanceRequest.Id,
        maintenanceRequest.Title,
        maintenanceRequest.Status,
        maintenanceRequest.UpdatedAt
    });
}


}

public class CreateMaintenanceRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}


public class UpdateMaintenanceRequestStatus
{
    public string Status { get; set; } = string.Empty;
}