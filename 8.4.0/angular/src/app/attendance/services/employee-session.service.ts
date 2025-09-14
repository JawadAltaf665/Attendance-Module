import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AttendanceApiService } from './attendance-api.service';
import { AppSessionService } from '@shared/session/app-session.service';
import { Employee } from '../models/index';

@Injectable({
    providedIn: 'root'
})
export class EmployeeSessionService {
    private currentEmployeeSubject = new BehaviorSubject<Employee | null>(null);
    public currentEmployee$ = this.currentEmployeeSubject.asObservable();

    private isLoadingSubject = new BehaviorSubject<boolean>(false);
    public isLoading$ = this.isLoadingSubject.asObservable();

    constructor(
        private attendanceService: AttendanceApiService,
        private appSession: AppSessionService
    ) {
        // Initialize employee data when service is created
        this.initializeEmployee();
    }

    /**
     * Initialize employee data for the current logged-in user
     */
    private initializeEmployee(): void {
        // Check if we have a stored employee in session storage
        const storedEmployee = this.getStoredEmployee();
        if (storedEmployee) {
            this.currentEmployeeSubject.next(storedEmployee);
        }
    }

    /**
     * Get current employee (will fetch if not available)
     */
    getCurrentEmployee(): Observable<Employee> {
        const currentEmployee = this.currentEmployeeSubject.value;

        if (currentEmployee) {
            return of(currentEmployee);
        }

        return this.loadCurrentEmployee();
    }

    /**
     * Load employee data from backend
     */
    loadCurrentEmployee(): Observable<Employee> {
        // Check if user is logged in
        if (!this.appSession.userId) {
            console.error('No user logged in');
            return of(null);
        }

        this.isLoadingSubject.next(true);

        return this.attendanceService.getCurrentUserEmployee().pipe(
            tap(employee => {
                // Store employee data
                this.currentEmployeeSubject.next(employee);
                this.storeEmployee(employee);
                this.isLoadingSubject.next(false);
            }),
            catchError(error => {
                console.error('Failed to load employee data:', error);
                this.isLoadingSubject.next(false);

                // If employee doesn't exist, we might need to create one
                // This should be handled by the backend automatically
                return of(null);
            })
        );
    }

    /**
     * Get current employee ID
     */
    getCurrentEmployeeId(): number | null {
        const employee = this.currentEmployeeSubject.value;
        return employee ? employee.id : null;
    }

    /**
     * Get current user ID from session
     */
    getCurrentUserId(): number | null {
        return this.appSession.userId;
    }

    /**
     * Clear employee data (on logout)
     */
    clearEmployee(): void {
        this.currentEmployeeSubject.next(null);
        this.clearStoredEmployee();
    }

    /**
     * Refresh employee data
     */
    refreshEmployee(): Observable<Employee> {
        this.clearStoredEmployee();
        return this.loadCurrentEmployee();
    }

    // Local Storage Management
    private readonly STORAGE_KEY = 'current_employee';

    private storeEmployee(employee: Employee): void {
        if (employee) {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                employee: employee,
                userId: this.appSession.userId,
                timestamp: new Date().getTime()
            }));
        }
    }

    private getStoredEmployee(): Employee | null {
        try {
            const stored = sessionStorage.getItem(this.STORAGE_KEY);
            if (!stored) return null;

            const data = JSON.parse(stored);

            // Check if it's for the current user
            if (data.userId !== this.appSession.userId) {
                this.clearStoredEmployee();
                return null;
            }

            // Check if data is not too old (e.g., 1 hour)
            const age = new Date().getTime() - data.timestamp;
            if (age > 3600000) { // 1 hour in milliseconds
                this.clearStoredEmployee();
                return null;
            }

            return data.employee;
        } catch (error) {
            console.error('Error reading stored employee:', error);
            return null;
        }
    }

    private clearStoredEmployee(): void {
        sessionStorage.removeItem(this.STORAGE_KEY);
    }
}