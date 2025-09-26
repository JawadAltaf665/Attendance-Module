import {
    Component,
    Injector,
    OnInit,
    EventEmitter,
    Output
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from '@shared/app-component-base';
import { EmployeeService, EmployeeDto } from 'shared/services/employee.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-create-employee-dialog-box',
    templateUrl: './create-employee-dialog-box.component.html',
    styleUrls: ['./create-employee-dialog-box.component.css']
})
export class CreateEmployeeDialogBoxComponent extends AppComponentBase
    implements OnInit {
    saving = false;
    employeeForm: FormGroup;
    availableUsers: UserDto[] = [];


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
        this.employeeForm = this.fb.group({
            userId: [null, Validators.required],  // Select from dropdown
            firstName: ['', [Validators.required, Validators.maxLength(32)]],
            lastName: ['', [Validators.required, Validators.maxLength(32)]],
            email: ['', [Validators.required, Validators.email]],
            timezone: ['UTC', [Validators.required]], // Set default timezone
            isActive: [true]
        });        
        // Force enable the form
        this.employeeForm.enable();        
        this.loadAvailableUsers();
    }


    private loadAvailableUsers() {
        console.log('Loading available users from:', `${this.apiUrl}/GetAvailableUsers`);
        
        // Don't disable form while loading users
        this.http.get<any>(`${this.apiUrl}/GetAvailableUsers`).subscribe({
            next: (response) => {
                this.availableUsers = response?.result || response || [];
                console.log('Available users loaded:', this.availableUsers);
                
                // Enable form after users are loaded
                if (this.employeeForm.disabled) {
                    this.employeeForm.enable();
                }
            },
            error: (error) => {
                console.error('Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url,
                    error: error.error
                });
                const msg = error?.error?.error?.message || error?.error?.message || error.message || 'Failed to load users';
                abp.notify.error(msg);
                this.availableUsers = [];
                
                // Enable form even if users failed to load
                if (this.employeeForm.disabled) {
                    this.employeeForm.enable();
                    console.log('Form enabled despite user loading error');
                }
            }
        });
    }

    onUserSelected(event: any) {
        const userId = Number(event.target.value);

        if (userId && userId > 0) {
            const selectedUser = this.availableUsers.find(u => u.id === userId);
            if (selectedUser) {
                console.log('Selected user:', selectedUser);
                // Auto-fill form with user data
                this.employeeForm.patchValue({
                    firstName: selectedUser.name,
                    lastName: selectedUser.surname,
                    email: selectedUser.emailAddress
                });
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
        
        // Disable form while saving
        this.employeeForm.disable();
        
        const employee: CreateEmployeeDto = this.employeeForm.value;

        // Convert userId to number if it's a string
        employee.userId = Number(employee.userId);

        console.log('Creating employee with data:', JSON.stringify(employee, null, 2));

        this._employeeService.create(employee).subscribe({
            next: (response) => {
                console.log('Employee created successfully:', response);
                abp.notify.success('Employee created successfully');
                this.bsModalRef.hide();
                this.onSave.emit();
            },
            error: (error) => {
                console.error('Error creating employee:', error);
                const msg = error?.error?.error?.message || error?.error?.message || error.message || 'Failed to create employee';
                abp.notify.error(msg);
                this.saving = false;
                
                // Re-enable form on error
                this.employeeForm.enable();
            }
        });
    }
}
// Interface for TypeScript
interface UserDto {
    id: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    fullName: string;
}

interface CreateEmployeeDto {
    userId: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    timezone: string;
    isActive: boolean;
}

