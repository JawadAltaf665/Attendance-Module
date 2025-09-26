import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '@shared/service-proxies/service-proxies';
import {
    AttendanceEvent,
    ClockEventDto,
    GetAttendanceRequest,
    Employee,
    Shift,
    Roster,
    GetRosterRequest,
    LeaveRequest,
    CreateLeaveDto,
    LeaveBalanceDto,
    EmployeeLeaveBalanceDto,
    PagedResultDto,
    ApiErrorResponse
} from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class AttendanceApiService {
    private baseUrl: string;
    private headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });

    constructor(
        private http: HttpClient,
        @Inject(API_BASE_URL) baseUrl?: string
    ) {
        this.baseUrl = baseUrl || '';
    }

    // ==================== EMPLOYEE ====================

    /**
     * Get current user's employee record
     */
    getCurrentUserEmployee(): Observable<Employee> {
        const url = `${this.baseUrl}/api/services/app/Employee/GetCurrentUserEmployee`;
        return this.http.get<any>(url, { headers: this.headers })
            .pipe(
                map(response => response.result || response),
                catchError(this.handleError)
            );
    }

    /**
     * Clock In for current user (no employeeId needed)
     */
    clockInForCurrentUser(): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Attendance/ClockInForCurrentUser`;
        return this.http.post<any>(url, {}, { headers: this.headers })
            .pipe(
                map(response => ({
                    success: true,
                    ...response
                })),
                catchError(this.handleError)
            );
    }

    /**
     * Clock Out for current user (no employeeId needed)
     */
    clockOutForCurrentUser(): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Attendance/ClockOutForCurrentUser`;
        return this.http.post<any>(url, {}, { headers: this.headers })
            .pipe(
                map(response => ({
                    success: true,
                    ...response
                })),
                catchError(this.handleError)
            );
    }

    /**
     * Get today's attendance for current user (no employeeId needed)
     */
    getMyTodayAttendance(): Observable<AttendanceEvent[]> {
        const url = `${this.baseUrl}/api/services/app/Attendance/GetMyTodayAttendance`;
        return this.http.get<any>(url, { headers: this.headers })
            .pipe(
                map(response => {
                    const result = response.result || response;
                    return Array.isArray(result) ? result.map((event: any) => this.transformAttendanceEvent(event)) : [];
                }),
                catchError(this.handleError)
            );
    }

    // ==================== ATTENDANCE EVENTS ====================

    /**
     * Clock In - POST /api/attendance/clockin
     * Maps to backend: ClockInAsync
     */
    clockIn(input: ClockEventDto): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Attendance/ClockIn`;

        // Transform to match exact API payload structure
        const payload = {
            employeeId: input.employeeId?.toString() || '',
            eventType: 'CLOCK_IN',
            eventTime: input.eventTime ? new Date(input.eventTime).toISOString() : new Date().toISOString(),
            timezone: (input as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            source: input.source?.toLowerCase() || 'web',
            latitude: input.latitude || null,
            longitude: input.longitude || null,
            deviceId: input.deviceId || null,
            photoUrl: (input as any).photoUrl || null,
            notes: input.notes || null
        };

        return this.http.post<any>(url, payload, { headers: this.headers })
            .pipe(
                map(response => ({
                    success: true,
                    eventId: response.id || response.eventId,
                    createdAt: response.creationTime || response.createdAt,
                    ...response
                })),
                catchError(this.handleError)
            );
    }

    /**
     * Clock Out - POST /api/attendance/clockout
     * Maps to backend: ClockOutAsync
     */
    clockOut(input: ClockEventDto): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Attendance/ClockOut`;

        // Transform to match exact API payload structure
        const payload = {
            employeeId: input.employeeId?.toString() || '',
            eventType: 'CLOCK_OUT',
            eventTime: input.eventTime ? new Date(input.eventTime).toISOString() : new Date().toISOString(),
            timezone: (input as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            source: input.source?.toLowerCase() || 'web',
            latitude: input.latitude || null,
            longitude: input.longitude || null,
            deviceId: input.deviceId || null,
            photoUrl: (input as any).photoUrl || null,
            notes: input.notes || null
        };

        return this.http.post<any>(url, payload, { headers: this.headers })
            .pipe(
                map(response => ({
                    success: true,
                    eventId: response.id || response.eventId,
                    createdAt: response.creationTime || response.createdAt,
                    ...response
                })),
                catchError(this.handleError)
            );
    }

    /**
     * Get Attendance Events - GET /api/attendance/events
     * Maps to backend: GetEmployeeAttendanceAsync
     */
    getAttendanceByEmployee(employeeId: number, startDate: Date, endDate: Date): Observable<AttendanceEvent[]> {
        const url = `${this.baseUrl}/api/services/app/Attendance/GetEmployeeAttendance`;
        const params = new HttpParams()
            .set('employeeId', employeeId.toString())
            .set('start', startDate.toISOString())
            .set('end', endDate.toISOString());

        return this.http.get<AttendanceEvent[]>(url, { headers: this.headers, params })
            .pipe(
                map(response => response.map(event => this.transformAttendanceEvent(event))),
                catchError(this.handleError)
            );
    }

    /**
     * Get Today's Attendance
     */
    getTodayAttendance(employeeId: number): Observable<AttendanceEvent[]> {
        const url = `${this.baseUrl}/api/services/app/Attendance/GetTodayAttendance`;
        const params = new HttpParams().set('employeeId', employeeId.toString());

        return this.http.get<AttendanceEvent[]>(url, { headers: this.headers, params })
            .pipe(
                map(response => response.map(event => this.transformAttendanceEvent(event))),
                catchError(this.handleError)
            );
    }

    /**
     * Get Paged Attendance List
     */
    getPagedAttendanceList(request: GetAttendanceRequest): Observable<PagedResultDto<AttendanceEvent>> {
        const url = `${this.baseUrl}/api/services/app/Attendance/GetPagedAttendenceList`;
        let params = new HttpParams();

        if (request.employeeId) params = params.set('employeeId', request.employeeId.toString());
        if (request.startDate) params = params.set('startDate', request.startDate.toISOString());
        if (request.endDate) params = params.set('endDate', request.endDate.toISOString());
        if (request.eventType) params = params.set('eventType', request.eventType);
        if (request.skipCount !== undefined) params = params.set('skipCount', request.skipCount.toString());
        if (request.maxResultCount !== undefined) params = params.set('maxResultCount', request.maxResultCount.toString());
        if (request.sorting) params = params.set('sorting', request.sorting);

        return this.http.get<PagedResultDto<AttendanceEvent>>(url, { headers: this.headers, params })
            .pipe(
                map(response => ({
                    totalCount: response.totalCount,
                    items: response.items.map(event => this.transformAttendanceEvent(event))
                })),
                catchError(this.handleError)
            );
    }

    // ==================== SHIFTS & ROSTER ====================

    /**
     * Get Employee Roster - GET /api/shifts/roster
     */
    getEmployeeRoster(request: GetRosterRequest): Observable<Roster[]> {
        const url = `${this.baseUrl}/api/services/app/Roster/GetEmployeeRoster`;
        let params = new HttpParams()
            .set('employeeId', request.employeeId.toString());

        if (request.date) {
            params = params.set('date', request.date.toISOString());
        } else if (request.startDate && request.endDate) {
            params = params
                .set('startDate', request.startDate.toISOString())
                .set('endDate', request.endDate.toISOString());
        }

        return this.http.get<Roster[]>(url, { headers: this.headers, params })
            .pipe(
                map(response => response.map(roster => this.transformRoster(roster))),
                catchError(this.handleError)
            );
    }

    /**
     * Get Shift by ID
     */
    getShiftById(id: number): Observable<Shift> {
        const url = `${this.baseUrl}/api/services/app/Shift/GetShiftById`;
        const params = new HttpParams().set('id', id.toString());

        return this.http.get<Shift>(url, { headers: this.headers, params })
            .pipe(
                map(response => this.transformShift(response)),
                catchError(this.handleError)
            );
    }

    // ==================== LEAVE MANAGEMENT ====================

    /**
     * Request Leave - POST /api/leave/request
     * Maps to backend: CreateLeaveAsync
     */
    requestLeave(input: CreateLeaveDto): Observable<LeaveRequest> {
        const url = `${this.baseUrl}/api/services/app/Leave/CreateLeave`;

        // Transform the input to match backend expectations
        const payload = {
            leaveType: input.leaveType,
            startDate: input.startDate,
            endDate: input.endDate,
            halfDay: input.halfDay || false,
            reason: input.reason,
            attachmentUrl: input.attachmentUrl || null,
            approverId: input.approverId || null
        };

        return this.http.post<any>(url, payload, { headers: this.headers })
            .pipe(
                map(response => {
                    const result = response.result || response;
                    return this.transformLeaveRequest(result);
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get Leave Balance for current user
     */
    getLeaveBalance(): Observable<EmployeeLeaveBalanceDto> {
        const url = `${this.baseUrl}/api/services/app/Leave/GetLeaveBalance`;

        return this.http.get<any>(url, { headers: this.headers })
            .pipe(
                map(response => {
                    const result = response.result || response;
                    return {
                        employeeId: result.employeeId,
                        balances: result.balances || []
                    } as EmployeeLeaveBalanceDto;
                }),
                catchError(() => {
                    // Return mock data if endpoint doesn't exist
                    return this.getMockLeaveBalanceForCurrentUser();
                })
            );
    }

    /**
     * Get My Leaves
     */
    getMyLeaves(): Observable<LeaveRequest[]> {
        const url = `${this.baseUrl}/api/services/app/Leave/GetMyLeaves`;
        return this.http.get<any>(url, { headers: this.headers })
            .pipe(
                map(response => {
                    const result = response.result || response;
                    return Array.isArray(result) ? result.map(leave => this.transformLeaveRequest(leave)) : [];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get Pending Leaves (Manager View)
     */
    getPendingLeaves(): Observable<LeaveRequest[]> {
        const url = `${this.baseUrl}/api/services/app/Leave/GetPendingLeaves`;
        return this.http.get<any>(url, { headers: this.headers })
            .pipe(
                map(response => {
                    const result = response.result || response;
                    return Array.isArray(result) ? result.map(leave => this.transformLeaveRequest(leave)) : [];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get All Leaves (Admin View)
     */
    getAllLeaves(): Observable<LeaveRequest[]> {
        const url = `${this.baseUrl}/api/services/app/Leave/GetAllLeaves`;
        return this.http.get<any>(url, { headers: this.headers })
            .pipe(
                map(response => {
                    const result = response.result || response;
                    return Array.isArray(result) ? result.map(leave => this.transformLeaveRequest(leave)) : [];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Approve Leave
     */
    approveLeave(id: number): Observable<boolean> {
        const url = `${this.baseUrl}/api/services/app/Leave/ApproveLeave`;
        const params = new HttpParams().set('id', id.toString());

        return this.http.post<any>(url, null, { headers: this.headers, params })
            .pipe(
                map(() => true),
                catchError(this.handleError)
            );
    }

    /**
     * Reject Leave
     */
    rejectLeave(id: number, reason?: string): Observable<boolean> {
        const url = `${this.baseUrl}/api/services/app/Leave/RejectLeave`;
        const params = new HttpParams().set('id', id.toString());

        return this.http.post<any>(url, { reason }, { headers: this.headers, params })
            .pipe(
                map(() => true),
                catchError(this.handleError)
            );
    }

    /**
     * Delete Leave Request
     */
    deleteLeave(id: number): Observable<boolean> {
        const url = `${this.baseUrl}/api/services/app/Leave/DeleteLeave`;
        const params = new HttpParams().set('id', id.toString());

        return this.http.delete<any>(url, { headers: this.headers, params })
            .pipe(
                map(() => true),
                catchError(this.handleError)
            );
    }

    // ==================== MOCK METHODS (TO BE IMPLEMENTED IN BACKEND) ====================

    /**
     * Get Today's Schedule
     */
    getTodaySchedule(employeeId: number): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Attendance/GetTodaySchedule?employeeId=${employeeId}`;
        return this.http.get<any>(url).pipe(
            map(response => response.result),
            catchError(this.handleError)
        );
    }

    /**
     * Get Today's Summary
     */
    getTodaySummary(employeeId: number): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Attendance/GetTodaySummary?employeeId=${employeeId}`;
        return this.http.get<any>(url).pipe(
            map(response => response.result),
            catchError(this.handleError)
        );
    }

    /**
     * Get Weekly Summary
     */
    getWeeklySummary(employeeId: number): Observable<any> {
        const url = `${this.baseUrl}/api/services/app/Attendance/GetWeeklySummary?employeeId=${employeeId}`;
        return this.http.get<any>(url).pipe(
            map(response => response.result),
            catchError(() => {
                // Return mock weekly summary with Monday-Friday calculation
                return this.getMockWeeklySummary(employeeId);
            })
        );
    }

    /**
     * Get Mock Weekly Summary with proper Monday-Friday calculation
     */
    private getMockWeeklySummary(employeeId: number): Observable<any> {
        // Get current week's Monday to Friday
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Calculate Monday of current week
        const monday = new Date(now);
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Handle Sunday
        monday.setDate(now.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        
        // Calculate Friday of current week
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        friday.setHours(23, 59, 59, 999);
        
        // Calculate working days (Monday to Friday only)
        const totalWorkingDays = 5; // Monday to Friday
        const currentWorkingDay = Math.min(currentDay === 0 ? 5 : Math.max(0, currentDay - 1), 4) + 1;
        
        // Mock calculation based on current progress in the week
        const workedDays = Math.floor(currentWorkingDay * 0.8); // 80% attendance rate
        const targetHours = totalWorkingDays * 8; // 8 hours per day
        const workedHours = workedDays * 8;
        
        const weeklySummary = {
            weekStartDate: monday.toISOString(),
            weekEndDate: friday.toISOString(),
            totalWorkingDays: totalWorkingDays,
            currentWorkingDay: currentWorkingDay,
            daysWorked: workedDays,
            hoursWorked: workedHours,
            target: targetHours,
            overtime: Math.max(0, workedHours - targetHours),
            attendanceRate: Math.round((workedDays / currentWorkingDay) * 100),
            isCurrentWeek: true,
            weekNumber: this.getWeekNumber(now),
            year: now.getFullYear()
        };
        
        console.log('Mock Weekly Summary Generated:', weeklySummary);
        return new Observable(observer => {
            setTimeout(() => {
                observer.next(weeklySummary);
                observer.complete();
            }, 300);
        });
    }

    /**
     * Get week number of the year
     */
    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Get Employee Attendance (Alternative using My Today Attendance for testing)
     */
    getEmployeeAttendance(employeeId: number, startDate: Date, endDate: Date): Observable<AttendanceEvent[]> {
        // For now, if it's today's date, use getMyTodayAttendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const requestStart = new Date(startDate);
        requestStart.setHours(0, 0, 0, 0);

        if (today.getTime() === requestStart.getTime()) {
            return this.getMyTodayAttendance();
        }

        // Otherwise use the regular endpoint
        return this.getAttendanceByEmployee(employeeId, startDate, endDate);
    }

    // ==================== HELPER METHODS ====================

    private transformAttendanceEvent(event: any): AttendanceEvent {
        return {
            ...event,
            eventTime: event.eventTime ? new Date(event.eventTime) : undefined,
            creationTime: event.creationTime ? new Date(event.creationTime) : undefined,
            lastModificationTime: event.lastModificationTime ? new Date(event.lastModificationTime) : undefined
        };
    }

    private transformRoster(roster: any): Roster {
        return {
            ...roster,
            rosterDate: roster.rosterDate ? new Date(roster.rosterDate) : undefined,
            creationTime: roster.creationTime ? new Date(roster.creationTime) : undefined,
            lastModificationTime: roster.lastModificationTime ? new Date(roster.lastModificationTime) : undefined
        };
    }

    private transformShift(shift: any): Shift {
        return {
            ...shift,
            creationTime: shift.creationTime ? new Date(shift.creationTime) : undefined,
            lastModificationTime: shift.lastModificationTime ? new Date(shift.lastModificationTime) : undefined
        };
    }

    private transformLeaveRequest(leave: any): LeaveRequest {
        return {
            ...leave,
            startDate: leave.startDate ? new Date(leave.startDate) : undefined,
            endDate: leave.endDate ? new Date(leave.endDate) : undefined,
            approvedDate: leave.approvedDate ? new Date(leave.approvedDate) : undefined,
            creationTime: leave.creationTime ? new Date(leave.creationTime) : undefined,
            lastModificationTime: leave.lastModificationTime ? new Date(leave.lastModificationTime) : undefined
        };
    }

    private getMockLeaveBalanceForCurrentUser(): Observable<EmployeeLeaveBalanceDto> {
        // Mock data for leave balance
        const mockBalances: EmployeeLeaveBalanceDto = {
            employeeId: 1,
            balances: [
                {
                    employeeId: 1,
                    leaveType: 'VACATION',
                    totalAllocation: 15,
                    usedDays: 3,
                    availableDays: 12,
                    asOfDate: new Date()
                },
                {
                    employeeId: 1,
                    leaveType: 'SICK',
                    totalAllocation: 10,
                    usedDays: 1,
                    availableDays: 9,
                    asOfDate: new Date()
                },
                {
                    employeeId: 1,
                    leaveType: 'PERSONAL',
                    totalAllocation: 5,
                    usedDays: 0,
                    availableDays: 5,
                    asOfDate: new Date()
                },
                {
                    employeeId: 1,
                    leaveType: 'UNPAID',
                    totalAllocation: 0,
                    usedDays: 0,
                    availableDays: 0,
                    asOfDate: new Date()
                }
            ]
        };
        return new Observable(observer => {
            setTimeout(() => {
                observer.next(mockBalances);
                observer.complete();
            }, 500);
        });
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            if (error.error && error.error.error) {
                const apiError = error.error as ApiErrorResponse;
                errorMessage = apiError.error.message || 'Server error';

                if (apiError.error.validationErrors && apiError.error.validationErrors.length > 0) {
                    const validationMessages = apiError.error.validationErrors
                        .map(v => v.message)
                        .join(', ');
                    errorMessage += `: ${validationMessages}`;
                }
            } else {
                errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            }
        }

        console.error('API Error:', errorMessage);
        return throwError(errorMessage);
    }
}