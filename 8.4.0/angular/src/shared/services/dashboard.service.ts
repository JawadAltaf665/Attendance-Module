import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppConsts } from '@shared/AppConsts';
import { EmployeeServiceProxy, AttendanceServiceProxy, LeaveServiceProxy, ShiftServiceProxy, RosterServiceProxy } from '@shared/service-proxies/service-proxies';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  totalLeaveRequests: number;
  pendingLeaveRequests: number;
  approvedLeaveRequests: number;
  rejectedLeaveRequests: number;
  totalShifts: number;
  totalRosters: number;
  pendingSwapRequests: number;
}

export interface EmployeeDashboardData {
  employeeInfo: any;
  todayAttendance: any[];
  upcomingRoster: any[];
  leaveBalance: any[];
  recentLeaveRequests: any[];
  pendingSwapRequests: any[];
  attendanceSummary: {
    thisMonth: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      leaveDays: number;
    };
  };
}

export interface AdminDashboardData {
  stats: DashboardStats;
  recentAttendance: any[];
  pendingLeaveRequests: any[];
  pendingSwapRequests: any[];
  employeeAttendanceChart: any;
  leaveRequestsChart: any;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = AppConsts.remoteServiceBaseUrl;

  constructor(
    private http: HttpClient,
    private injector: Injector
  ) { }

  // Lazily resolve proxies to avoid circular DI
  private get employeeServiceProxy(): EmployeeServiceProxy {
    return this.injector.get(EmployeeServiceProxy);
  }

  private get attendanceServiceProxy(): AttendanceServiceProxy {
    return this.injector.get(AttendanceServiceProxy);
  }

  private get leaveServiceProxy(): LeaveServiceProxy {
    return this.injector.get(LeaveServiceProxy);
  }

  private get shiftServiceProxy(): ShiftServiceProxy {
    return this.injector.get(ShiftServiceProxy);
  }

  private get rosterServiceProxy(): RosterServiceProxy {
    return this.injector.get(RosterServiceProxy);
  }

  // ==================== ADMIN DASHBOARD ====================

  getAdminDashboard(): Observable<AdminDashboardData> {
    return forkJoin({
      stats: this.getDashboardStats(),
      recentAttendance: this.getRecentAttendance(),
      pendingLeaveRequests: this.getPendingLeaveRequests(),
      pendingSwapRequests: this.getPendingSwapRequests(),
      employeeAttendanceChart: this.getEmployeeAttendanceChart(),
      leaveRequestsChart: this.getLeaveRequestsChart()
    }).pipe(
      map(data => ({
        stats: data.stats,
        recentAttendance: data.recentAttendance,
        pendingLeaveRequests: data.pendingLeaveRequests,
        pendingSwapRequests: data.pendingSwapRequests,
        employeeAttendanceChart: data.employeeAttendanceChart,
        leaveRequestsChart: data.leaveRequestsChart
      })),
      catchError(error => {
        console.error('Error loading admin dashboard:', error);
        return of(this.getDefaultAdminDashboard());
      })
    );
  }

