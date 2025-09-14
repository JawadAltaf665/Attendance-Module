import { Component, Input } from '@angular/core';
import { RosterWithShift } from '@shared/services/roster.service';

@Component({
  selector: 'app-shift-card',
  templateUrl: './shift-card.component.html',
  styleUrls: ['./shift-card.component.css']
})
export class ShiftCardComponent {
  @Input() roster: RosterWithShift;
  @Input() teamView: boolean = false;

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}