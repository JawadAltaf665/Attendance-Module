import { Component, OnInit, Injector } from '@angular/core';
import { RosterService, RosterWithShift } from '@shared/services/roster.service';
import { AppSessionService } from '@shared/session/app-session.service';
import { AppComponentBase } from '@shared/app-component-base';
import { startOfWeek, endOfWeek, addDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-roster',
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.css']
})
export class RosterComponent extends AppComponentBase implements OnInit {
  currentWeekStart: Date;
  currentWeekEnd: Date;
  weekDays: Date[] = [];
  rosters: RosterWithShift[] = [];
  rostersByDate: Map<string, RosterWithShift[]> = new Map();
  loading = false;
  viewMode: 'week' | 'month' = 'week';
  teamView = false;
  selectedShift: RosterWithShift | null = null;
  showShiftDetail = false;
  showAssignModal = false;
  selectedDate: Date | null = null;

  constructor(
    injector: Injector,
    private rosterService: RosterService
  ) {
    super(injector);
    const today = new Date();
    this.currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    this.currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  }

  ngOnInit(): void {
    this.loadRosters();
  }

  loadRosters(): void {
    this.loading = true;
    let startDate: Date;
    let endDate: Date;

    if (this.viewMode === 'week') {
      startDate = this.currentWeekStart;
      endDate = this.currentWeekEnd;
      this.weekDays = eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      startDate = startOfMonth(this.currentWeekStart);
      endDate = endOfMonth(this.currentWeekStart);
      this.weekDays = eachDayOfInterval({ start: startDate, end: endDate });
    }

    // Use the new method for current user if not in team view
    const rosterObservable = this.teamView
      ? this.rosterService.getRoster(null, startDate, endDate)
      : this.rosterService.getMyRoster(startDate, endDate);

    rosterObservable
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (result: any) => {
          // Handle ABP response wrapper
          if (result && result.result) {
            this.rosters = result.result;
          } else if (Array.isArray(result)) {
            this.rosters = result;
          } else if (result && result.items && Array.isArray(result.items)) {
            this.rosters = result.items;
          } else {
            this.rosters = [];
          }
          this.organizeRostersByDate();
          console.log('Loaded rosters:', this.rosters);
        },
        (error) => {
          console.error('Failed to load roster:', error);
          this.rosters = [];
          this.organizeRostersByDate();
          abp.notify.error('Failed to load roster');
        }
      );
  }

  organizeRostersByDate(): void {
    this.rostersByDate.clear();
    if (this.rosters && Array.isArray(this.rosters)) {
      this.rosters.forEach(roster => {
        const dateKey = format(new Date(roster.rosterDate), 'yyyy-MM-dd');
        if (!this.rostersByDate.has(dateKey)) {
          this.rostersByDate.set(dateKey, []);
        }
        this.rostersByDate.get(dateKey)!.push(roster);
      });
    }
  }

  getRostersForDate(date: Date): RosterWithShift[] {
    const dateKey = format(date, 'yyyy-MM-dd');
    return this.rostersByDate.get(dateKey) || [];
  }

  previousPeriod(): void {
    if (this.viewMode === 'week') {
      this.currentWeekStart = addDays(this.currentWeekStart, -7);
      this.currentWeekEnd = addDays(this.currentWeekEnd, -7);
    } else {
      const prevMonth = new Date(this.currentWeekStart);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      this.currentWeekStart = startOfWeek(prevMonth, { weekStartsOn: 1 });
      this.currentWeekEnd = endOfWeek(prevMonth, { weekStartsOn: 1 });
    }
    this.loadRosters();
  }

  nextPeriod(): void {
    if (this.viewMode === 'week') {
      this.currentWeekStart = addDays(this.currentWeekStart, 7);
      this.currentWeekEnd = addDays(this.currentWeekEnd, 7);
    } else {
      const nextMonth = new Date(this.currentWeekStart);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      this.currentWeekStart = startOfWeek(nextMonth, { weekStartsOn: 1 });
      this.currentWeekEnd = endOfWeek(nextMonth, { weekStartsOn: 1 });
    }
    this.loadRosters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'week' ? 'month' : 'week';
    this.loadRosters();
  }

  toggleTeamView(): void {
    this.teamView = !this.teamView;
    this.loadRosters();
  }

  openShiftDetail(roster: RosterWithShift): void {
    this.selectedShift = roster;
    this.showShiftDetail = true;
  }

  closeShiftDetail(): void {
    this.showShiftDetail = false;
    this.selectedShift = null;
  }

  openAssignModal(date: Date): void {
    this.selectedDate = date;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedDate = null;
  }

  onShiftAssigned(): void {
    this.closeAssignModal();
    this.loadRosters(); // Reload to show the new assignment
    abp.notify.success('Shift assigned successfully');
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatDateHeader(date: Date): string {
    return format(date, 'EEE dd');
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  }

  isManager(): boolean {
    return this.permission.isGranted('Pages.Rosters.Assign') ||
           this.permission.isGranted('Pages.Rosters.Swap');
  }

  getMonthWeeks(): Date[] {
    const weeks: Date[] = [];
    const firstDay = startOfMonth(this.currentWeekStart);
    const firstWeek = startOfWeek(firstDay, { weekStartsOn: 0 });
    let currentWeek = firstWeek;

    while (currentWeek <= endOfMonth(this.currentWeekStart)) {
      weeks.push(currentWeek);
      currentWeek = addDays(currentWeek, 7);
    }

    return weeks;
  }

  getWeekDays(weekStart: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentWeekStart.getMonth();
  }
}