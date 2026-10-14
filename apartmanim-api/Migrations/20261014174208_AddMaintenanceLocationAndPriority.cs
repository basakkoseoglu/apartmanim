using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace apartmanim_api.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceLocationAndPriority : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "MaintenanceRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "MaintenanceRequests",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Location",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "MaintenanceRequests");
        }
    }
}
