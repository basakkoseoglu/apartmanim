
namespace apartmanim_api.Models;

public class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = "Resident";

    public int ApartmentId { get; set; }

    public Apartment? Apartment { get; set; }

    public Unit? Unit { get; set; }
}
