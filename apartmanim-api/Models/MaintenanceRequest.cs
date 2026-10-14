namespace apartmanim_api.Models;

public class MaintenanceRequest
{
    public int Id { get; set; }

    public int ApartmentId { get; set; }

    public int UnitId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Priority { get; set; } = "Medium";

    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public int RequesterId { get; set; }

    public Apartment? Apartment { get; set; }

    public Unit? Unit { get; set; }

    public User? Requester { get; set; }
}
