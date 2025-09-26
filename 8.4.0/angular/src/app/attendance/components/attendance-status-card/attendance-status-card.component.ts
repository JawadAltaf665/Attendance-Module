import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-attendance-status-card',
    templateUrl: './attendance-status-card.component.html'
})
export class AttendanceStatusCardComponent {
    @Input() isClockedIn = false;
    @Input() lastPunchTime: Date | null = null;
    @Input() lastPunchType: 'CLOCK_IN' | 'CLOCK_OUT' | null = null;
    @Input() timezone = '';
    @Input() employeeName = '';

    getStatusIcon(): string {
        return this.isClockedIn ? 'fa-user-check' : 'fa-user-clock';
    }

    getStatusText(): string {
        if (this.isClockedIn) {
            return 'Currently Working';
        } else if (this.lastPunchTime) {
            return 'Not Working';
        } else {
            return 'No Activity Today';
        }
    }

    getStatusClass(): string {
        return this.isClockedIn ? 'status-active' : 'status-inactive';
    }

    getElapsedTime(): string {
        if (!this.lastPunchTime || !this.isClockedIn) {
            return '';
        }

        const now = new Date();
        const diff = now.getTime() - this.lastPunchTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    formatTime(date: Date | null): string {
        if (!date) return '--:--';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}