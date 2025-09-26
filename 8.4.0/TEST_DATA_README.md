# Attendance Module Test Data Setup

This document explains how to populate your database with test data for the Attendance Module.

## Test Data Overview

The test data includes:
- **5 Test Employees** with different roles and departments
- **4 Shift Types** (Morning, Evening, Night, Flexible)
- **30 days of Attendance Records** for each employee
- **4 Leave Types** (Vacation, Sick, Personal, Unpaid)
- **Leave Balances** for all employees
- **6 Leave Requests** with mixed statuses (Approved, Pending, Rejected)
- **11 Holidays** for 2024
- **4 Overtime Records**
- **2 Attendance Policies**

## Test Users

| Employee | ID | Position | Department | Shift | Manager |
|----------|-----|----------|------------|--------|---------|
| John Doe | EMP001 | Senior Developer | Engineering | Morning | - |
| Jane Smith | EMP002 | Team Lead | Engineering | Flexible | - |
| Bob Johnson | EMP003 | Developer | Engineering | Morning | Jane |
| Alice Williams | EMP004 | HR Manager | HR | Morning | - |
| Charlie Brown | EMP005 | Junior Developer | Engineering | Evening | Jane |

## Method 1: Using SQL Script

### For SQL Server:
```bash
# Navigate to the project directory
cd aspnet-core/src/AttendanceModule.EntityFrameworkCore

# Run the SQL script using SQL Server Management Studio or command line
sqlcmd -S localhost -d AttendanceModuleDb -i EntityFrameworkCore/Seed/TestData/AttendanceTestDataSeeder.sql
```

### For MySQL:
```bash
mysql -u root -p AttendanceModuleDb < EntityFrameworkCore/Seed/TestData/AttendanceTestDataSeeder.sql
```

### For PostgreSQL:
```bash
psql -U postgres -d AttendanceModuleDb -f EntityFrameworkCore/Seed/TestData/AttendanceTestDataSeeder.sql
```

## Method 2: Using C# Code (Programmatic)

### Option A: Add to Existing Seed Method

1. Open `AttendanceModuleEntityFrameworkModule.cs`
2. Add the following in the `PostInitialize` method:

```csharp
public override void PostInitialize()
{
    // ... existing code ...

    // Add test data seeding
    if (Configuration.UnitOfWork.IsTransactional)
    {
        using (var uow = IocManager.Resolve<IUnitOfWorkManager>().Begin())
        {
            var testDataBuilder = IocManager.Resolve<AttendanceTestDataBuilder>();
            testDataBuilder.Create();
            uow.Complete();
        }
    }
}
```

### Option B: Create a Custom Migration

1. Create a new migration:
```bash
Add-Migration AddTestData
```

2. In the migration file, add:
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Call the SQL script
    migrationBuilder.Sql(File.ReadAllText("EntityFrameworkCore/Seed/TestData/AttendanceTestDataSeeder.sql"));
}
```

3. Update the database:
```bash
Update-Database
```

### Option C: Create a Console Command

Create a new file `SeedTestDataCommand.cs`:

```csharp
using Abp.Dependency;
using AttendanceModule.EntityFrameworkCore.Seed.TestData;

public class SeedTestDataCommand : ITransientDependency
{
    private readonly AttendanceTestDataBuilder _testDataBuilder;

    public SeedTestDataCommand(AttendanceTestDataBuilder testDataBuilder)
    {
        _testDataBuilder = testDataBuilder;
    }

    public void Execute()
    {
        _testDataBuilder.Create();
        Console.WriteLine("Test data seeded successfully!");
    }
}
```

## Method 3: Using API Endpoint (Development Only)

Create a controller endpoint for seeding test data:

```csharp
[HttpPost]
[Route("api/services/app/TestData/SeedTestData")]
public async Task SeedTestData()
{
    // Check if in development environment
    if (_hostingEnvironment.IsDevelopment())
    {
        var testDataBuilder = _serviceProvider.GetService<AttendanceTestDataBuilder>();
        testDataBuilder.Create();
    }
}
```

## Verification

After seeding the test data, you can verify by:

1. **Check Employee Count:**
```sql
SELECT COUNT(*) FROM Employees; -- Should return at least 5
```

2. **Check Attendance Records:**
```sql
SELECT COUNT(*) FROM AttendanceEvents WHERE CreationTime > DATEADD(DAY, -30, GETDATE());
-- Should return ~300 records (30 days * 5 employees * 2 events per day)
```

3. **Check Leave Requests:**
```sql
SELECT Status, COUNT(*) FROM LeaveRequests GROUP BY Status;
-- Should show PENDING, APPROVED, and REJECTED statuses
```

## Testing Scenarios

With this test data, you can test:

1. **Clock In/Out:** Use any of the test employees to clock in/out
2. **Attendance History:** View 30 days of attendance records
3. **Leave Management:**
   - Submit new leave requests
   - View existing requests with different statuses
   - Check leave balances
4. **Manager Functions:** Login as Jane (EMP002) to approve/reject leaves
5. **Overtime:** View and manage overtime records
6. **Reports:** Generate attendance reports with substantial data

## Important Notes

- User IDs 2-6 must exist in the Users table before seeding
- The script assumes TenantId = 1
- All dates are relative to the current date for relevance
- Weekends are excluded from attendance records
- The script is idempotent (can be run multiple times safely)

## Cleanup

To remove test data:

```sql
-- Remove in reverse order of dependencies
DELETE FROM OvertimeRecords WHERE EmployeeId IN (SELECT Id FROM Employees WHERE EmployeeNumber LIKE 'EMP00%');
DELETE FROM LeaveRequests WHERE EmployeeId IN (SELECT Id FROM Employees WHERE EmployeeNumber LIKE 'EMP00%');
DELETE FROM LeaveBalances WHERE EmployeeId IN (SELECT Id FROM Employees WHERE EmployeeNumber LIKE 'EMP00%');
DELETE FROM AttendanceEvents WHERE EmployeeId IN (SELECT Id FROM Employees WHERE EmployeeNumber LIKE 'EMP00%');
DELETE FROM EmployeeShifts WHERE EmployeeId IN (SELECT Id FROM Employees WHERE EmployeeNumber LIKE 'EMP00%');
DELETE FROM Employees WHERE EmployeeNumber LIKE 'EMP00%';
DELETE FROM Shifts WHERE Name IN ('Morning Shift', 'Evening Shift', 'Night Shift', 'Flexible');
DELETE FROM LeaveTypes WHERE Code IN ('VAC', 'SICK', 'PER', 'UNPAID');
DELETE FROM Holidays WHERE YEAR(Date) = 2024;
DELETE FROM AttendancePolicies WHERE Name IN ('Standard Policy', 'Flexible Policy');
```

## Troubleshooting

1. **Foreign Key Errors:** Ensure Users with IDs 2-6 exist
2. **Duplicate Key Errors:** The script checks for existing records, but you may need to clear existing test data first
3. **Date Issues:** Adjust date calculations if testing in a different year
4. **Permission Issues:** Ensure the database user has INSERT permissions

## Contact

For issues or questions about the test data, please contact the development team.