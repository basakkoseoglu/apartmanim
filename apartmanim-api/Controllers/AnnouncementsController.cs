
using apartmanim_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace apartmanim_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AnnouncementsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnnouncements()
    {
        var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

        if (!int.TryParse(apartmentIdValue, out var apartmentId))
        {
            return Unauthorized();
        }

        var announcements = await _context.Announcements
            .Where(a => a.ApartmentId == apartmentId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Content,
                a.CreatedAt,
                a.UpdatedAt,
                a.ApartmentId,
                a.AuthorId
            })
            .ToListAsync();

        return Ok(announcements);
        
    }
    
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAnnouncement(
        [FromBody] CreateAnnouncementRequest request)
    {
        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

        if (!int.TryParse(userIdValue, out var userId) ||
            !int.TryParse(apartmentIdValue, out var apartmentId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new
            {
                message = "Başlık ve içerik zorunludur."
            });
        }

        var announcement = new apartmanim_api.Models.Announcement
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            ApartmentId = apartmentId,
            AuthorId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        return Created(
            $"/api/announcements",
            new
            {
                announcement.Id,
                announcement.Title,
                announcement.Content,
                announcement.CreatedAt,
                announcement.ApartmentId,
                announcement.AuthorId
            });
    }
    
[HttpPut("{id}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> UpdateAnnouncement(
    int id,
    [FromBody] UpdateAnnouncementRequest request)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    if (string.IsNullOrWhiteSpace(request.Title) ||
        string.IsNullOrWhiteSpace(request.Content))
    {
        return BadRequest(new
        {
            message = "Başlık ve içerik zorunludur."
        });
    }

    var announcement = await _context.Announcements
        .FirstOrDefaultAsync(a =>
            a.Id == id &&
            a.ApartmentId == apartmentId);

    if (announcement == null)
        return NotFound(new { message = "Duyuru bulunamadı." });

    announcement.Title = request.Title.Trim();
    announcement.Content = request.Content.Trim();
    announcement.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        announcement.Id,
        announcement.Title,
        announcement.Content,
        announcement.CreatedAt,
        announcement.UpdatedAt,
        announcement.ApartmentId,
        announcement.AuthorId
    });
}

[HttpDelete("{id}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> DeleteAnnouncement(int id)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var announcement = await _context.Announcements
        .FirstOrDefaultAsync(a =>
            a.Id == id &&
            a.ApartmentId == apartmentId);

    if (announcement == null)
        return NotFound(new
        {
            message = "Duyuru bulunamadı."
        });

    _context.Announcements.Remove(announcement);
    await _context.SaveChangesAsync();

    return NoContent();
}

}

public class CreateAnnouncementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}


public class UpdateAnnouncementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
