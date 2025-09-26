import { Component, Injector, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { PagedListingComponentBase, PagedRequestDto } from '../../../shared/paged-listing-component-base';
import {
    EmployeeService,
    EmployeeDto,
    PagedResultDto,
} from 'shared/services/employee.service';
import { CreateEmployeeDialogBoxComponent } from '../create-employee-dialog-box/create-employee-dialog-box.component';
import { EditEmployeeDialogBoxComponent } from '../edit-employee-dialog-box/edit-employee-dialog-box.component';
import { HttpClient } from '@angular/common/http';
import { LocalizationService } from 'abp-ng2-module';
import { environment } from '../../../environments/environment';

class PagedEmployeesRequestDto extends PagedRequestDto {
    keyword: string;
    isActive: boolean | null;
}

@Component({
    selector: 'app-employee-list',
    templateUrl: './employee-list.component.html'
})
export class EmployeeListComponent implements OnInit {
    employees: EmployeeDto[] = [];
    filteredEmployees: EmployeeDto[] = [];
    keyword = '';
    isActive: boolean | null = undefined;
    advancedFiltersVisible = false;
    Math = Math;  // now you can use Math.min, Math.abs in template
    private apiUrl = `${environment.production ? (environment.apis?.default?.url || '') : ''}/api/services/app/Employee`;

    // Additional filter properties
    emailFilter = '';
    departmentFilter = '';
    sortBy = 'firstName';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalItems = 0;
    totalPages = 0;

    isLoading = false;

    constructor(
        injector: Injector,
        private _employeeService: EmployeeService,
        private _modalService: BsModalService,
        private http: HttpClient,
        public localization: LocalizationService

    ) {
        
    }

    ngOnInit(): void {
        this.loadEmployees();
    }

    // ============================= Actions =============================

    createEmployee(): void {        
            this.showCreateOrEditEmployeeDialog();
    }

    editEmployee(employee: EmployeeDto): void {
        this.showCreateOrEditEmployeeDialog(employee.id);
    }

    l(key: string, ...args: any[]): string {
        if (args.length === 0) {
            return this.localization.localize(key, '');
        }
        return this.localization.localize(key, args[0]?.toString() || '');
    }

    ls(key: string, arg1: any): string {
        return this.localization.localize(key, arg1?.toString() || '');
    }

    deactivateEmployee(employee: EmployeeDto): void {
        abp.message.confirm(
            this.l('EmployeeDeactivateWarningMessage', employee.firstName),
            undefined,
            (result: boolean) => {
                if (result) {
                    this._employeeService.delete(employee.id).subscribe({
                        next: () => {
                            abp.notify.success('Employee deactivated successfully');
                            this.refreshData();
                        },
                        error: (err) => {
                            console.error('Error deactivating employee:', err);
                            const msg = err?.error?.error?.message || err?.error?.message || err.message || 'Failed to deactivate employee';
                            abp.notify.error(msg);
                        }
                    });
                }
            }
        );
    }

    clearFilters(): void {
        this.keyword = '';
        this.emailFilter = '';
        this.departmentFilter = '';
        this.isActive = undefined;
        this.sortBy = 'firstName';
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.applyFilters();
    }

    toggleFilters(): void {
        this.advancedFiltersVisible = !this.advancedFiltersVisible;
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilters();
    }

    refreshData(): void {
        this.loadEmployees();
    }

    // ============================= Load & Filter Methods =============================
    public loadEmployees(): void {
        this.isLoading = true;
        
        this._employeeService.getAllEmployees().subscribe({
            next: (employees) => {
                this.employees = employees || [];
                this.applyFilters();
                this.isLoading = false;
            },
            error: (err) => {
                const msg = err?.error?.error?.message || err?.error?.message || err.message || 'Unknown error';
                abp.notify.error('Failed to load employees: ' + msg);
                this.employees = [];
                this.filteredEmployees = [];
                this.isLoading = false;
            }
        });
    }

    public applyFilters(): void {
        let filtered = [...this.employees];

        // Apply keyword filter (searches in firstName, lastName, email)
        if (this.keyword && this.keyword.trim()) {
            const searchTerm = this.keyword.toLowerCase().trim();
            filtered = filtered.filter(emp => 
                emp.firstName.toLowerCase().includes(searchTerm) ||
                emp.lastName.toLowerCase().includes(searchTerm) ||
                emp.email.toLowerCase().includes(searchTerm) ||
                emp.userName?.toLowerCase().includes(searchTerm)
            );
        }

        // Apply email filter
        if (this.emailFilter && this.emailFilter.trim()) {
            const emailTerm = this.emailFilter.toLowerCase().trim();
            filtered = filtered.filter(emp => 
                emp.email.toLowerCase().includes(emailTerm)
            );
        }

        // Apply active status filter
        if (this.isActive !== undefined && this.isActive !== null) {
            filtered = filtered.filter(emp => emp.isActive === this.isActive);
        }

        // Apply sorting
        filtered = this.sortEmployees(filtered);

        // Update filtered results
        this.filteredEmployees = filtered;
        this.totalItems = this.filteredEmployees.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // Reset to first page if current page is beyond available pages
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = 1;
        }

        console.log('Filters applied:', {
            keyword: this.keyword,
            emailFilter: this.emailFilter,
            isActive: this.isActive,
            totalResults: this.totalItems
        });
    }

    private sortEmployees(employees: EmployeeDto[]): EmployeeDto[] {
        return employees.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (this.sortBy) {
                case 'firstName':
                    aValue = a.firstName?.toLowerCase() || '';
                    bValue = b.firstName?.toLowerCase() || '';
                    break;
                case 'lastName':
                    aValue = a.lastName?.toLowerCase() || '';
                    bValue = b.lastName?.toLowerCase() || '';
                    break;
                case 'email':
                    aValue = a.email?.toLowerCase() || '';
                    bValue = b.email?.toLowerCase() || '';
                    break;
                case 'isActive':
                    aValue = a.isActive ? 1 : 0;
                    bValue = b.isActive ? 1 : 0;
                    break;
                case 'creationTime':
                    aValue = new Date(a.creationTime || 0).getTime();
                    bValue = new Date(b.creationTime || 0).getTime();
                    break;
                default:
                    aValue = a.firstName?.toLowerCase() || '';
                    bValue = b.firstName?.toLowerCase() || '';
            }

            if (aValue < bValue) {
                return this.sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return this.sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    public setSortBy(field: string): void {
        if (this.sortBy === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortDirection = 'asc';
        }
        this.applyFilters();
    }

    public getPaginatedEmployees(): EmployeeDto[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        return this.filteredEmployees.slice(startIndex, endIndex);
    }
    // ============================= Paged Listing =============================

    protected list(
        request: PagedEmployeesRequestDto,
        pageNumber: number,
        finishedCallback: Function
    ): void {
        this.isLoading = true;
        request.keyword = this.keyword;
        request.isActive = this.isActive;

        this._employeeService.getAll(
            request.maxResultCount || this.pageSize,
            request.skipCount || 0,
            request.keyword || '',
            request.isActive
        )
            .pipe(finalize(() => {
                finishedCallback();
                this.isLoading = false;
            }))
            .subscribe(
                (result) => {
                    this.employees = result.items || [];
                    this.totalItems = result.totalCount || 0;
                    this.pageSize = request.maxResultCount || 10;
                    this.currentPage = pageNumber;
                    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
                    console.log('Paged employees loaded:', result);
                },
                (error) => {
                    console.error('Error in paged list:', error);
                    const msg = error?.error?.error?.message || error?.error?.message || error.message || 'Unknown error';
                    abp.notify.error('Failed to load employees: ' + msg);
                    this.employees = [];
                }
            );
    }

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    protected delete(): void {
        // Not used (we use deactivate instead of delete)
    }

    // ============================= Dialog =============================

    private showCreateOrEditEmployeeDialog(id?: number): void {
        console.log('Opening employee dialog, id:', id);
        let createOrEditEmployeeDialog: BsModalRef;
        
        try {
            if (!id) {
                console.log('Opening create employee dialog');
                createOrEditEmployeeDialog = this._modalService.show(
                    CreateEmployeeDialogBoxComponent,
                    { 
                        class: 'modal-lg',
                        backdrop: 'static',
                        keyboard: false
                    }
                );
            } else {
                console.log('Opening edit employee dialog for id:', id);
                createOrEditEmployeeDialog = this._modalService.show(
                    EditEmployeeDialogBoxComponent,
                    {
                        class: 'modal-lg',
                        backdrop: 'static',
                        keyboard: false,
                        initialState: { 
                            id: id
                        }
                    }
                );
            }

            if (createOrEditEmployeeDialog && createOrEditEmployeeDialog.content) {
                console.log('Dialog opened successfully, subscribing to onSave');
                
                createOrEditEmployeeDialog.content.onSave.subscribe(() => {
                    console.log('Employee saved, refreshing list');
                    this.refreshData();
                });
            } else {
                console.error('Dialog content is null or undefined');
            }
        } catch (error) {
            console.error('Error opening employee dialog:', error);
            abp.notify.error('Failed to open employee dialog');
        }
    }
}

