import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';

export interface EmployeeDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  hireDate?: string;
  isActive: boolean;
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

  getAll(maxResultCount: number = 10, skipCount: number = 0, keyword: string = ''): Observable<PagedResultDto<EmployeeDto>> {
    let params = new HttpParams()
      .set('MaxResultCount', maxResultCount.toString())
      .set('SkipCount', skipCount.toString());

    if (keyword) {
      params = params.set('Keyword', keyword);
    }

    return this.http.get<PagedResultDto<EmployeeDto>>(`${this.baseUrl}/api/services/app/Employee/GetPagedEmployeeList`, { params });
  }

  getAllEmployees(): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(`${this.baseUrl}/api/services/app/Employee/GetAllEmployees`);
  }

  getEmployeesForAssignment(): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(`${this.baseUrl}/api/services/app/Employee/GetEmployeesForAssignment`);
  }

  get(id: number): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.baseUrl}/api/services/app/Employee/Get?Id=${id}`);
  }

  create(input: EmployeeDto): Observable<EmployeeDto> {
    return this.http.post<EmployeeDto>(`${this.baseUrl}/api/services/app/Employee/Create`, input);
  }

  update(input: EmployeeDto): Observable<EmployeeDto> {
    return this.http.put<EmployeeDto>(`${this.baseUrl}/api/services/app/Employee/Update`, input);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/services/app/Employee/Delete?Id=${id}`);
  }
}