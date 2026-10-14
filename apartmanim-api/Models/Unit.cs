
namespace apartmanim_api.Models;

public class Unit
{
    public int Id { get; set; }

    public int ApartmentId { get; set; }

    public int FloorNo { get; set; }

    public int UnitNo { get; set; }

    public int? ResidentId { get; set; }

    public Apartment? Apartment { get; set; }

    public User? Resident { get; set; }

    public ICollection<Due> Dues { get; set; } = new List<Due>();
}
