using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace apartmanim_api.Migrations
{
    /// <inheritdoc />
    public partial class AddApartmentSetupStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSetupComplete",
                table: "Apartments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSetupComplete",
                table: "Apartments");
        }
    }
}
