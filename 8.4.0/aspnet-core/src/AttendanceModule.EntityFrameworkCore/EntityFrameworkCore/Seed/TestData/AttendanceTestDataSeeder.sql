-- =====================================================
-- Attendance Module Test Data Seeder Script
-- =====================================================
-- This script inserts test data for all attendance-related tables
-- Run this after migrations have been applied
-- =====================================================

-- Disable foreign key checks temporarily (for SQL Server)
-- For MySQL use: SET FOREIGN_KEY_CHECKS = 0;
-- For PostgreSQL: SET session_replication_role = 'replica';

-- =====================================================
-- 1. Insert Test Employees (if not exists)
-- =====================================================
-- Assuming you have Users table with IDs 1-5
-- Creating corresponding Employee records

INSERT INTO Employees (EmployeeNumber, FirstName, LastName, Email, Phone, Department, Position, HireDate, ManagerId, UserId, TenantId, IsDeleted, CreationTime, CreatorUserId)
SELECT * FROM (
    SELECT 'EMP001' as EmployeeNumber, 'John' as FirstName, 'Doe' as LastName, 'john.doe@company.com' as Email, '555-0101' as Phone,
           'Engineering' as Department, 'Senior Developer' as Position, '2020-01-15' as HireDate, NULL as ManagerId, 2 as UserId, 1 as TenantId,
           0 as IsDeleted, GETDATE() as CreationTime, 1 as CreatorUserId
    UNION ALL
    SELECT 'EMP002', 'Jane', 'Smith', 'jane.smith@company.com', '555-0102', 'Engineering', 'Team Lead', '2019-06-01', NULL, 3, 1, 0, GETDATE(), 1
    UNION ALL
    SELECT 'EMP003', 'Bob', 'Johnson', 'bob.johnson@company.com', '555-0103', 'Engineering', 'Developer', '2021-03-20', 2, 4, 1, 0, GETDATE(), 1
    UNION ALL
    SELECT 'EMP004', 'Alice', 'Williams', 'alice.williams@company.com', '555-0104', 'HR', 'HR Manager', '2018-11-10', NULL, 5, 1, 0, GETDATE(), 1
    UNION ALL
    SELECT 'EMP005', 'Charlie', 'Brown', 'charlie.brown@company.com', '555-0105', 'Engineering', 'Junior Developer', '2022-07-01', 2, 6, 1, 0, GETDATE(), 1
) AS NewEmployees
WHERE NOT EXISTS (
    SELECT 1 FROM Employees WHERE EmployeeNumber = NewEmployees.EmployeeNumber
);

-- Get Employee IDs for reference
DECLARE @JohnId INT = (SELECT Id FROM Employees WHERE EmployeeNumber = 'EMP001');
DECLARE @JaneId INT = (SELECT Id FROM Employees WHERE EmployeeNumber = 'EMP002');
DECLARE @BobId INT = (SELECT Id FROM Employees WHERE EmployeeNumber = 'EMP003');
DECLARE @AliceId INT = (SELECT Id FROM Employees WHERE EmployeeNumber = 'EMP004');
DECLARE @CharlieId INT = (SELECT Id FROM Employees WHERE EmployeeNumber = 'EMP005');

-- =====================================================
-- 2. Insert Shifts
-- =====================================================
DELETE FROM Shifts WHERE Name IN ('Morning Shift', 'Evening Shift', 'Night Shift', 'Flexible');

INSERT INTO Shifts (Name, StartTime, EndTime, Description, IsActive, TenantId, CreationTime, CreatorUserId)
VALUES
    ('Morning Shift', '09:00:00', '17:00:00', 'Standard morning shift with 1 hour lunch break', 1, 1, GETDATE(), 1),
    ('Evening Shift', '14:00:00', '22:00:00', 'Evening shift for extended coverage', 1, 1, GETDATE(), 1),
    ('Night Shift', '22:00:00', '06:00:00', 'Overnight shift for 24/7 operations', 1, 1, GETDATE(), 1),
    ('Flexible', '08:00:00', '18:00:00', 'Flexible working hours', 1, 1, GETDATE(), 1);

