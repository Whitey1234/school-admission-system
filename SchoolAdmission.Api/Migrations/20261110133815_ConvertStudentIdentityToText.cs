using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolAdmission.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConvertStudentIdentityToText : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Holds_Students_StudentId",
                table: "Holds");

            migrationBuilder.Sql(
                """ALTER TABLE "Students" ALTER COLUMN "Id" TYPE character varying(36) USING "Id"::text;""");

            migrationBuilder.Sql(
                """ALTER TABLE "Holds" ALTER COLUMN "StudentId" TYPE character varying(36) USING "StudentId"::text;""");

            migrationBuilder.AddForeignKey(
                name: "FK_Holds_Students_StudentId",
                table: "Holds",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Holds_Students_StudentId",
                table: "Holds");

            migrationBuilder.Sql(
                """ALTER TABLE "Holds" ALTER COLUMN "StudentId" TYPE uuid USING "StudentId"::uuid;""");

            migrationBuilder.Sql(
                """ALTER TABLE "Students" ALTER COLUMN "Id" TYPE uuid USING "Id"::uuid;""");

            migrationBuilder.AddForeignKey(
                name: "FK_Holds_Students_StudentId",
                table: "Holds",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
