
namespace apartmanim_api.Models;

public class Apartment
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public int TotalFloors { get; set; }

    public int TotalUnits { get; set; }

    public ICollection<Unit> Units { get; set; } = new List<Unit>();

    public ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();

    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
}