-- Get Shift IDs
DECLARE @MorningShiftId INT = (SELECT Id FROM Shifts WHERE Name = 'Morning Shift');
DECLARE @EveningShiftId INT = (SELECT Id FROM Shifts WHERE Name = 'Evening Shift');
DECLARE @FlexibleShiftId INT = (SELECT Id FROM Shifts WHERE Name = 'Flexible');

-- =====================================================
-- 3. Insert Employee Shifts
-- =====================================================
DELETE FROM EmployeeShifts WHERE EmployeeId IN (@JohnId, @JaneId, @BobId, @AliceId, @CharlieId);

INSERT INTO EmployeeShifts (EmployeeId, ShiftId, StartDate, EndDate, IsActive, TenantId, CreationTime, CreatorUserId)
VALUES
    (@JohnId, @MorningShiftId, '2024-01-01', NULL, 1, 1, GETDATE(), 1),
    (@JaneId, @FlexibleShiftId, '2024-01-01', NULL, 1, 1, GETDATE(), 1),
    (@BobId, @MorningShiftId, '2024-01-01', NULL, 1, 1, GETDATE(), 1),
    (@AliceId, @MorningShiftId, '2024-01-01', NULL, 1, 1, GETDATE(), 1),
    (@CharlieId, @EveningShiftId, '2024-01-01', NULL, 1, 1, GETDATE(), 1);

-- =====================================================
-- 4. Insert Attendance Events (Last 30 days)
-- =====================================================
-- Clear existing test data for these employees
DELETE FROM AttendanceEvents WHERE EmployeeId IN (@JohnId, @JaneId, @BobId, @AliceId, @CharlieId);

-- Generate attendance records for the last 30 days
DECLARE @Date DATE = DATEADD(DAY, -30, GETDATE());
DECLARE @Today DATE = GETDATE();

