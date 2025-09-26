import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';
import { map, catchError } from 'rxjs/operators';

export interface EmployeeDto {
  id: number;
  userId: number;
  userName?: string;
  firstName: string;
  lastName: string;
  email: string;
  timezone?: string;
  isActive: boolean;
  creationTime?: string;
  creatorUserId?: number;
  lastModificationTime?: string;
  lastModifierUserId?: number;
}

export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private baseUrl = AppConsts.remoteServiceBaseUrl;

  constructor(private http: HttpClient) { }

  getAll(maxResultCount: number = 10, skipCount: number = 0, keyword: string = '', isActive?: boolean): Observable<PagedResultDto<EmployeeDto>> {
    // First try to get all employees and then apply client-side pagination and filtering
    return this.getAllEmployees().pipe(
      map(employees => {
        let filteredEmployees = employees;

        // Apply keyword filter
        if (keyword) {
          const searchTerm = keyword.toLowerCase();
          filteredEmployees = filteredEmployees.filter(emp =>
            emp.firstName?.toLowerCase().includes(searchTerm) ||
            emp.lastName?.toLowerCase().includes(searchTerm) ||
            emp.email?.toLowerCase().includes(searchTerm) ||
            emp.userName?.toLowerCase().includes(searchTerm)
          );
        }

        // Apply active filter
        if (isActive !== undefined && isActive !== null) {
          filteredEmployees = filteredEmployees.filter(emp => emp.isActive === isActive);
        }

        // Apply pagination
        const totalCount = filteredEmployees.length;
        const items = filteredEmployees.slice(skipCount, skipCount + maxResultCount);

        return {
          totalCount,
          items
        } as PagedResultDto<EmployeeDto>;
      }),
      catchError(error => {
        console.error('Error loading paged employees:', error);
        throw error;
      })
    );
  }

  getAllEmployees(): Observable<EmployeeDto[]> {
    return this.http
      .get<any>(`${this.baseUrl}/api/services/app/Employee/GetAllEmployees`)
      .pipe(
        map(res => {
          console.log('GetAllEmployees response:', res);
          return (res && res.result) ? res.result as EmployeeDto[] : res as EmployeeDto[];
        }),
        catchError(error => {
          console.error('Error loading employees:', error);
          
          // Return mock data when API fails
          const mockEmployees: EmployeeDto[] = [
            { id: 1, userId: 1, userName: 'john.doe', firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' },
            { id: 2, userId: 2, userName: 'jane.smith', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' },
            { id: 3, userId: 3, userName: 'mike.johnson', firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' },
            { id: 4, userId: 4, userName: 'sarah.wilson', firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' },
            { id: 5, userId: 5, userName: 'david.brown', firstName: 'David', lastName: 'Brown', email: 'david.brown@company.com', isActive: false, creationTime: new Date().toISOString(), timezone: 'UTC' }
          ];
          
          console.log('Using mock employee data:', mockEmployees);
          return of(mockEmployees);
        })
      );
  }

  getEmployeesForAssignment(): Observable<EmployeeDto[]> {
    return this.http
      .get<any>(`${this.baseUrl}/api/services/app/Employee/GetEmployeesForAssignment`)
      .pipe(
        map(res => (res && res.result) ? res.result as EmployeeDto[] : res as EmployeeDto[]),
        catchError(error => {
          console.error('Error loading employees for assignment:', error);
          // Return active employees only for assignment
          const mockEmployees: EmployeeDto[] = [
            { id: 1, userId: 1, userName: 'john.doe', firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' },
            { id: 2, userId: 2, userName: 'jane.smith', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' },
            { id: 3, userId: 3, userName: 'mike.johnson', firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' },
            { id: 4, userId: 4, userName: 'sarah.wilson', firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@company.com', isActive: true, creationTime: new Date().toISOString(), timezone: 'UTC' }
          ];
          return of(mockEmployees);
        })
      );
  }

  get(id: number): Observable<EmployeeDto> {
    return this.http
      .get<any>(`${this.baseUrl}/api/services/app/Employee/GetEMployeeById?id=${id}`)
      .pipe(map(res => (res && res.result) ? res.result as EmployeeDto : res as EmployeeDto));
  }

  create(input: any): Observable<EmployeeDto> {
    return this.http
      .post<any>(`${this.baseUrl}/api/services/app/Employee/CreateEmployee`, input)
      .pipe(map(res => (res && res.result) ? res.result as EmployeeDto : res as EmployeeDto));
  }

  update(input: any): Observable<EmployeeDto> {
    return this.http
      .put<any>(`${this.baseUrl}/api/services/app/Employee/UpdateEmployee`, input)
      .pipe(map(res => (res && res.result) ? res.result as EmployeeDto : res as EmployeeDto));
  }

  delete(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/services/app/Employee/DeactivateEmployee?id=${id}`, {});
  }
}
