
namespace apartmanim_api.Models;

public class Due
{
    public int Id { get; set; }

    public int UnitId { get; set; }

    public decimal Amount { get; set; }

    public DateTime DueDate { get; set; }

    public DateTime? PaidDate { get; set; }

    public string Status { get; set; } = "Pending";

    public Unit? Unit { get; set; }
}
