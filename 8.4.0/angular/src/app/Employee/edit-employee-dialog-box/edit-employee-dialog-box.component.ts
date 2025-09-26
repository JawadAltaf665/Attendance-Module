import {
    Component,
    Injector,
    OnInit,
    EventEmitter,
    Output,
    Input
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from '@shared/app-component-base';
import { EmployeeService, EmployeeDto } from 'shared/services/employee.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-edit-employee-dialog-box',
    templateUrl: './edit-employee-dialog-box.component.html',
    styleUrls: ['./edit-employee-dialog-box.component.css']
})
export class EditEmployeeDialogBoxComponent extends AppComponentBase implements OnInit {
    saving = false;
    loading = false;
    employeeForm: FormGroup;
    availableUsers: UserDto[] = [];
    employee: EmployeeDto = {} as EmployeeDto;
    
    @Input() id: number;
    @Output() onSave = new EventEmitter<any>();
    
    private apiUrl = `${environment.production ? (environment.apis?.default?.url || '') : ''}/api/services/app/Employee`;

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private _employeeService: EmployeeService,
        public bsModalRef: BsModalRef,
        private http: HttpClient,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        console.log('EditEmployeeDialog ngOnInit called with id:', this.id);
        
        this.employeeForm = this.fb.group({
            id: [null],
            userId: [null, Validators.required],
            firstName: ['', [Validators.required, Validators.maxLength(32)]],
            lastName: ['', [Validators.required, Validators.maxLength(32)]],
            email: ['', [Validators.required, Validators.email]],
            timezone: ['UTC', [Validators.required]],
            isActive: [true]
        });
        
        console.log('Edit form created:', this.employeeForm);
        