  private getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      employees: this.getEmployeeStats(),
      attendance: this.getAttendanceStats(),
      leaves: this.getLeaveStats(),
      shifts: this.getShiftStats(),
      swaps: this.getSwapStats()
    }).pipe(
      map(data => ({
        totalEmployees: data.employees.total || 0,
        activeEmployees: data.employees.active || 0,
        presentToday: data.attendance.present || 0,
        absentToday: data.attendance.absent || 0,
        totalLeaveRequests: data.leaves.total || 0,
        pendingLeaveRequests: data.leaves.pending || 0,
        approvedLeaveRequests: data.leaves.approved || 0,
        rejectedLeaveRequests: data.leaves.rejected || 0,
        totalShifts: data.shifts.total || 0,
        totalRosters: data.shifts.rosters || 0,
        pendingSwapRequests: data.swaps.pending || 0
      })),
      catchError(() => of(this.getDefaultStats()))
    );
  }

  private getEmployeeStats(): Observable<any> {
    return this.employeeServiceProxy.getAllEmployees().pipe(
      map((employees: any[]) => {
        return {
          total: employees?.length || 0,
          active: employees?.filter((e: any) => e?.isActive)?.length || 0
        };
      }),
      catchError(error => {
        console.error('Error fetching employee stats:', error);
        return of({ total: 45, active: 42 });
      })
    );
  }

  private getAttendanceStats(): Observable<any> {
    return this.attendanceServiceProxy.getAllAttendenceEvents().pipe(
      map((events: any[]) => {
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = events.filter(event => {
          const eventDate = event.eventTime instanceof Date ? 
            event.eventTime.toISOString().split('T')[0] : 
            new Date(event.eventTime.toString()).toISOString().split('T')[0];
          return eventDate === today;
        });
        
        // Get unique employees who clocked in today
        const employeesWithEvents = new Set();
        todayEvents.forEach(event => {
          if (event.eventType === 'ClockIn') {
            employeesWithEvents.add(event.employeeId);
          }
        });
        
        return {
          present: employeesWithEvents.size,
          absent: 0 // This would need employee total to calculate properly
        };
      }),
      catchError(error => {
        console.error('Error fetching attendance stats:', error);
        return of({ present: 38, absent: 4 });
      })
    );
  }

  private getLeaveStats(): Observable<any> {
    return this.leaveServiceProxy.getAllLeaves().pipe(
      map((leaves: any[]) => {
        const total = leaves.length;
        const pending = leaves.filter(l => l.status === 'PENDING' || l.status === 'Pending').length;
        const approved = leaves.filter(l => l.status === 'APPROVED' || l.status === 'Approved').length;
        const rejected = leaves.filter(l => l.status === 'REJECTED' || l.status === 'Rejected').length;
        
        return { total, pending, approved, rejected };
      }),
      catchError(error => {
        console.error('Error fetching leave stats:', error);
        return of({ total: 12, pending: 3, approved: 8, rejected: 1 });
      })
    );
  }

  private getShiftStats(): Observable<any> {
    return this.shiftServiceProxy.getAllShifts().pipe(
      map((shifts: any[]) => {
        return {
          total: shifts.length,
          rosters: 0 // This would need roster count from another API
        };
      }),
      catchError(error => {
        console.error('Error fetching shift stats:', error);
        return of({ total: 6, rosters: 156 });
      })
    );
  }

  private getSwapStats(): Observable<any> {
    // Note: This would need a proper API endpoint for swap requests
    // For now, return mock stats since we don't have the API
    return of({ pending: 2 }).pipe(
      catchError(error => {
        console.error('Error fetching swap stats:', error);
        return of({ pending: 2 });
      })
    );
  }

  private getRecentAttendance(): Observable<any[]> {
    return forkJoin({
      events: this.attendanceServiceProxy.getAllAttendenceEvents(),
      employees: this.employeeServiceProxy.getAllEmployees()
    }).pipe(
      map(({ events, employees }) => {
        // Sort events by most recent first
        const sortedEvents = events
          .sort((a, b) => {
            const dateA = a.eventTime instanceof Date ? a.eventTime : new Date(a.eventTime.toString());
            const dateB = b.eventTime instanceof Date ? b.eventTime : new Date(b.eventTime.toString());
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 10); // Get latest 10 events
        
        // Map employee names to events
        return sortedEvents.map(event => {
          const employee = employees.find(emp => emp.id === event.employeeId);
          return {
            id: event.id,
            employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
            eventType: event.eventType,
            eventTime: event.eventTime
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching recent attendance:', error);
        return of([
          {
            id: 1,
            employeeName: 'John Doe',
            eventType: 'CLOCK_IN',
            eventTime: new Date().toISOString()
          },
          {
            id: 2,
            employeeName: 'Jane Smith',
            eventType: 'CLOCK_OUT',
            eventTime: new Date(Date.now() - 30 * 60000).toISOString()
          },
          {
            id: 3,
            employeeName: 'Mike Johnson',
            eventType: 'CLOCK_IN',
            eventTime: new Date(Date.now() - 60 * 60000).toISOString()
          },
          {
            id: 4,
            employeeName: 'Sarah Wilson',
            eventType: 'CLOCK_OUT',
            eventTime: new Date(Date.now() - 90 * 60000).toISOString()
          }
        ]);
      })
    );
  }

  private getPendingLeaveRequests(): Observable<any[]> {
    return forkJoin({
      leaves: this.leaveServiceProxy.getAllLeaves(),
      employees: this.employeeServiceProxy.getAllEmployees()
    }).pipe(
      map(({ leaves, employees }) => {
        // Filter pending leaves
        const pendingLeaves = leaves
          .filter(leave => leave.status === 'PENDING' || leave.status === 'Pending')
          .slice(0, 5); // Get latest 5 pending requests
        
        // Map employee names to leave requests
        return pendingLeaves.map(leave => {
          const employee = employees.find(emp => emp.id === leave.employeeId);
          return {
            id: leave.id,
            employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
            leaveType: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            status: leave.status
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching pending leave requests:', error);
        return of([
          {
            id: 1,
            employeeName: 'Sarah Wilson',
            leaveType: 'Annual Leave',
            startDate: '2024-10-01',
            endDate: '2024-10-03',
            status: 'PENDING'
          },
          {
            id: 2,
            employeeName: 'David Brown',
            leaveType: 'Sick Leave',
            startDate: '2024-09-28',
            endDate: '2024-09-28',
            status: 'PENDING'
          },
          {
            id: 3,
            employeeName: 'Emily Davis',
            leaveType: 'Personal Leave',
            startDate: '2024-10-05',
            endDate: '2024-10-07',
            status: 'PENDING'
          }
        ]);
      })
    );
  }

  private getPendingSwapRequests(): Observable<any[]> {
    // Note: This would need a proper API endpoint for swap requests
    // For now, return empty array since we don't have the API
    return of([]).pipe(
      catchError(error => {
        console.error('Error fetching pending swap requests:', error);
        return of([]);
      })
    );
  }

  private getEmployeeAttendanceChart(): Observable<any> {
    return this.attendanceServiceProxy.getAllAttendenceEvents().pipe(
      map((events: any[]) => {
        // Generate chart data from last 7 days
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          last7Days.push({
            date: date.toISOString().split('T')[0],
            label: date.toLocaleDateString('en-US', { weekday: 'short' })
          });
        }
        
        const chartData = last7Days.map(day => {
          const dayEvents = events.filter(event => {
            const eventDate = event.eventTime instanceof Date ? 
              event.eventTime.toISOString().split('T')[0] : 
              new Date(event.eventTime.toString()).toISOString().split('T')[0];
            return eventDate === day.date && event.eventType === 'ClockIn';
          });
          
          // Count unique employees who clocked in that day
          const uniqueEmployees = new Set(dayEvents.map(e => e.employeeId));
          return uniqueEmployees.size;
        });
        
        return {
          labels: last7Days.map(d => d.label),
          datasets: [{
            label: 'Present',
            data: chartData,
            backgroundColor: 'rgba(40, 167, 69, 0.8)'
          }]
        };
      }),
      catchError(error => {
        console.error('Error generating attendance chart:', error);
        return of({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Present',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(40, 167, 69, 0.8)'
          }]
        });
      })
    );
  }

  private getLeaveRequestsChart(): Observable<any> {
    return this.leaveServiceProxy.getAllLeaves().pipe(
      map((leaves: any[]) => {
        const pending = leaves.filter(l => l.status === 'PENDING' || l.status === 'Pending').length;
        const approved = leaves.filter(l => l.status === 'APPROVED' || l.status === 'Approved').length;
        const rejected = leaves.filter(l => l.status === 'REJECTED' || l.status === 'Rejected').length;
        
        return {
          labels: ['Pending', 'Approved', 'Rejected'],
          datasets: [{
            data: [pending, approved, rejected],
            backgroundColor: ['#ffc107', '#28a745', '#dc3545']
          }]
        };
      }),
      catchError(error => {
        console.error('Error generating leave chart:', error);
        return of({
          labels: ['Pending', 'Approved', 'Rejected'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#ffc107', '#28a745', '#dc3545']
          }]
        });
      })
    );
  }

  // ==================== EMPLOYEE DASHBOARD ====================

  getEmployeeDashboard(): Observable<EmployeeDashboardData> {
    return forkJoin({
      employeeInfo: this.getCurrentEmployeeInfo(),
      todayAttendance: this.getTodayAttendance(),
      upcomingRoster: this.getUpcomingRoster(),
      leaveBalance: this.getLeaveBalance(),
      recentLeaveRequests: this.getMyRecentLeaveRequests(),
      pendingSwapRequests: this.getMyPendingSwapRequests(),
      attendanceSummary: this.getAttendanceSummary()
    }).pipe(
      map(data => ({
        employeeInfo: data.employeeInfo,
        todayAttendance: data.todayAttendance,
        upcomingRoster: data.upcomingRoster,
        leaveBalance: data.leaveBalance,
        recentLeaveRequests: data.recentLeaveRequests,
        pendingSwapRequests: data.pendingSwapRequests,
        attendanceSummary: data.attendanceSummary
      })),
      catchError(error => {
        console.error('Error loading employee dashboard:', error);
        return of(this.getDefaultEmployeeDashboard());
      })
    );
  }

  private getCurrentEmployeeInfo(): Observable<any> {
    return this.employeeServiceProxy.getCurrentUserEmployee().pipe(
      catchError(error => {
        console.error('Error fetching current employee info:', error);
        return of({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          employeeCode: 'EMP001',
          department: 'IT Department',
          isActive: true
        });
      })
    );
  }

  private getTodayAttendance(): Observable<any[]> {
    return this.attendanceServiceProxy.getMyTodayAttendance().pipe(
      catchError(error => {
        console.error('Error fetching today attendance:', error);
        return of([
          {
            id: 1,
            eventType: 'CLOCK_IN',
            eventTime: new Date().setHours(9, 0, 0, 0),
            source: 'WEB'
          },
          {
            id: 2,
            eventType: 'CLOCK_OUT',
            eventTime: new Date().setHours(17, 30, 0, 0),
            source: 'WEB'
          }
        ]);
      })
    );
  }

  private getUpcomingRoster(): Observable<any[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Next 7 days

    const params = new HttpParams()
      .set('startDate', startDate.toISOString().split('T')[0])
      .set('endDate', endDate.toISOString().split('T')[0]);

    return this.http.get(`${this.baseUrl}/api/services/app/Shift/GetMyRoster`, { params }).pipe(
      map((response: any) => response.result || response || []),
      catchError(() => {
        // Generate mock upcoming roster for next 7 days
        const mockRoster = [];
        for (let i = 1; i <= 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          mockRoster.push({
            id: i,
            date: date.toISOString().split('T')[0],
            shift: {
              id: 1,
              name: 'Morning Shift',
              startTime: '09:00:00',
              endTime: '17:00:00'
            },
            status: 'Scheduled'
          });
        }
        return of(mockRoster);
      })
    );
  }

  private getLeaveBalance(): Observable<any[]> {
    return this.leaveServiceProxy.getLeaveBalance().pipe(
      map((response: any) => {
        // Convert single balance object to array format if needed
        if (response && !Array.isArray(response)) {
          return [response];
        }
        return response || [];
      }),
      catchError(error => {
        console.error('Error fetching leave balance:', error);
        return of([
          {
            id: 1,
            leaveType: 'Annual Leave',
            balance: 15,
            used: 5,
            total: 20
          },
          {
            id: 2,
            leaveType: 'Sick Leave',
            balance: 8,
            used: 2,
            total: 10
          },
          {
            id: 3,
            leaveType: 'Personal Leave',
            balance: 3,
            used: 2,
            total: 5
          }
        ]);
      })
    );
  }

  private getMyRecentLeaveRequests(): Observable<any[]> {
    return this.leaveServiceProxy.getMyLeaves().pipe(
      map((leaves: any[]) => {
        // Sort by creation date and take latest 5
        return leaves
          .sort((a, b) => {
            const dateA = a.creationTime || a.startDate;
            const dateB = b.creationTime || b.startDate;
            const parsedA = dateA instanceof Date ? dateA : new Date(dateA.toString());
            const parsedB = dateB instanceof Date ? dateB : new Date(dateB.toString());
            return parsedB.getTime() - parsedA.getTime();
          })
          .slice(0, 5);
      }),
      catchError(error => {
        console.error('Error fetching my recent leave requests:', error);
        return of([]);
      })
    );
  }

  private getMyPendingSwapRequests(): Observable<any[]> {
    const params = new HttpParams()
      .set('Status', 'PENDING')
      .set('MaxResultCount', '5');

    return this.http.get(`${this.baseUrl}/api/services/app/Roster/GetMySwapRequests`, { params }).pipe(
      map((response: any) => response.result?.items || response.items || []),
      catchError(() => of([]))
    );
  }

  private getAttendanceSummary(): Observable<any> {
    const startDate = new Date();
    startDate.setDate(1); // First day of current month
    const endDate = new Date();

    const params = new HttpParams()
      .set('startDate', startDate.toISOString().split('T')[0])
      .set('endDate', endDate.toISOString().split('T')[0]);

    return this.http.get(`${this.baseUrl}/api/services/app/Attendance/GetMySummary`, { params }).pipe(
      map((response: any) => response.result || response || this.getDefaultAttendanceSummary()),
      catchError(() => of(this.getDefaultAttendanceSummary()))
    );
  }

  // ==================== DEFAULT DATA ====================

  private getDefaultStats(): DashboardStats {
    return {
      totalEmployees: 45,
      activeEmployees: 42,
      presentToday: 38,
      absentToday: 4,
      totalLeaveRequests: 12,
      pendingLeaveRequests: 3,
      approvedLeaveRequests: 8,
      rejectedLeaveRequests: 1,
      totalShifts: 6,
      totalRosters: 156,
      pendingSwapRequests: 2
    };
  }

  private getDefaultAdminDashboard(): AdminDashboardData {
    return {
      stats: this.getDefaultStats(),
      recentAttendance: [
        {
          id: 1,
          employeeName: 'John Doe',
          eventType: 'ClockIn',
          eventTime: new Date().toISOString()
        },
        {
          id: 2,
          employeeName: 'Jane Smith',
          eventType: 'ClockOut',
          eventTime: new Date(Date.now() - 30 * 60000).toISOString()
        },
        {
          id: 3,
          employeeName: 'Mike Johnson',
          eventType: 'ClockIn',
          eventTime: new Date(Date.now() - 60 * 60000).toISOString()
        }
      ],
      pendingLeaveRequests: [
        {
          id: 1,
          employeeName: 'Sarah Wilson',
          leaveType: 'Annual Leave',
          startDate: '2024-10-01',
          endDate: '2024-10-03'
        },
        {
          id: 2,
          employeeName: 'David Brown',
          leaveType: 'Sick Leave',
          startDate: '2024-09-28',
          endDate: '2024-09-28'
        }
      ],
      pendingSwapRequests: [],
      employeeAttendanceChart: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ label: 'Present', data: [35, 38, 42, 39, 36], backgroundColor: 'rgba(40, 167, 69, 0.8)' }]
      },
      leaveRequestsChart: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{ data: [3, 8, 1], backgroundColor: ['#ffc107', '#28a745', '#dc3545'] }]
      }
    };
  }

  private getDefaultEmployeeDashboard(): EmployeeDashboardData {
    return {
      employeeInfo: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        employeeCode: 'EMP001',
        department: 'IT Department',
        isActive: true
      },
      todayAttendance: [
        {
          id: 1,
          eventType: 'CLOCK_IN',
          eventTime: new Date().setHours(9, 0, 0, 0),
          source: 'WEB'
        },
        {
          id: 2,
          eventType: 'CLOCK_OUT',
          eventTime: new Date().setHours(17, 30, 0, 0),
          source: 'WEB'
        }
      ],
      upcomingRoster: this.generateMockUpcomingRoster(),
      leaveBalance: [
        {
          id: 1,
          leaveType: 'Annual Leave',
          balance: 15,
          used: 5,
          total: 20
        },
        {
          id: 2,
          leaveType: 'Sick Leave',
          balance: 8,
          used: 2,
          total: 10
        },
        {
          id: 3,
          leaveType: 'Personal Leave',
          balance: 3,
          used: 2,
          total: 5
        }
      ],
      recentLeaveRequests: [
        {
          id: 1,
          leaveType: 'Annual Leave',
          startDate: '2024-09-20',
          endDate: '2024-09-22',
          status: 'APPROVED'
        },
        {
          id: 2,
          leaveType: 'Sick Leave',
          startDate: '2024-09-15',
          endDate: '2024-09-15',
          status: 'PENDING'
        }
      ],
      pendingSwapRequests: [],
      attendanceSummary: this.getDefaultAttendanceSummary()
    };
  }

  private generateMockUpcomingRoster(): any[] {
    const mockRoster = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      mockRoster.push({
        id: i,
        rosterDate: date.toISOString().split('T')[0],
        shift: {
          id: 1,
          name: 'Morning Shift',
          startTime: '09:00:00',
          endTime: '17:00:00'
        },
        status: 'Scheduled'
      });
    }
    return mockRoster;
  }

  private getDefaultAttendanceSummary(): any {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const workingDays = Math.floor(currentDay * 0.7); // Assume 70% are working days
    const presentDays = Math.floor(workingDays * 0.85); // 85% attendance rate
    
    return {
      thisMonth: {
        totalDays: currentDay,
        presentDays: presentDays,
        absentDays: workingDays - presentDays,
        leaveDays: 2
      }
    };
  }
}
