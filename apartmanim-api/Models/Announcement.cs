
namespace apartmanim_api.Models;

public class Announcement
{
    public int Id { get; set; }

    public int ApartmentId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public int AuthorId { get; set; }

    public Apartment? Apartment { get; set; }

    public User? Author { get; set; }
}
