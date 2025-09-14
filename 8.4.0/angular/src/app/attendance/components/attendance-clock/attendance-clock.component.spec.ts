import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AttendanceClockComponent } from './attendance-clock.component';
import { AttendanceApiService } from '../../services/attendance-api.service';
import { AppSessionService } from '@shared/session/app-session.service';
import { AttendanceStatusCardComponent } from '../attendance-status-card/attendance-status-card.component';
import { SelfieCaptureComponent } from '../selfie-capture/selfie-capture.component';

describe('AttendanceClockComponent', () => {
    let component: AttendanceClockComponent;
    let fixture: ComponentFixture<AttendanceClockComponent>;
    let mockAttendanceService: jasmine.SpyObj<AttendanceApiService>;
    let mockAppSession: jasmine.SpyObj<AppSessionService>;

    beforeEach(async () => {
        // Create mock services
        mockAttendanceService = jasmine.createSpyObj('AttendanceApiService', [
            'clockIn',
            'clockOut',
            'getTodayAttendance'
        ]);

        mockAppSession = jasmine.createSpyObj('AppSessionService', [], {
            userId: 101,
            user: { name: 'John Doe' }
        });

        await TestBed.configureTestingModule({
            declarations: [
                AttendanceClockComponent,
                AttendanceStatusCardComponent,
                SelfieCaptureComponent
            ],
            imports: [ReactiveFormsModule],
            providers: [
                FormBuilder,
                { provide: AttendanceApiService, useValue: mockAttendanceService },
                { provide: AppSessionService, useValue: mockAppSession }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AttendanceClockComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Component Initialization', () => {
        it('should initialize with employee information', () => {
            expect(component.employeeId).toBe('101');
            expect(component.employeeName).toBe('John Doe');
            expect(component.timezone).toBeTruthy();
        });

        it('should load last punch status on init', fakeAsync(() => {
            const mockEvents = [
                {
                    id: 1,
                    employeeId: 101,
                    eventType: 'CLOCK_IN',
                    eventTime: new Date('2024-01-15T09:00:00'),
                    source: 'Web'
                }
            ];

            mockAttendanceService.getTodayAttendance.and.returnValue(of(mockEvents));
            component.ngOnInit();
            tick();

            expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalledWith(101);
            expect(component.isClockedIn).toBe(true);
            expect(component.lastPunchType).toBe('CLOCK_IN');
        }));

        it('should handle empty attendance events', fakeAsync(() => {
            mockAttendanceService.getTodayAttendance.and.returnValue(of([]));
            component.ngOnInit();
            tick();

            expect(component.isClockedIn).toBe(false);
            expect(component.lastPunchTime).toBeNull();
            expect(component.lastPunchType).toBeNull();
        }));
    });

    describe('Clock In Functionality', () => {
        beforeEach(() => {
            component.isClockedIn = false;
            component.isLoading = false;
        });

        it('should successfully clock in when button is clicked', fakeAsync(() => {
            const mockResponse = {
                success: true,
                eventId: 'event-123',
                createdAt: new Date().toISOString()
            };

            mockAttendanceService.clockIn.and.returnValue(of(mockResponse));
            spyOn(component, 'showToast');

            // Simulate button click
            component.onClockButtonClick();
            component.showConfirmationModal = true;
            component.confirmClockAction();
            tick(300); // Account for debounceTime

            expect(mockAttendanceService.clockIn).toHaveBeenCalled();
            expect(component.isClockedIn).toBe(true);
            expect(component.isLoading).toBe(false);
            expect(component.showToast).toHaveBeenCalledWith(
                jasmine.stringContaining('Successfully clocked in'),
                'success'
            );
        }));

        it('should handle clock in error and save to pending events', fakeAsync(() => {
            const error = { status: 0, message: 'Network error' };
            mockAttendanceService.clockIn.and.returnValue(throwError(error));
            spyOn(component, 'showToast');
            spyOn(component as any, 'savePendingEvent');

            component.performClockIn();
            tick(300);

            expect(component.isLoading).toBe(false);
            expect(component.showRetryButton).toBe(true);
            expect(component.showToast).toHaveBeenCalledWith(
                'No network connection. Event saved for retry.',
                'warning'
            );
        }));

        it('should include location data when available', fakeAsync(() => {
            component.currentLocation = { latitude: 40.7128, longitude: -74.0060 };
            const mockResponse = { success: true, eventId: 'event-123' };
            mockAttendanceService.clockIn.and.returnValue(of(mockResponse));

            component.performClockIn();
            tick(300);

            const callArgs = mockAttendanceService.clockIn.calls.mostRecent().args[0];
            expect(callArgs.latitude).toBe(40.7128);
            expect(callArgs.longitude).toBe(-74.0060);
        }));
    });

    describe('Clock Out Functionality', () => {
        beforeEach(() => {
            component.isClockedIn = true;
            component.isLoading = false;
        });

        it('should successfully clock out when button is clicked', fakeAsync(() => {
            const mockResponse = {
                success: true,
                eventId: 'event-124',
                createdAt: new Date().toISOString()
            };

            mockAttendanceService.clockOut.and.returnValue(of(mockResponse));
            spyOn(component, 'showToast');

            component.performClockOut();
            tick(300);

            expect(mockAttendanceService.clockOut).toHaveBeenCalled();
            expect(component.isClockedIn).toBe(false);
            expect(component.isLoading).toBe(false);
            expect(component.showToast).toHaveBeenCalledWith(
                jasmine.stringContaining('Successfully clocked out'),
                'success'
            );
        }));
    });

    describe('Button State Management', () => {
        it('should return correct button text based on state', () => {
            component.isClockedIn = false;
            component.isLoading = false;
            expect(component.getButtonText()).toBe('Clock In');

            component.isClockedIn = true;
            expect(component.getButtonText()).toBe('Clock Out');

            component.isLoading = true;
            expect(component.getButtonText()).toBe('Processing...');
        });

        it('should return correct button class based on state', () => {
            component.isClockedIn = false;
            expect(component.getButtonClass()).toBe('btn-clock-in');

            component.isClockedIn = true;
            expect(component.getButtonClass()).toBe('btn-clock-out');
        });

        it('should disable button during loading', () => {
            component.isLoading = true;
            component.onClockButtonClick();
            // Should not proceed when loading
            expect(component.showConfirmationModal).toBeFalsy();
        });
    });

    describe('Retry Functionality', () => {
        it('should retry pending events when network is restored', fakeAsync(() => {
            const pendingEvent = {
                id: 'pending-1',
                data: {
                    employeeId: 101,
                    eventType: 'CLOCK_IN' as const,
                    eventTime: new Date(),
                    source: 'Web' as const
                },
                timestamp: new Date(),
                retryCount: 0
            };

            component.pendingEvents = [pendingEvent];
            component.showRetryButton = true;

            const mockResponse = { success: true, eventId: 'event-125' };
            mockAttendanceService.clockIn.and.returnValue(of(mockResponse));
            spyOn(component, 'showToast');

            component.retryPendingEvents();
            tick();

            expect(mockAttendanceService.clockIn).toHaveBeenCalled();
            expect(component.pendingEvents.length).toBe(0);
            expect(component.showRetryButton).toBe(false);
            expect(component.showToast).toHaveBeenCalledWith(
                jasmine.stringContaining('Successfully submitted pending'),
                'success'
            );
        }));

        it('should handle retry failures with max retry count', fakeAsync(() => {
            const pendingEvent = {
                id: 'pending-1',
                data: {
                    employeeId: 101,
                    eventType: 'CLOCK_IN' as const,
                    eventTime: new Date(),
                    source: 'Web' as const
                },
                timestamp: new Date(),
                retryCount: 2
            };

            component.pendingEvents = [pendingEvent];
            mockAttendanceService.clockIn.and.returnValue(throwError({ status: 500 }));
            spyOn(component, 'showToast');

            component.retryPendingEvents();
            tick();

            expect(component.pendingEvents.length).toBe(0);
            expect(component.showToast).toHaveBeenCalledWith(
                'Failed to submit pending event after 3 retries',
                'error'
            );
        }));
    });

    describe('Selfie Capture Integration', () => {
        it('should show selfie modal when selfie is required', () => {
            component.selfieRequired = true;
            component.capturedPhotoUrl = null;
            component.isClockedIn = false;

            component.onClockButtonClick();

            expect(component.showSelfieModal).toBe(true);
            expect(component.showConfirmationModal).toBe(false);
        });

        it('should proceed after selfie capture', () => {
            component.selfieRequired = true;
            const photoData = 'data:image/jpeg;base64,test';

            component.onSelfieCapture(photoData);

            expect(component.capturedPhotoUrl).toBe(photoData);
            expect(component.showSelfieModal).toBe(false);
            expect(component.showConfirmationModal).toBe(true);
        });
    });

    describe('Status Display', () => {
        it('should return correct status text', () => {
            component.isClockedIn = true;
            expect(component.getStatusText()).toBe('Currently Clocked In');

            component.isClockedIn = false;
            component.lastPunchTime = new Date();
            expect(component.getStatusText()).toBe('Currently Clocked Out');

            component.lastPunchTime = null;
            expect(component.getStatusText()).toBe('Not Clocked In Today');
        });

        it('should return correct status class', () => {
            component.isClockedIn = true;
            expect(component.getStatusClass()).toBe('status-clocked-in');

            component.isClockedIn = false;
            expect(component.getStatusClass()).toBe('status-clocked-out');
        });
    });

    describe('Grace Period Handling', () => {
        it('should show grace message when late within grace period', () => {
            // Mock current time to be 9:10 AM (10 minutes late)
            const mockDate = new Date();
            mockDate.setHours(9, 10, 0, 0);
            jasmine.clock().mockDate(mockDate);

            component.isClockedIn = false;
            component.gracePeriodMinutes = 15;
            component.checkGracePeriod();

            expect(component.isLate).toBe(true);
            expect(component.graceMessage).toContain('10 minutes late');
            expect(component.graceMessage).toContain('Grace period: 15 minutes');
        });
    });

    afterEach(() => {
        fixture.destroy();
    });
});