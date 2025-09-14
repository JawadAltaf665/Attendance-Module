import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';

export interface ShiftDetails {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export interface RosterWithShift {
  id: number;
  rosterDate: string;
  employeeId: number;
  employeeName: string;
  shift: ShiftDetails;
}

export interface CreateRosterDto {
  rosterDate: string;
  employeeId: number;
  shiftId: number;
}

export interface ShiftSwapRequestDto {
  requesterId: number;
  targetEmployeeId: number;
  shiftId: number;
  rosterDate: string;
  reason: string;
  proposedDate?: string;
}

export interface ShiftSwapRequestDetailDto {
  id: number;
  requesterId: number;
  requesterName: string;
  targetEmployeeId: number;
  targetEmployeeName: string;
  shiftId: number;
  shiftName: string;
  rosterDate: string;
  reason: string;
  proposedDate?: string;
  status: string;
  approverId?: number;
  approverName?: string;
  approverComments?: string;
  actionDate?: string;
  creationTime: string;
}

export interface ApproveRejectSwapRequestDto {
  swapRequestId: number;
  comments?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RosterService {
  private baseUrl = AppConsts.remoteServiceBaseUrl;

  constructor(private http: HttpClient) { }

  getRoster(employeeId: number | null, startDate: Date, endDate: Date): Observable<RosterWithShift[]> {
    // Format dates as YYYY-MM-DD in local timezone to avoid timezone issues
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let params = new HttpParams()
      .set('startDate', formatLocalDate(startDate))
      .set('endDate', formatLocalDate(endDate));

    if (employeeId !== null) {
      params = params.set('employeeId', employeeId.toString());
    }

    return this.http.get<RosterWithShift[]>(`${this.baseUrl}/api/services/app/Shift/GetRoster`, { params });
  }

  getMyRoster(startDate: Date, endDate: Date): Observable<RosterWithShift[]> {
    // Format dates as YYYY-MM-DD in local timezone to avoid timezone issues
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const params = new HttpParams()
      .set('startDate', formatLocalDate(startDate))
      .set('endDate', formatLocalDate(endDate));

    return this.http.get<RosterWithShift[]>(`${this.baseUrl}/api/services/app/Shift/GetMyRoster`, { params });
  }

  assignRoster(input: CreateRosterDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/services/app/Roster/AssignRoster`, input);
  }

  requestShiftSwap(input: ShiftSwapRequestDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/services/app/Roster/RequestShiftSwap`, input);
  }

  getPendingSwapRequests(maxResultCount: number = 10, skipCount: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('MaxResultCount', maxResultCount.toString())
      .set('SkipCount', skipCount.toString())
      .set('Status', 'PENDING');

    return this.http.get(`${this.baseUrl}/api/services/app/Roster/GetPendingSwapRequests`, { params });
  }

  getMySwapRequests(status?: string, maxResultCount: number = 10, skipCount: number = 0): Observable<any> {
    let params = new HttpParams()
      .set('MaxResultCount', maxResultCount.toString())
      .set('SkipCount', skipCount.toString());

    if (status) {
      params = params.set('Status', status);
    }

    return this.http.get(`${this.baseUrl}/api/services/app/Roster/GetMySwapRequests`, { params });
  }

  approveShiftSwap(swapRequestId: number, comments?: string): Observable<any> {
    const input: ApproveRejectSwapRequestDto = {
      swapRequestId: swapRequestId,
      comments: comments
    };
    return this.http.put(`${this.baseUrl}/api/services/app/Roster/ApproveShiftSwap?swapRequestId=${swapRequestId}`, input);
  }

  rejectShiftSwap(swapRequestId: number, comments?: string): Observable<any> {
    const input: ApproveRejectSwapRequestDto = {
      swapRequestId: swapRequestId,
      comments: comments
    };
    return this.http.put(`${this.baseUrl}/api/services/app/Roster/RejectShiftSwap?swapRequestId=${swapRequestId}`, input);
  }
}