using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace apartmanim_api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateApartmentModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Announcements_Users_CreatedById",
                table: "Announcements");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Users_CreatedById",
                table: "MaintenanceRequests");

            migrationBuilder.DropIndex(
                name: "IX_Units_ResidentId",
                table: "Units");

            migrationBuilder.DropIndex(
                name: "IX_Dues_UnitId_Month_Year",
                table: "Dues");

            migrationBuilder.DropColumn(
                name: "IsPaid",
                table: "Dues");

            migrationBuilder.DropColumn(
                name: "Month",
                table: "Dues");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "Dues");

            migrationBuilder.RenameColumn(
                name: "UnitNumber",
                table: "Units",
                newName: "UnitNo");

            migrationBuilder.RenameColumn(
                name: "Floor",
                table: "Units",
                newName: "FloorNo");

            migrationBuilder.RenameColumn(
                name: "CreatedById",
                table: "MaintenanceRequests",
                newName: "RequesterId");

            migrationBuilder.RenameIndex(
                name: "IX_MaintenanceRequests_CreatedById",
                table: "MaintenanceRequests",
                newName: "IX_MaintenanceRequests_RequesterId");

            migrationBuilder.RenameColumn(
                name: "CreatedById",
                table: "Announcements",
                newName: "AuthorId");

            migrationBuilder.RenameIndex(
                name: "IX_Announcements_CreatedById",
                table: "Announcements",
                newName: "IX_Announcements_AuthorId");

            migrationBuilder.AddColumn<int>(
                name: "ApartmentId",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ApartmentId",
                table: "Units",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ApartmentId",
                table: "MaintenanceRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "MaintenanceRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidDate",
                table: "Dues",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Dues",
                type: "text",
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<int>(
                name: "ApartmentId",
                table: "Announcements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Announcements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Apartments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    TotalFloors = table.Column<int>(type: "integer", nullable: false),
                    TotalUnits = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Apartments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ApartmentId",
                table: "Users",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_ApartmentId",
                table: "Units",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_ResidentId",
                table: "Units",
                column: "ResidentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequests_ApartmentId",
                table: "MaintenanceRequests",
                column: "ApartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Dues_UnitId",
                table: "Dues",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_ApartmentId",
                table: "Announcements",
                column: "ApartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Announcements_Apartments_ApartmentId",
                table: "Announcements",
                column: "ApartmentId",
                principalTable: "Apartments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Announcements_Users_AuthorId",
                table: "Announcements",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Apartments_ApartmentId",
                table: "MaintenanceRequests",
                column: "ApartmentId",
                principalTable: "Apartments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Users_RequesterId",
                table: "MaintenanceRequests",
                column: "RequesterId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Units_Apartments_ApartmentId",
                table: "Units",
                column: "ApartmentId",
                principalTable: "Apartments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Apartments_ApartmentId",
                table: "Users",
                column: "ApartmentId",
                principalTable: "Apartments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Announcements_Apartments_ApartmentId",
                table: "Announcements");

            migrationBuilder.DropForeignKey(
                name: "FK_Announcements_Users_AuthorId",
                table: "Announcements");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Apartments_ApartmentId",
                table: "MaintenanceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Users_RequesterId",
                table: "MaintenanceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Units_Apartments_ApartmentId",
                table: "Units");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Apartments_ApartmentId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Apartments");

            migrationBuilder.DropIndex(
                name: "IX_Users_ApartmentId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Units_ApartmentId",
                table: "Units");

            migrationBuilder.DropIndex(
                name: "IX_Units_ResidentId",
                table: "Units");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRequests_ApartmentId",
                table: "MaintenanceRequests");

            migrationBuilder.DropIndex(
                name: "IX_Dues_UnitId",
                table: "Dues");

            migrationBuilder.DropIndex(
                name: "IX_Announcements_ApartmentId",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "ApartmentId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ApartmentId",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "ApartmentId",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "PaidDate",
                table: "Dues");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Dues");

            migrationBuilder.DropColumn(
                name: "ApartmentId",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Announcements");

            migrationBuilder.RenameColumn(
                name: "UnitNo",
                table: "Units",
                newName: "UnitNumber");

            migrationBuilder.RenameColumn(
                name: "FloorNo",
                table: "Units",
                newName: "Floor");

            migrationBuilder.RenameColumn(
                name: "RequesterId",
                table: "MaintenanceRequests",
                newName: "CreatedById");

            migrationBuilder.RenameIndex(
                name: "IX_MaintenanceRequests_RequesterId",
                table: "MaintenanceRequests",
                newName: "IX_MaintenanceRequests_CreatedById");

            migrationBuilder.RenameColumn(
                name: "AuthorId",
                table: "Announcements",
                newName: "CreatedById");

            migrationBuilder.RenameIndex(
                name: "IX_Announcements_AuthorId",
                table: "Announcements",
                newName: "IX_Announcements_CreatedById");

            migrationBuilder.AddColumn<bool>(
                name: "IsPaid",
                table: "Dues",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Month",
                table: "Dues",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Dues",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Units_ResidentId",
                table: "Units",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_Dues_UnitId_Month_Year",
                table: "Dues",
                columns: new[] { "UnitId", "Month", "Year" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Announcements_Users_CreatedById",
                table: "Announcements",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Users_CreatedById",
                table: "MaintenanceRequests",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
