
using apartmanim_api.Models;
using Microsoft.EntityFrameworkCore;

namespace apartmanim_api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Apartment> Apartments => Set<Apartment>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Due> Dues => Set<Due>();
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aynı apartmanda aynı kat ve daire numarası tekrarlanamaz.
modelBuilder.Entity<Unit>()
    .HasIndex(u => new { u.ApartmentId, u.FloorNo, u.UnitNo })
    .IsUnique();

// Bir sakin birden fazla daireye atanamaz.
// PostgreSQL birden fazla NULL değerine izin verir.
modelBuilder.Entity<Unit>()
    .HasIndex(u => u.ResidentId)
    .IsUnique();
    // Aynı apartmanda aynı kat ve daire numarası tekrarlanamaz.
modelBuilder.Entity<Unit>()
    .HasIndex(u => new { u.ApartmentId, u.FloorNo, u.UnitNo })
    .IsUnique();

        // E-posta adresleri benzersiz olmalı.
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Apartman - Daire: Bir apartmanın birden fazla dairesi olabilir.
        modelBuilder.Entity<Unit>()
            .HasOne(u => u.Apartment)
            .WithMany(a => a.Units)
            .HasForeignKey(u => u.ApartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Apartman - Kullanıcı
        modelBuilder.Entity<User>()
            .HasOne(u => u.Apartment)
            .WithMany()
            .HasForeignKey(u => u.ApartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Daire - Sakin: Bir daire en fazla bir sakine atanabilir.
        modelBuilder.Entity<Unit>()
            .HasOne(u => u.Resident)
            .WithOne(u => u.Unit)
            .HasForeignKey<Unit>(u => u.ResidentId)
            .OnDelete(DeleteBehavior.SetNull);

        // Apartman - Duyuru
        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.Apartment)
            .WithMany(a => a.Announcements)
            .HasForeignKey(a => a.ApartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Duyuru - Yazar
        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.Author)
            .WithMany()
            .HasForeignKey(a => a.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Daire - Aidat
        modelBuilder.Entity<Due>()
            .HasOne(d => d.Unit)
            .WithMany(u => u.Dues)
            .HasForeignKey(d => d.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Apartman - Bakım talebi
        modelBuilder.Entity<MaintenanceRequest>()
            .HasOne(m => m.Apartment)
            .WithMany(a => a.MaintenanceRequests)
            .HasForeignKey(m => m.ApartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Daire - Bakım talebi
        modelBuilder.Entity<MaintenanceRequest>()
            .HasOne(m => m.Unit)
            .WithMany()
            .HasForeignKey(m => m.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bakım talebi - Talebi oluşturan kullanıcı
        modelBuilder.Entity<MaintenanceRequest>()
            .HasOne(m => m.Requester)
            .WithMany()
            .HasForeignKey(m => m.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