WHILE @Date <= @Today
BEGIN
    -- Skip weekends
    IF DATEPART(WEEKDAY, @Date) NOT IN (1, 7)
    BEGIN
        -- John - Regular attendance
        INSERT INTO AttendanceEvents (EmployeeId, EventType, EventTime, Source, Latitude, Longitude, Notes, TenantId, CreationTime, CreatorUserId)
        VALUES
            (@JohnId, 'CLOCK_IN', DATEADD(HOUR, 9, CAST(@Date AS DATETIME)), 'Web', 40.7128, -74.0060, 'On time', 1, @Date, @JohnId),
            (@JohnId, 'CLOCK_OUT', DATEADD(HOUR, 17, CAST(@Date AS DATETIME)), 'Web', 40.7128, -74.0060, NULL, 1, @Date, @JohnId);

        -- Jane - Flexible hours
        INSERT INTO AttendanceEvents (EmployeeId, EventType, EventTime, Source, Latitude, Longitude, Notes, TenantId, CreationTime, CreatorUserId)
        VALUES
            (@JaneId, 'CLOCK_IN', DATEADD(HOUR, 8, DATEADD(MINUTE, 30, CAST(@Date AS DATETIME))), 'Mobile', 40.7128, -74.0060, NULL, 1, @Date, @JaneId),
            (@JaneId, 'CLOCK_OUT', DATEADD(HOUR, 18, DATEADD(MINUTE, 15, CAST(@Date AS DATETIME))), 'Mobile', 40.7128, -74.0060, NULL, 1, @Date, @JaneId);

        -- Bob - Sometimes late
        IF DAY(@Date) % 3 = 0
        BEGIN
            INSERT INTO AttendanceEvents (EmployeeId, EventType, EventTime, Source, Latitude, Longitude, Notes, TenantId, CreationTime, CreatorUserId)
            VALUES
                (@BobId, 'CLOCK_IN', DATEADD(HOUR, 9, DATEADD(MINUTE, 15, CAST(@Date AS DATETIME))), 'Web', 40.7128, -74.0060, 'Traffic delay', 1, @Date, @BobId),
                (@BobId, 'CLOCK_OUT', DATEADD(HOUR, 17, DATEADD(MINUTE, 30, CAST(@Date AS DATETIME))), 'Web', 40.7128, -74.0060, NULL, 1, @Date, @BobId);
        END
        ELSE
        BEGIN
            INSERT INTO AttendanceEvents (EmployeeId, EventType, EventTime, Source, Latitude, Longitude, Notes, TenantId, CreationTime, CreatorUserId)
            VALUES
                (@BobId, 'CLOCK_IN', DATEADD(HOUR, 8, DATEADD(MINUTE, 55, CAST(@Date AS DATETIME))), 'Web', 40.7128, -74.0060, NULL, 1, @Date, @BobId),
                (@BobId, 'CLOCK_OUT', DATEADD(HOUR, 17, CAST(@Date AS DATETIME)), 'Web', 40.7128, -74.0060, NULL, 1, @Date, @BobId);
        END

        -- Alice - HR Regular
        INSERT INTO AttendanceEvents (EmployeeId, EventType, EventTime, Source, Latitude, Longitude, Notes, TenantId, CreationTime, CreatorUserId)
        VALUES
            (@AliceId, 'CLOCK_IN', DATEADD(HOUR, 9, CAST(@Date AS DATETIME)), 'Biometric', NULL, NULL, NULL, 1, @Date, @AliceId),
            (@AliceId, 'CLOCK_OUT', DATEADD(HOUR, 17, CAST(@Date AS DATETIME)), 'Biometric', NULL, NULL, NULL, 1, @Date, @AliceId);

        -- Charlie - Evening shift (not on Fridays)
        IF DATEPART(WEEKDAY, @Date) <> 6
        BEGIN
            INSERT INTO AttendanceEvents (EmployeeId, EventType, EventTime, Source, Latitude, Longitude, Notes, TenantId, CreationTime, CreatorUserId)
            VALUES
                (@CharlieId, 'CLOCK_IN', DATEADD(HOUR, 14, CAST(@Date AS DATETIME)), 'Web', 40.7128, -74.0060, NULL, 1, @Date, @CharlieId),
                (@CharlieId, 'CLOCK_OUT', DATEADD(HOUR, 22, CAST(@Date AS DATETIME)), 'Web', 40.7128, -74.0060, NULL, 1, @Date, @CharlieId);
        END
    END

    SET @Date = DATEADD(DAY, 1, @Date);
END

-- =====================================================
-- 5. Insert Leave Types
-- =====================================================
DELETE FROM LeaveTypes WHERE Code IN ('VAC', 'SICK', 'PER', 'UNPAID');

INSERT INTO LeaveTypes (Code, Name, Description, DefaultDays, IsActive, TenantId, CreationTime, CreatorUserId)
VALUES
    ('VAC', 'Vacation', 'Annual vacation leave', 21, 1, 1, GETDATE(), 1),
    ('SICK', 'Sick Leave', 'Medical/sick leave', 10, 1, 1, GETDATE(), 1),
    ('PER', 'Personal', 'Personal time off', 5, 1, 1, GETDATE(), 1),
    ('UNPAID', 'Unpaid Leave', 'Leave without pay', 0, 1, 1, GETDATE(), 1);

-- Get Leave Type IDs
DECLARE @VacationId INT = (SELECT Id FROM LeaveTypes WHERE Code = 'VAC');
DECLARE @SickId INT = (SELECT Id FROM LeaveTypes WHERE Code = 'SICK');
DECLARE @PersonalId INT = (SELECT Id FROM LeaveTypes WHERE Code = 'PER');

-- =====================================================
-- 6. Insert Leave Balances
-- =====================================================
DELETE FROM LeaveBalances WHERE EmployeeId IN (@JohnId, @JaneId, @BobId, @AliceId, @CharlieId);