        // Load employee data first, then available users
        this.loadEmployeeData();
    }

    private loadEmployeeData(): void {
        if (!this.id) {
            console.error('No employee ID provided for editing');
            abp.notify.error('No employee ID provided');
            this.bsModalRef.hide();
            return;
        }

        this.loading = true;
        console.log('Loading employee data for ID:', this.id);
        
        this._employeeService.get(this.id).subscribe({
            next: (employee) => {
                console.log('Employee data loaded:', employee);
                this.employee = employee;
                
                // Populate form with employee data
                this.employeeForm.patchValue({
                    id: employee.id,
                    userId: employee.userId,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    email: employee.email,
                    timezone: employee.timezone || 'UTC',
                    isActive: employee.isActive
                });
                
                this.loading = false;
                console.log('Form populated with employee data');
                
                // Reload available users now that we have employee data
                this.loadAvailableUsers();
            },
            error: (error) => {
                console.error('Error loading employee:', error);
                const msg = error?.error?.error?.message || error?.error?.message || error.message || 'Failed to load employee';
                abp.notify.error(msg);
                this.loading = false;
                this.bsModalRef.hide();
            }
        });
    }

    private loadAvailableUsers(): void {
        console.log('Loading available users from:', `${this.apiUrl}/GetAvailableUsers`);
        
        this.http.get<any>(`${this.apiUrl}/GetAvailableUsers`).subscribe({
            next: (response) => {
                console.log('GetAvailableUsers raw response:', response);
                let allUsers = response?.result || response || [];
                
                // If we have an employee loaded, make sure their current user is included in the list
                if (this.employee && this.employee.userId) {
                    const currentUserExists = allUsers.some((user: UserDto) => user.id === this.employee.userId);
                    if (!currentUserExists) {
                        // Add a placeholder for the current user if not in available list
                        const currentUser: UserDto = {
                            id: this.employee.userId,
                            name: this.employee.firstName || 'Unknown',
                            surname: this.employee.lastName || 'User',
                            userName: this.employee.userName || `user_${this.employee.userId}`,
                            emailAddress: this.employee.email || '',
                            fullName: `${this.employee.firstName || 'Unknown'} ${this.employee.lastName || 'User'} (Current)`
                        };
                        allUsers = [currentUser, ...allUsers];
                    } else {
                        // Mark the current user in the list
                        allUsers = allUsers.map((user: UserDto) => {
                            if (user.id === this.employee.userId) {
                                return {
                                    ...user,
                                    fullName: `${user.fullName} (Current)`
                                };
                            }
                            return user;
                        });
                    }
                }
                
                this.availableUsers = allUsers;
                console.log('Available users loaded with current user:', this.availableUsers);
            },
            error: (error) => {
                console.error('Error loading users:', error);
                const msg = error?.error?.error?.message || error?.error?.message || error.message || 'Failed to load users';
                abp.notify.error(msg);
                this.availableUsers = [];
                
                // If we have an employee, at least show their current user
                if (this.employee && this.employee.userId) {
                    this.availableUsers = [{
                        id: this.employee.userId,
                        name: this.employee.firstName || 'Unknown',
                        surname: this.employee.lastName || 'User',
                        userName: this.employee.userName || `user_${this.employee.userId}`,
                        emailAddress: this.employee.email || '',
                        fullName: `${this.employee.firstName || 'Unknown'} ${this.employee.lastName || 'User'} (Current)`
                    }];
                }
            }
        });
    }

    onUserSelected(event: any): void {
        const userId = Number(event.target.value);
        console.log('User selected - userId:', userId, 'type:', typeof userId);

        if (userId && userId > 0) {
            const selectedUser = this.availableUsers.find(u => u.id === userId);
            if (selectedUser) {
                console.log('Selected user:', selectedUser);
                // Auto-fill form with user data (but keep existing data if user doesn't want to change)
                const currentValues = this.employeeForm.value;
                
                // Only update if fields are empty or user confirms
                if (!currentValues.firstName || !currentValues.lastName || !currentValues.email) {
                    this.employeeForm.patchValue({
                        firstName: selectedUser.name,
                        lastName: selectedUser.surname,
                        email: selectedUser.emailAddress
                    });
                } else {
                    // Ask user if they want to overwrite existing data
                    abp.message.confirm(
                        'Do you want to overwrite the existing employee data with the selected user\'s information?',
                        'Overwrite Data',
                        (result: boolean) => {
                            if (result) {
                                this.employeeForm.patchValue({
                                    firstName: selectedUser.name,
                                    lastName: selectedUser.surname,
                                    email: selectedUser.emailAddress
                                });
                            }
                        }
                    );
                }
            }
        }
    }

    save(): void {
        if (this.employeeForm.invalid) {
            Object.keys(this.employeeForm.controls).forEach(key => {
                this.employeeForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.saving = true;
        this.employeeForm.disable();
        
        const employeeData: UpdateEmployeeDto = {
            ...this.employeeForm.value,
            userId: Number(this.employeeForm.value.userId)
        };

        console.log('Updating employee with data:', JSON.stringify(employeeData, null, 2));

        // Try the service method first
        this._employeeService.update(employeeData).subscribe({
            next: (response) => {
                console.log('Employee updated successfully:', response);
                abp.notify.success('Employee updated successfully');
                this.bsModalRef.hide();
                this.onSave.emit();
            },
            error: (error) => {
                console.error('Error updating employee via service:', error);
                
                // If we get a 405 error, try with PUT method directly
                if (error.status === 405) {
                    console.log('Trying PUT method instead...');
                    this.tryUpdateWithPUT(employeeData);
                } else {
                    const msg = error?.error?.error?.message || error?.error?.message || error.message || 'Failed to update employee';
                    abp.notify.error(msg);
                    this.saving = false;
                    this.employeeForm.enable();
                }
            }
        });
    }

    private tryUpdateWithPUT(employeeData: UpdateEmployeeDto): void {
        console.log('Attempting update with PUT method');
        
        this.http.put<any>(`${this.apiUrl}/UpdateEmployee`, employeeData).subscribe({
            next: (response) => {
                console.log('Employee updated successfully with PUT:', response);
                abp.notify.success('Employee updated successfully');
                this.bsModalRef.hide();
                this.onSave.emit();
            },
            error: (error) => {
                console.error('Error updating employee with PUT:', error);
                
                // Try with different endpoint structure
                this.tryUpdateWithAlternativeEndpoint(employeeData);
            }
        });
    }

    private tryUpdateWithAlternativeEndpoint(employeeData: UpdateEmployeeDto): void {
        console.log('Trying alternative endpoint structure');
        
        // Try with the ID in the URL
        this.http.put<any>(`${this.apiUrl}/UpdateEmployee/${employeeData.id}`, employeeData).subscribe({
            next: (response) => {
                console.log('Employee updated successfully with alternative endpoint:', response);
                abp.notify.success('Employee updated successfully');
                this.bsModalRef.hide();
                this.onSave.emit();
            },
            error: (error) => {
                console.error('All update methods failed:', error);
                const msg = error?.error?.error?.message || error?.error?.message || error.message || 'Failed to update employee. Please check the API endpoint configuration.';
                abp.notify.error(msg);
                this.saving = false;
                this.employeeForm.enable();
            }
        });
    }

    cancel(): void {
        this.bsModalRef.hide();
    }
}

// Interfaces for TypeScript
interface UserDto {
    id: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    fullName: string;
}

interface UpdateEmployeeDto {
    id: number;
    userId: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    timezone: string;
    isActive: boolean;
}
