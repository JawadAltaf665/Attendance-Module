import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';

export interface ShiftDto {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  recurrenceRule?: string;
  createdBy?: number;
  creationTime?: Date;
  lastModificationTime?: Date;
}

export interface CreateShiftDto {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  recurrenceRule?: string;
}

export interface UpdateShiftDto {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  recurrenceRule?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private baseUrl = AppConsts.remoteServiceBaseUrl;

  constructor(private http: HttpClient) { }

  getAllShifts(): Observable<ShiftDto[]> {
    const url = `${this.baseUrl}/api/services/app/Shift/GetAllShifts`;
    return this.http.get<ShiftDto[]>(url);
  }

  getShiftById(id: number): Observable<ShiftDto> {
    const url = `${this.baseUrl}/api/services/app/Shift/GetShiftById?id=${id}`;
    return this.http.get<ShiftDto>(url);
  }

  createShift(input: CreateShiftDto): Observable<ShiftDto> {
    const url = `${this.baseUrl}/api/services/app/Shift/CreateShift`;
    return this.http.post<ShiftDto>(url, input);
  }

  updateShift(id: number, input: UpdateShiftDto): Observable<ShiftDto> {
    const url = `${this.baseUrl}/api/services/app/Shift/UpdateShift?id=${id}`;
    return this.http.put<ShiftDto>(url, input);
  }

  deleteShift(id: number): Observable<void> {
    const url = `${this.baseUrl}/api/services/app/Shift/DeleteShift?id=${id}`;
    return this.http.delete<void>(url);
  }

  getPagedShifts(keyword?: string, skipCount: number = 0, maxResultCount: number = 10): Observable<any> {
    const url = `${this.baseUrl}/api/services/app/Shift/GetPagedShiftList`;
    const params: any = {
      keyword: keyword || '',
      SkipCount: skipCount,
      MaxResultCount: maxResultCount
    };
    return this.http.get<any>(url, { params });
  }

  // Helper method to format recurrence rule into human-readable text
  formatRecurrenceRule(rule: string): string {
    if (!rule) return 'One-time shift';

    // Parse common recurrence patterns
    if (rule.includes('FREQ=DAILY')) return 'Daily';
    if (rule.includes('FREQ=WEEKLY')) {
      const days = this.extractWeekdays(rule);
      return days.length > 0 ? `Weekly on ${days.join(', ')}` : 'Weekly';
    }
    if (rule.includes('FREQ=MONTHLY')) return 'Monthly';

    return rule;
  }

  private extractWeekdays(rule: string): string[] {
    const dayMap = {
      'MO': 'Monday',
      'TU': 'Tuesday',
      'WE': 'Wednesday',
      'TH': 'Thursday',
      'FR': 'Friday',
      'SA': 'Saturday',
      'SU': 'Sunday'
    };

    const match = rule.match(/BYDAY=([A-Z,]+)/);
    if (match) {
      const days = match[1].split(',');
      return days.map(d => dayMap[d] || d);
    }

    return [];
  }
}