INSERT INTO LeaveBalances (EmployeeId, LeaveTypeId, Year, TotalAllocation, UsedDays, AvailableDays, TenantId, CreationTime, CreatorUserId)
VALUES
    -- John's balances
    (@JohnId, @VacationId, 2024, 21, 5, 16, 1, GETDATE(), 1),
    (@JohnId, @SickId, 2024, 10, 2, 8, 1, GETDATE(), 1),
    (@JohnId, @PersonalId, 2024, 5, 1, 4, 1, GETDATE(), 1),

    -- Jane's balances
    (@JaneId, @VacationId, 2024, 21, 10, 11, 1, GETDATE(), 1),
    (@JaneId, @SickId, 2024, 10, 0, 10, 1, GETDATE(), 1),
    (@JaneId, @PersonalId, 2024, 5, 3, 2, 1, GETDATE(), 1),

    -- Bob's balances
    (@BobId, @VacationId, 2024, 21, 15, 6, 1, GETDATE(), 1),
    (@BobId, @SickId, 2024, 10, 5, 5, 1, GETDATE(), 1),
    (@BobId, @PersonalId, 2024, 5, 2, 3, 1, GETDATE(), 1),

    -- Alice's balances
    (@AliceId, @VacationId, 2024, 21, 7, 14, 1, GETDATE(), 1),
    (@AliceId, @SickId, 2024, 10, 1, 9, 1, GETDATE(), 1),
    (@AliceId, @PersonalId, 2024, 5, 0, 5, 1, GETDATE(), 1),

    -- Charlie's balances
    (@CharlieId, @VacationId, 2024, 15, 3, 12, 1, GETDATE(), 1),
    (@CharlieId, @SickId, 2024, 10, 0, 10, 1, GETDATE(), 1),
    (@CharlieId, @PersonalId, 2024, 5, 1, 4, 1, GETDATE(), 1);

-- =====================================================
-- 7. Insert Leave Requests
-- =====================================================
DELETE FROM LeaveRequests WHERE EmployeeId IN (@JohnId, @JaneId, @BobId, @AliceId, @CharlieId);

INSERT INTO LeaveRequests (EmployeeId, LeaveTypeId, StartDate, EndDate, Reason, Status, ApproverId, ApprovalDate, Comments, TenantId, CreationTime, CreatorUserId)
VALUES
    -- Past approved leaves
    (@JohnId, @VacationId, '2024-11-01', '2024-11-05', 'Family vacation', 'APPROVED', @JaneId, '2024-10-25', 'Approved', 1, '2024-10-20', @JohnId),
    (@BobId, @SickId, '2024-11-10', '2024-11-12', 'Medical appointment', 'APPROVED', @JaneId, '2024-11-09', 'Get well soon', 1, '2024-11-08', @BobId),

    -- Current pending requests
    (@JohnId, @PersonalId, '2024-12-20', '2024-12-20', 'Personal errands', 'PENDING', @JaneId, NULL, NULL, 1, DATEADD(DAY, -2, GETDATE()), @JohnId),
    (@CharlieId, @VacationId, '2024-12-23', '2024-12-27', 'Christmas holidays', 'PENDING', @JaneId, NULL, NULL, 1, DATEADD(DAY, -3, GETDATE()), @CharlieId),

    -- Future approved leave
    (@AliceId, @VacationId, '2024-12-26', '2024-12-30', 'Year-end vacation', 'APPROVED', @JaneId, DATEADD(DAY, -5, GETDATE()), 'Enjoy your vacation', 1, DATEADD(DAY, -7, GETDATE()), @AliceId),

    -- Rejected request
    (@BobId, @VacationId, '2024-12-15', '2024-12-25', 'Extended holiday', 'REJECTED', @JaneId, DATEADD(DAY, -1, GETDATE()), 'Too many people already on leave', 1, DATEADD(DAY, -4, GETDATE()), @BobId);

-- =====================================================
-- 8. Insert Holidays
-- =====================================================
DELETE FROM Holidays WHERE YEAR(Date) = 2024;

