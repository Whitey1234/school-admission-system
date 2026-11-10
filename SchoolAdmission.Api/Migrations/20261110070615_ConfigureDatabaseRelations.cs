using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAdmission.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConfigureDatabaseRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Holds_Classes_SchoolClassId",
                table: "Holds");

            migrationBuilder.DropIndex(
                name: "IX_Holds_SchoolClassId",
                table: "Holds");

            migrationBuilder.DropIndex(
                name: "IX_Holds_StudentId",
                table: "Holds");

            migrationBuilder.DropColumn(
                name: "SchoolClassId",
                table: "Holds");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Classes",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Students_Email",
                table: "Students",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Holds_ClassId",
                table: "Holds",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Holds_StudentId_ClassId",
                table: "Holds",
                columns: new[] { "StudentId", "ClassId" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Classes_TotalSeats",
                table: "Classes",
                sql: "\"TotalSeats\" >= 0");

            migrationBuilder.AddForeignKey(
                name: "FK_Holds_Classes_ClassId",
                table: "Holds",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Holds_Classes_ClassId",
                table: "Holds");

            migrationBuilder.DropIndex(
                name: "IX_Students_Email",
                table: "Students");

            migrationBuilder.DropIndex(
                name: "IX_Holds_ClassId",
                table: "Holds");

            migrationBuilder.DropIndex(
                name: "IX_Holds_StudentId_ClassId",
                table: "Holds");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Classes_TotalSeats",
                table: "Classes");

            migrationBuilder.AddColumn<Guid>(
                name: "SchoolClassId",
                table: "Holds",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Classes",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);

            migrationBuilder.CreateIndex(
                name: "IX_Holds_SchoolClassId",
                table: "Holds",
                column: "SchoolClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Holds_StudentId",
                table: "Holds",
                column: "StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Holds_Classes_SchoolClassId",
                table: "Holds",
                column: "SchoolClassId",
                principalTable: "Classes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
