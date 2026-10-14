using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace apartmanim_api.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueUnitNumberIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateIndex(
        name: "IX_Units_ApartmentId_FloorNo_UnitNo",
        table: "Units",
        columns: new[] { "ApartmentId", "FloorNo", "UnitNo" },
        unique: true);
}

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Units_ApartmentId_FloorNo_UnitNo",
                table: "Units");
        }
    }
}