INSERT INTO Holidays (Name, Date, Description, IsRecurring, TenantId, CreationTime, CreatorUserId)
VALUES
    ('New Year''s Day', '2024-01-01', 'New Year celebration', 1, 1, GETDATE(), 1),
    ('Martin Luther King Jr. Day', '2024-01-15', 'MLK Day', 1, 1, GETDATE(), 1),
    ('Presidents Day', '2024-02-19', 'Presidents Day', 1, 1, GETDATE(), 1),
    ('Memorial Day', '2024-05-27', 'Memorial Day', 1, 1, GETDATE(), 1),
    ('Independence Day', '2024-07-04', 'July 4th', 1, 1, GETDATE(), 1),
    ('Labor Day', '2024-09-02', 'Labor Day', 1, 1, GETDATE(), 1),
    ('Thanksgiving', '2024-11-28', 'Thanksgiving Day', 1, 1, GETDATE(), 1),
    ('Day After Thanksgiving', '2024-11-29', 'Black Friday', 0, 1, GETDATE(), 1),
    ('Christmas Eve', '2024-12-24', 'Christmas Eve', 1, 1, GETDATE(), 1),
    ('Christmas Day', '2024-12-25', 'Christmas Day', 1, 1, GETDATE(), 1),
    ('New Year''s Eve', '2024-12-31', 'New Year''s Eve', 0, 1, GETDATE(), 1);

-- =====================================================
-- 9. Insert Overtime Records
-- =====================================================
DELETE FROM OvertimeRecords WHERE EmployeeId IN (@JohnId, @JaneId, @BobId, @AliceId, @CharlieId);

INSERT INTO OvertimeRecords (EmployeeId, Date, Hours, Rate, Reason, Status, ApproverId, TenantId, CreationTime, CreatorUserId)
VALUES
    (@JohnId, DATEADD(DAY, -10, GETDATE()), 2.5, 1.5, 'Project deadline', 'APPROVED', @JaneId, 1, DATEADD(DAY, -10, GETDATE()), @JohnId),
    (@BobId, DATEADD(DAY, -7, GETDATE()), 3.0, 1.5, 'Emergency fix', 'APPROVED', @JaneId, 1, DATEADD(DAY, -7, GETDATE()), @BobId),
    (@JaneId, DATEADD(DAY, -5, GETDATE()), 4.0, 2.0, 'Weekend deployment', 'APPROVED', @AliceId, 1, DATEADD(DAY, -5, GETDATE()), @JaneId),
    (@CharlieId, DATEADD(DAY, -2, GETDATE()), 1.5, 1.5, 'Extended support', 'PENDING', @JaneId, 1, DATEADD(DAY, -2, GETDATE()), @CharlieId);

-- =====================================================
-- 10. Insert Attendance Policies
-- =====================================================
DELETE FROM AttendancePolicies WHERE Name IN ('Standard Policy', 'Flexible Policy');

INSERT INTO AttendancePolicies (Name, Description, GracePeriodMinutes, MinHoursPerDay, RequirePhotoVerification, RequireLocationTracking, IsActive, TenantId, CreationTime, CreatorUserId)
VALUES
    ('Standard Policy', 'Standard 9-5 attendance policy with 15 min grace period', 15, 8, 0, 1, 1, 1, GETDATE(), 1),
    ('Flexible Policy', 'Flexible working hours policy', 30, 7, 0, 0, 1, 1, GETDATE(), 1);

-- =====================================================
-- Summary
-- =====================================================
PRINT 'Test data insertion completed successfully!';
PRINT '';
PRINT 'Summary of inserted data:';
PRINT '- 5 Employees';
PRINT '- 4 Shifts';
PRINT '- 30 days of attendance records for each employee';
PRINT '- 4 Leave types';
PRINT '- Leave balances for all employees';
PRINT '- 6 Leave requests (mixed statuses)';
PRINT '- 11 Holidays for 2024';
PRINT '- 4 Overtime records';
PRINT '- 2 Attendance policies';
PRINT '';
PRINT 'Test Users:';
PRINT '- John Doe (EMP001) - Senior Developer';
PRINT '- Jane Smith (EMP002) - Team Lead';
PRINT '- Bob Johnson (EMP003) - Developer';
PRINT '- Alice Williams (EMP004) - HR Manager';
PRINT '- Charlie Brown (EMP005) - Junior Developer';

-- Re-enable foreign key checks
-- For MySQL: SET FOREIGN_KEY_CHECKS = 1;
-- For PostgreSQL: SET session_replication_role = 'origin';