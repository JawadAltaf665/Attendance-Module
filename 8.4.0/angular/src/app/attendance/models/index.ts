// Core Models for Attendance Module

// Base Interface
export interface BaseEntity {
    id?: number;
    creationTime?: Date;
    creatorUserId?: number;
    lastModificationTime?: Date;
    lastModifierUserId?: number;
}

// Employee Model
export interface Employee extends BaseEntity {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    timezone: string;
    isActive: boolean;
    fullName?: string;
    tenantId?: number;
    userId?: number;
    managerId?: number;
}

// Attendance Event Model
export interface AttendanceEvent extends BaseEntity {
    employeeId: number;
    employeeName?: string;
    eventType: 'CLOCK_IN' | 'CLOCK_OUT';
    eventTime: Date;
    latitude?: number;
    longitude?: number;
    notes?: string;
    source?: 'Web' | 'Mobile' | 'Biometric';
    ipAddress?: string;
    deviceId?: string;
    tenantId?: number;
}

// Shift Model
export interface Shift extends BaseEntity {
    name: string;
    startTime: string; // "HH:mm:ss" format
    endTime: string;   // "HH:mm:ss" format
    breakMinutes: number;
    recurrenceRule?: string;
    isActive?: boolean;
    tenantId?: number;
}

// Roster Model
export interface Roster extends BaseEntity {
    rosterDate: Date;
    employeeId: number;
    employeeName?: string;
    shiftId: number;
    shiftName?: string;
    shiftStartTime?: string;
    shiftEndTime?: string;
    tenantId?: number;
}

// Leave Request Model
export interface LeaveRequest extends BaseEntity {
    employeeId: number;
    employeeName?: string;
    leaveType: 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID';
    startDate: Date;
    endDate: Date;
    halfDay: boolean;
    reason?: string;
    attachmentUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approverId?: number;
    approverName?: string;
    approvedDate?: Date;
    rejectionReason?: string;
    totalDays?: number;
    tenantId?: number;
}

// Timesheet Model
export interface Timesheet {
    employeeId: number;
    employeeName?: string;
    date: Date;
    clockInTime?: Date;
    clockOutTime?: Date;
    totalHours: number;
    overtimeHours: number;
    breakMinutes: number;
    shiftName?: string;
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY';
    notes?: string;
}

// API Request/Response DTOs

// Clock In/Out Request
export interface ClockEventDto {
    employeeId: number;
    eventType?: 'CLOCK_IN' | 'CLOCK_OUT';
    eventTime?: Date;
    notes?: string;
    latitude?: number;
    longitude?: number;
    source?: 'Web' | 'Mobile' | 'Biometric';
    deviceId?: string;
}

// Attendance Query Request
export interface GetAttendanceRequest {
    employeeId?: number;
    startDate: Date;
    endDate: Date;
    eventType?: 'CLOCK_IN' | 'CLOCK_OUT';
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
}

// Roster Query Request
export interface GetRosterRequest {
    employeeId: number;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
}

// Leave Request DTO
export interface CreateLeaveDto {
    leaveType: 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID';
    startDate: string;
    endDate: string;
    halfDay?: boolean;
    reason: string;
    attachmentUrl?: string;
    approverId?: number;
}

// Leave Balance Response
export interface LeaveBalanceDto {
    employeeId: number;
    leaveType: string;
    totalAllocation: number;
    usedDays: number;
    availableDays: number;
    asOfDate: Date;
}

// Employee Leave Balance
export interface EmployeeLeaveBalanceDto {
    employeeId: number;
    balances: LeaveBalanceDto[];
}

// Paged Result
export interface PagedResultDto<T> {
    totalCount: number;
    items: T[];
}

// API Error Response
export interface ApiErrorResponse {
    error: {
        code: number;
        message: string;
        details?: string;
        validationErrors?: Array<{
            message: string;
            members: string[];
        }>;
    };
    success: boolean;
    unAuthorizedRequest: boolean;
}

// Enums and Constants
export enum AttendanceEventType {
    CLOCK_IN = 'CLOCK_IN',
    CLOCK_OUT = 'CLOCK_OUT'
}

export enum AttendanceSource {
    Web = 'Web',
    Mobile = 'Mobile',
    Biometric = 'Biometric'
}

export const AttendancePermissions = {
    AttendanceView: 'Pages.Attendance.View',
    AttendanceClockInOut: 'Pages.Attendance.ClockInOut',
    LeaveRequest: 'Pages.Leaves.Request',
    LeaveView: 'Pages.Leaves.View',
    LeaveApprove: 'Pages.Leaves.Approve',
    LeaveReject: 'Pages.Leaves.Reject'
};

// Summary DTOs
export interface TodaySummaryDto {
    totalHours: number;
    overtime: number;
    isCurrentlyClockedIn: boolean;
    lastClockInTime?: Date;
}

export interface WeeklySummaryDto {
    hoursWorked: number;
    overtime: number;
    target: number;
    daysWorked?: number;
}

export interface TodayScheduleDto {
    scheduleType: 'shift' | 'leave' | 'holiday' | 'none';
    shiftName?: string;
    startTime?: string;
    endTime?: string;
    leaveType?: string;
}