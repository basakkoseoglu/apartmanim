
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

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email);

        if (existingUser)
        {
            return Conflict(new
            {
                message = "Bu e-posta adresi zaten kayıtlı."
            });
        }

        var apartmentExists = await _context.Apartments
            .AnyAsync(a => a.Id == request.ApartmentId);

        if (!apartmentExists)
        {
            return BadRequest(new
            {
                message = "Belirtilen apartman bulunamadı."
            });
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            ApartmentId = request.ApartmentId,
            Role = "Resident"
        };

        user.PasswordHash = _passwordHasher.HashPassword(
            user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Created("", new
        {
            message = "Kullanıcı başarıyla kaydedildi.",
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.ApartmentId
        });
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

    // JWT üretimini bir sonraki adımda ekleyeceğiz.
    var token = GenerateJwtToken(user);

return Ok(new
{
    message = "Giriş başarılı.",
    token,
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

private string GenerateJwtToken(User user)
{
    var jwtSettings = HttpContext.RequestServices
        .GetRequiredService<IConfiguration>();

    var key = jwtSettings["Jwt:Key"]!;
    var issuer = jwtSettings["Jwt:Issuer"]!;
    var audience = jwtSettings["Jwt:Audience"]!;
    var expiresInMinutes = int.Parse(
        jwtSettings["Jwt:ExpiresInMinutes"]!);

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.FullName),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role),
        new Claim("ApartmentId", user.ApartmentId.ToString())
    };

    var securityKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(key));

    var credentials = new SigningCredentials(
        securityKey, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
}

}

public class RegisterRequest
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
    public string Password { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int ApartmentId { get; set; }
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
