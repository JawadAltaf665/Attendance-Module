// Base DTOs
export interface AuditedEntityDto {
    id?: number;
    creationTime?: Date;
    creatorUserId?: number;
    lastModificationTime?: Date;
    lastModifierUserId?: number;
}

export interface PagedResultDto<T> {
    totalCount: number;
    items: T[];
}

export interface PagedRequestDto {
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
}

// Employee Models
export interface EmployeeDto extends AuditedEntityDto {
    tenantId?: number;
    userId?: number;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    timezone: string;
    isActive: boolean;
    fullName?: string;
}

export interface CreateEmployeeDto {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    timezone?: string;
    isActive?: boolean;
}

export interface GetEmployeeListInputDto extends PagedRequestDto {
    keyword?: string;
    isActive?: boolean;
}

// Attendance Event Models
export interface AttendanceEventDto extends AuditedEntityDto {
    tenantId?: number;
    employeeId: number;
    employeeName?: string;
    eventType: AttendanceEventType;
    eventTime: Date;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    source: AttendanceSource;
    notes?: string;
    ipAddress?: string;
    photoUrl?: string;
    deviceId?: string;
    createdBy: number;
}

export interface ClockEventDto {
    employeeId: number;
    eventType: AttendanceEventType;
    eventTime?: Date;
    notes?: string;
    latitude?: number;
    longitude?: number;
    source?: AttendanceSource;
    deviceId?: string;
}

export interface GetAttendanceListInputDto extends PagedRequestDto {
    keyword?: string;
    employeeId?: number;
    startDate?: Date;
    endDate?: Date;
    eventType?: AttendanceEventType;
}

// Shift Models
export interface ShiftDto extends AuditedEntityDto {
    tenantId?: number;
    name: string;
    startTime: string; // TimeSpan as string "HH:mm:ss"
    endTime: string;
    breakMinutes: number;
    recurrenceRule?: string;
    createdBy: number;
    isActive?: boolean;
}

export interface CreateShiftDto {
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    recurrenceRule?: string;
}

export interface GetShiftListInputDto extends PagedRequestDto {
    keyword?: string;
    isActive?: boolean;
}

// Roster Models
export interface RosterDto extends AuditedEntityDto {
    tenantId?: number;
    rosterDate: Date;
    employeeId: number;
    employeeName?: string;
    shiftId: number;
    shiftName?: string;
    shiftStartTime?: string;
    shiftEndTime?: string;
}

export interface CreateRosterDto {
    employeeId: number;
    shiftId: number;
    rosterDate: Date;
}

export interface GetRosterListInputDto extends PagedRequestDto {
    employeeId?: number;
    shiftId?: number;
    startDate?: Date;
    endDate?: Date;
}

// Shift Swap Models
export interface ShiftSwapRequestDto extends AuditedEntityDto {
    tenantId?: number;
    requesterId: number;
    requesterName?: string;
    targetEmployeeId: number;
    targetEmployeeName?: string;
    shiftId: number;
    shiftName?: string;
    rosterDate: Date;
    status: SwapRequestStatus;
    approvedBy?: number;
    approverName?: string;
    approvedDate?: Date;
    rejectionReason?: string;
}

export interface CreateShiftSwapRequestDto {
    requesterId: number;
    targetEmployeeId: number;
    shiftId: number;
    rosterDate: Date;
    reason?: string;
}

// Leave Models
export interface LeaveRequestDto extends AuditedEntityDto {
    tenantId?: number;
    employeeId: number;
    employeeName?: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    halfDay: boolean;
    reason?: string;
    status: LeaveStatus;
    approverId?: number;
    approverName?: string;
    approvedDate?: Date;
    rejectionReason?: string;
    totalDays?: number;
}

export interface CreateLeaveDto {
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    halfDay?: boolean;
    reason?: string;
}

export interface GetLeaveListInputDto extends PagedRequestDto {
    employeeId?: number;
    status?: LeaveStatus;
    leaveType?: LeaveType;
    startDate?: Date;
    endDate?: Date;
}

// Report Models
export interface ReportFilterDto {
    employeeId?: number;
    startDate: Date;
    endDate: Date;
    keyword?: string;
}

export interface AttendanceReportRowDto {
    employeeId: number;
    employeeName: string;
    employeeNumber: string;
    eventTime: Date;
    eventType: AttendanceEventType;
    source: AttendanceSource;
    shiftName?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
}

export interface LeaveReportRowDto {
    employeeId: number;
    employeeName: string;
    employeeNumber: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    status: LeaveStatus;
    approverName?: string;
    approvedDate?: Date;
}

export interface OvertimeReportRowDto {
    employeeId: number;
    employeeName: string;
    employeeNumber: string;
    date: Date;
    totalWorkedHours: number;
    standardHours: number;
    overtimeHours: number;
}

export interface TodayScheduleDto {
    scheduleType: 'shift' | 'leave' | 'none';
    startTime?: Date;
    endTime?: Date;
    shiftName?: string;
    leaveType?: LeaveType;
}

export interface WeeklySummaryDto {
    hoursWorked: number;
    overtime: number;
    target: number;
    weekStartDate: Date;
    weekEndDate: Date;
}

export interface TodaySummaryDto {
    totalHours: number;
    overtime: number;
    clockInTime?: Date;
    clockOutTime?: Date;
    isCurrentlyClockedIn: boolean;
}

export interface FileResultDto {
    fileName: string;
    contentType: string;
    file: ArrayBuffer | Blob;
}

// Enums
export enum AttendanceEventType {
    CLOCK_IN = 'CLOCK_IN',
    CLOCK_OUT = 'CLOCK_OUT'
}

export enum AttendanceSource {
    Web = 'Web',
    Mobile = 'Mobile',
    Biometric = 'Biometric'
}

export enum LeaveType {
    VACATION = 'VACATION',
    SICK = 'SICK',
    UNPAID = 'UNPAID'
}

export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum SwapRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

// Permission Constants
export class AttendancePermissions {
    static readonly Employees = 'Pages.Employees';
    static readonly EmployeesCreate = 'Pages.Employees.Create';
    static readonly EmployeesEdit = 'Pages.Employees.Edit';
    static readonly EmployeesDelete = 'Pages.Employees.Delete';
    static readonly EmployeesView = 'Pages.Employees.View';

    static readonly Attendance = 'Pages.Attendance';
    static readonly AttendanceClockInOut = 'Pages.Attendance.ClockInOut';
    static readonly AttendanceView = 'Pages.Attendance.View';

    static readonly Shifts = 'Pages.Shifts';
    static readonly ShiftsCreate = 'Pages.Shifts.Create';
    static readonly ShiftsView = 'Pages.Shifts.View';

    static readonly Rosters = 'Pages.Rosters';
    static readonly RostersAssign = 'Pages.Rosters.Assign';
    static readonly RostersView = 'Pages.Rosters.View';
    static readonly RostersSwap = 'Pages.Rosters.Swap';

    static readonly Leaves = 'Pages.Leaves';
    static readonly LeavesRequest = 'Pages.Leaves.Request';
    static readonly LeavesApprove = 'Pages.Leaves.Approve';
    static readonly LeavesReject = 'Pages.Leaves.Reject';
    static readonly LeavesView = 'Pages.Leaves.View';
}