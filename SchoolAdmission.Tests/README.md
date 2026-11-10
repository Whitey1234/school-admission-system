# Integration tests

The tests use the real PostgreSQL provider so PostgreSQL transactions and row
locking are exercised. Before running them, create a dedicated PostgreSQL
database whose name ends in `_test`, for example `school_admission_test`, and
set the test-only connection string:

```bash
export SCHOOL_ADMISSION_TEST_CONNECTION_STRING='Host=localhost;Database=school_admission_test;Username=<test-user>;Password=<test-password>'
dotnet test
```

The test host rejects connection strings for databases not named with the
`_test` suffix. It runs the application's existing EF migrations on that
database and removes only the class and student rows created by each test. The
test host overrides the application's connection setting with this test-only
connection string; it does not drop the database.
