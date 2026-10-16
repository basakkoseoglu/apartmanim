
using apartmanim_api.Data;
using apartmanim_api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace apartmanim_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;

    public AuthController(AppDbContext context)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
    }

   
[Authorize(Roles = "Admin")]
[HttpPost("residents")]
public async Task<IActionResult> CreateResident(
    [FromBody] CreateResidentRequest request)
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
    {
        return Unauthorized();
    }

    var email = request.Email.Trim().ToLowerInvariant();

    var emailExists = await _context.Users
        .AnyAsync(u => u.Email.ToLower() == email);

    if (emailExists)
    {
        return Conflict(new
        {
            message = "Bu e-posta adresi zaten kayıtlı."
        });
    }

    var unit = await _context.Units
        .FirstOrDefaultAsync(u =>
            u.Id == request.UnitId &&
            u.ApartmentId == apartmentId);

    if (unit is null)
    {
        return NotFound(new
        {
            message = "Seçilen daire bu apartmanda bulunamadı."
        });
    }

    if (unit.ResidentId != null)
    {
        return BadRequest(new
        {
            message = "Seçilen dairede zaten bir sakin bulunuyor."
        });
    }

    await using var transaction =
        await _context.Database.BeginTransactionAsync();

    try
    {
        var resident = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            ApartmentId = apartmentId,
            Role = "Resident",
            MustChangePassword = true
        };

        resident.PasswordHash = _passwordHasher.HashPassword(
            resident,
            request.TemporaryPassword);

        _context.Users.Add(resident);
        await _context.SaveChangesAsync();

        unit.ResidentId = resident.Id;
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return Created("", new
        {
            message = "Sakin başarıyla oluşturuldu ve daireye atandı.",
            resident = new
            {
                resident.Id,
                resident.FullName,
                resident.Email,
                resident.Role,
                resident.ApartmentId,
                resident.MustChangePassword
            },
            unit = new
            {
                unit.Id,
                unit.FloorNo,
                unit.UnitNo
            }
        });
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}

    [Authorize(Roles = "Admin")]
[HttpGet("residents")]
public async Task<IActionResult> GetResidents()
{
    var apartmentIdValue = User.FindFirst("ApartmentId")?.Value;

    if (!int.TryParse(apartmentIdValue, out var apartmentId))
        return Unauthorized();

    var residents = await _context.Users
        .Where(u =>
            u.ApartmentId == apartmentId &&
            u.Role == "Resident")
        .Select(u => new
        {
            u.Id,
            u.FullName,
            u.Email,
            Unit = _context.Units
                .Where(unit => unit.ResidentId == u.Id)
                .Select(unit => new
                {
                    unit.Id,
                    unit.FloorNo,
                    unit.UnitNo
                })
                .FirstOrDefault()
        })
        .ToListAsync();

    return Ok(residents);
}

[HttpPost("login")]
public async Task<IActionResult> Login(
    [FromBody] LoginRequest request)
{
    var email = request.Email.Trim().ToLowerInvariant();

    var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

    if (user is null)
    {
        return Unauthorized(new
        {
            message = "E-posta veya şifre hatalı."
        });
    }

    var result = _passwordHasher.VerifyHashedPassword(
        user,
        user.PasswordHash,
        request.Password);

    if (result == PasswordVerificationResult.Failed)
    {
        return Unauthorized(new
        {
            message = "E-posta veya şifre hatalı."
        });
    }

    // İlk girişte şifre değişimi gerekiyorsa
    // yalnızca şifre değiştirmeye izin veren token üret.
    var token = GenerateJwtToken(
        user,
        user.MustChangePassword
    );

    return Ok(new
    {
        message = "Giriş başarılı.",
        token,
        mustChangePassword = user.MustChangePassword,
        user = new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.ApartmentId
        }
    });
}


[Authorize]
[HttpPost("change-password")]
public async Task<IActionResult> ChangePassword(
    [FromBody] ChangePasswordRequest request)
{
    var userIdValue = User.FindFirst(
        ClaimTypes.NameIdentifier)?.Value;

    if (!int.TryParse(userIdValue, out var userId))
    {
        return Unauthorized();
    }

    var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Id == userId);

    if (user is null)
    {
        return Unauthorized();
    }

    var passwordChangeOnly = User.HasClaim(
        "PasswordChangeOnly", "true");

    if (!passwordChangeOnly && !user.MustChangePassword)
    {
        return BadRequest(new
        {
            message = "Şifre değiştirme işlemi gerekli değil."
        });
    }

    if (request.NewPassword != request.ConfirmPassword)
    {
        return BadRequest(new
        {
            message = "Yeni şifreler birbiriyle eşleşmiyor."
        });
    }

    if (request.NewPassword == request.CurrentPassword)
    {
        return BadRequest(new
        {
            message = "Yeni şifreniz mevcut şifrenizden farklı olmalı."
        });
    }

    var passwordResult = _passwordHasher.VerifyHashedPassword(
        user,
        user.PasswordHash,
        request.CurrentPassword);

    if (passwordResult == PasswordVerificationResult.Failed)
    {
        return BadRequest(new
        {
            message = "Mevcut şifreniz hatalı."
        });
    }

    user.PasswordHash = _passwordHasher.HashPassword(
        user,
        request.NewPassword);

    user.MustChangePassword = false;

    await _context.SaveChangesAsync();

    // Şifre değişince normal yetkili yeni token üret.
    var token = GenerateJwtToken(user);

    return Ok(new
    {
        message = "Şifreniz başarıyla değiştirildi.",
        token,
        mustChangePassword = false
    });
}


[Authorize]
[HttpGet("me")]
public IActionResult Me()
{
    return Ok(new
    {
        message = "JWT doğrulandı.",
        userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
        email = User.FindFirst(ClaimTypes.Email)?.Value,
        role = User.FindFirst(ClaimTypes.Role)?.Value
    });
}
[Authorize(Roles = "Admin")]
[HttpGet("admin-test")]
public IActionResult AdminTest()
{
    return Ok(new
    {
        message = "Yönetici erişimi başarılı."
    });
}


private string GenerateJwtToken(
    User user,
    bool passwordChangeOnly = false)
{
    var jwtSettings = HttpContext.RequestServices
        .GetRequiredService<IConfiguration>();

    var key = jwtSettings["Jwt:Key"]!;
    var issuer = jwtSettings["Jwt:Issuer"]!;
    var audience = jwtSettings["Jwt:Audience"]!;
    var expiresInMinutes = int.Parse(
        jwtSettings["Jwt:ExpiresInMinutes"]!);

    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.FullName),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role),
        new Claim("ApartmentId", user.ApartmentId.ToString()),
        new Claim(
            "MustChangePassword",
            passwordChangeOnly.ToString().ToLowerInvariant())
    };

    if (passwordChangeOnly)
    {
        claims.Add(new Claim("PasswordChangeOnly", "true"));
    }

    var securityKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(key));

    var credentials = new SigningCredentials(
        securityKey,
        SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
}

}


public class CreateResidentRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [StringLength(128)]
    public string TemporaryPassword { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int UnitId { get; set; }
}


public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;
}


public class ChangePasswordRequest
{
    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string ConfirmPassword { get; set; } = string.Empty;
}
