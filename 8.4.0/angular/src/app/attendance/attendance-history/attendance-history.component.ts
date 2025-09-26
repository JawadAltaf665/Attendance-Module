import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { AttendanceService, AttendanceEventDto, PagedRequestDto } from '@shared/services/attendance.service';
import { AppSessionService } from '@shared/session/app-session.service';
import { PermissionCheckerService } from 'abp-ng2-module';

interface AttendanceRecord {
    date: string;
    clockInTime?: string;
    clockOutTime?: string;
    totalHours: number;
    status: string;
    events: AttendanceEventDto[];
}

@Component({
    selector: 'app-attendance-history',
    templateUrl: './attendance-history.component.html'
})
export class AttendanceHistoryComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    
    // Form and filters
    filterForm: FormGroup;
    
    // Data
    attendanceRecords: AttendanceRecord[] = [];
    allEvents: AttendanceEventDto[] = [];
    
    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalRecords = 0;
    
    // Loading states
    isLoading = false;
    isExporting = false;
    showAdvancedFilters = false;
    
    // Summary data
    totalHoursWorked = 0;
    totalOvertimeHours = 0;
    averageHoursPerDay = 0;
    totalDaysWorked = 0;

    constructor(
        private fb: FormBuilder,
        private attendanceService: AttendanceService,
        private appSession: AppSessionService,
        public permission: PermissionCheckerService
    ) {
        this.initializeForm();
    }

    ngOnInit() {
        this.loadInitialData();
        this.setupFormSubscriptions();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Toggle advanced filters
    toggleAdvancedFilters() {
        this.showAdvancedFilters = !this.showAdvancedFilters;
    }

    private initializeForm() {
        // Default to current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        this.filterForm = this.fb.group({
            startDate: [this.formatDateForInput(startOfMonth)],
            endDate: [this.formatDateForInput(endOfMonth)]
        });
    }

    private setupFormSubscriptions() {
        this.filterForm.valueChanges
            .pipe(
                debounceTime(500),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.currentPage = 1;
                this.loadAttendanceData();
            });
    }

    private loadInitialData() {
        this.loadAttendanceData();
    }

    loadAttendanceData() {
        if (this.isLoading) return;

        this.isLoading = true;
        const formValue = this.filterForm.value;

        const startDate = new Date(formValue.startDate);
        const endDate = new Date(formValue.endDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);

        // Use the service method for current user
        this.attendanceService.getMyPagedAttendanceHistory({
            startDate: startDate,
            endDate: endDate,
            skipCount: (this.currentPage - 1) * this.pageSize,
            maxResultCount: this.pageSize
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.allEvents = result.items || [];
                    this.totalRecords = result.totalCount || 0;
                    console.log('Fetched events:', this.allEvents, 'Total:', this.totalRecords);
                    this.processAttendanceData();
                    this.calculateSummary();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading attendance data:', error);
                    abp.message.error('Failed to load attendance data');
                    this.isLoading = false;
                    this.attendanceRecords = [];
                    this.allEvents = [];
                    this.totalRecords = 0;
                }
            });
    }

    private processAttendanceData() {
        if (!this.allEvents || this.allEvents.length === 0) {
            this.attendanceRecords = [];
            // Don't override totalRecords as it comes from server
            return;
        }

        // Group events by date
        const eventsByDate = this.groupEventsByDate(this.allEvents);

        // Convert to attendance records
        const records: AttendanceRecord[] = [];

        for (const [dateStr, events] of Object.entries(eventsByDate)) {
            const record = this.createAttendanceRecord(dateStr, events);
            records.push(record);
        }

        // Sort by date descending (most recent first)
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.attendanceRecords = records;
        // Don't override totalRecords as it comes from server for pagination
    }

    private groupEventsByDate(events: AttendanceEventDto[]): { [key: string]: AttendanceEventDto[] } {
        const grouped: { [key: string]: AttendanceEventDto[] } = {};
        
        for (const event of events) {
            const dateStr = new Date(event.eventTime).toLocaleDateString('en-CA'); // YYYY-MM-DD format
            
            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
            }
            
            grouped[dateStr].push(event);
        }

        // Sort events within each day by time
        for (const dateStr in grouped) {
            grouped[dateStr].sort((a, b) => 
                new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
            );
        }

        return grouped;
    }

    private createAttendanceRecord(dateStr: string, events: AttendanceEventDto[]): AttendanceRecord {
        let clockInTime: string | undefined;
        let clockOutTime: string | undefined;
        let totalHours = 0;
        let status = 'Absent';

        if (events.length > 0) {
            // Find first clock in and last clock out
            const clockInEvent = events.find(e => e.eventType === 'ClockIn' || e.eventType === 'CLOCK_IN');
            const clockOutEvents = events.filter(e => e.eventType === 'ClockOut' || e.eventType === 'CLOCK_OUT');
            const lastClockOut = clockOutEvents.length > 0 ? clockOutEvents[clockOutEvents.length - 1] : null;

            if (clockInEvent) {
                clockInTime = new Date(clockInEvent.eventTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }

            if (lastClockOut) {
                clockOutTime = new Date(lastClockOut.eventTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }

            // Calculate total hours
            totalHours = this.attendanceService.calculateDailyHours(events);

            // Determine status
            if (clockInTime && !clockOutTime) {
                status = 'In Progress';
            } else if (clockInTime && clockOutTime) {
                status = 'Complete';
            } else if (events.length > 0) {
                status = 'Partial';
            }
        }

        return {
            date: dateStr,
            clockInTime,
            clockOutTime,
            totalHours,
            status,
            events
        };
    }

    private calculateSummary() {
        this.totalHoursWorked = 0;
        this.totalOvertimeHours = 0;
        this.totalDaysWorked = 0;

        for (const record of this.attendanceRecords) {
            if (record.totalHours > 0) {
                this.totalHoursWorked += record.totalHours;
                this.totalDaysWorked++;
                
                // Calculate overtime (assuming 8 hours standard day)
                if (record.totalHours > 8) {
                    this.totalOvertimeHours += (record.totalHours - 8);
                }
            }
        }

        this.averageHoursPerDay = this.totalDaysWorked > 0 ? this.totalHoursWorked / this.totalDaysWorked : 0;
        
        // Round to 2 decimal places
        this.totalHoursWorked = Math.round(this.totalHoursWorked * 100) / 100;
        this.totalOvertimeHours = Math.round(this.totalOvertimeHours * 100) / 100;
        this.averageHoursPerDay = Math.round(this.averageHoursPerDay * 100) / 100;
    }

    // Pagination methods - using server-side pagination
    get paginatedRecords(): AttendanceRecord[] {
        // Since we're using server-side pagination, return all processed records
        return this.attendanceRecords;
    }

    get totalPages(): number {
        return Math.ceil(this.totalRecords / this.pageSize);
    }

    onPageChange(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadAttendanceData(); // Reload data for new page
        }
    }

    onPageSizeChange(newPageSize: number) {
        this.pageSize = newPageSize;
        this.currentPage = 1;
        this.loadAttendanceData(); // Reload data with new page size
    }

    // Export functionality
    exportToCSV() {
        this.isExporting = true;
        const formValue = this.filterForm.value;

        const startDate = new Date(formValue.startDate);
        const endDate = new Date(formValue.endDate);
        endDate.setHours(23, 59, 59, 999);

        // Get all data without pagination for export
        this.attendanceService.getMyAttendanceHistory(startDate, endDate)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (events) => {
                    if (!events || events.length === 0) {
                        abp.message.warn('No data to export');
                        this.isExporting = false;
                        return;
                    }

                    try {
                        // Sort by date/time
                        const exportData = events.sort((a, b) =>
                            new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
                        );

                        const filename = `attendance-history-${formValue.startDate}-to-${formValue.endDate}.csv`;
                        this.attendanceService.exportToCSV(exportData, filename);
                        abp.message.success('Data exported successfully');
                    } catch (error) {
                        console.error('Export failed:', error);
                        abp.message.error('Failed to export data');
                    } finally {
                        this.isExporting = false;
                    }
                },
                error: (error) => {
                    console.error('Export failed:', error);
                    abp.message.error('Failed to export data');
                    this.isExporting = false;
                }
            });
    }

    exportToExcel() {
        // For now, use CSV export. Could be enhanced to use a library like xlsx
        this.exportToCSV();
    }

    // Quick filter methods
    setCurrentWeek() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

        this.filterForm.patchValue({
            startDate: this.formatDateForInput(startOfWeek),
            endDate: this.formatDateForInput(endOfWeek)
        });
    }

    setCurrentMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        this.filterForm.patchValue({
            startDate: this.formatDateForInput(startOfMonth),
            endDate: this.formatDateForInput(endOfMonth)
        });
    }

    setLast30Days() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 29);

        this.filterForm.patchValue({
            startDate: this.formatDateForInput(startDate),
            endDate: this.formatDateForInput(endDate)
        });
    }

    // Utility methods
    formatDuration(hours: number): string {
        return this.attendanceService.formatDuration(hours);
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    private formatDateForInput(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'Complete': return 'badge bg-success';
            case 'In Progress': return 'badge bg-warning';
            case 'Partial': return 'badge bg-info';
            case 'Absent': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    // View details method
    viewDayDetails(record: AttendanceRecord) {
        if (!record.events || record.events.length === 0) {
            abp.message.info('No events found for this day');
            return;
        }

        // For now, just show an info message. Could be enhanced with a modal
        const eventCount = record.events.length;
        const message = `${record.date}: ${eventCount} events recorded. Total hours: ${this.formatDuration(record.totalHours)}`;
        abp.message.info(message);
    }

    refresh() {
        this.loadAttendanceData();
    }

    // Track by function for ngFor performance
    trackByDate(index: number, record: AttendanceRecord): string {
        return record.date;
    }

    // Get visible page numbers for pagination
    getVisiblePages(): number[] {
        const totalPages = this.totalPages;
        const currentPage = this.currentPage;
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        
        const halfVisible = Math.floor(maxVisible / 2);
        let startPage = Math.max(1, currentPage - halfVisible);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    }

    // Math object for template
    Math = Math;
}
