import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { RosterService, ShiftSwapRequestDetailDto } from '@shared/services/roster.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-manager-swap-approval',
  templateUrl: './manager-swap-approval.component.html',
  styleUrls: ['./manager-swap-approval.component.css']
})
export class ManagerSwapApprovalComponent extends AppComponentBase implements OnInit {
  swapRequests: ShiftSwapRequestDetailDto[] = [];
  loading = false;
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  selectedRequest: ShiftSwapRequestDetailDto | null = null;
  showActionModal = false;
  actionType: 'approve' | 'reject' = 'approve';
  actionComments = '';
  Math = Math; // Expose Math to template

  constructor(
    injector: Injector,
    private rosterService: RosterService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  loadPendingRequests(): void {
    this.loading = true;
    const skipCount = (this.pageNumber - 1) * this.pageSize;

    this.rosterService.getPendingSwapRequests(this.pageSize, skipCount)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (response) => {
          // Handle ABP response wrapper format
          const result = response.result || response;
          this.swapRequests = result.items || [];
          this.totalCount = result.totalCount || 0;
        },
        (error) => {
          console.error('Failed to load swap requests:', error);
          const errorMessage = error?.error?.error?.message || 'Failed to load swap requests';
          abp.notify.error(errorMessage);
        }
      );
  }

  openActionModal(request: ShiftSwapRequestDetailDto, action: 'approve' | 'reject'): void {
    this.selectedRequest = request;
    this.actionType = action;
    this.actionComments = '';
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedRequest = null;
    this.actionComments = '';
  }

  confirmAction(): void {
    if (!this.selectedRequest) return;

    const confirmMessage = this.actionType === 'approve'
      ? `Are you sure you want to approve this shift swap request? The rosters will be automatically updated.`
      : `Are you sure you want to reject this shift swap request?`;

    abp.message.confirm(
      confirmMessage,
      `Confirm ${this.actionType === 'approve' ? 'Approval' : 'Rejection'}`,
      (result: boolean) => {
        if (result) {
          this.processAction();
        }
      }
    );
  }

  private processAction(): void {
    if (!this.selectedRequest) return;

    this.loading = true;
    const action$ = this.actionType === 'approve'
      ? this.rosterService.approveShiftSwap(this.selectedRequest.id, this.actionComments)
      : this.rosterService.rejectShiftSwap(this.selectedRequest.id, this.actionComments);

    action$
      .pipe(finalize(() => {
        this.loading = false;
        this.closeActionModal();
      }))
      .subscribe(
        (result) => {
          const message = this.actionType === 'approve'
            ? 'Shift swap request approved successfully. Employees have been notified.'
            : 'Shift swap request rejected. The requester has been notified.';
          abp.notify.success(message);
          this.loadPendingRequests();
        },
        (error) => {
          console.error(`Failed to ${this.actionType} swap request:`, error);
          
          // Extract detailed error message
          let errorMessage = `Failed to ${this.actionType} swap request`;
          if (error?.error?.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (error?.status) {
            switch (error.status) {
              case 400:
                errorMessage = `Bad request: Invalid data provided for ${this.actionType} action`;
                break;
              case 401:
                errorMessage = 'Unauthorized: You do not have permission to perform this action';
                break;
              case 403:
                errorMessage = 'Forbidden: Access denied for this operation';
                break;
              case 404:
                errorMessage = 'Not found: The swap request no longer exists';
                break;
              case 500:
                errorMessage = 'Server error: Please try again later or contact support';
                break;
              default:
                errorMessage = `HTTP ${error.status}: ${this.actionType} operation failed`;
            }
          }
          
          abp.notify.error(errorMessage);
          
          // Log full error for debugging
          console.error('Full error details:', {
            status: error?.status,
            statusText: error?.statusText,
            error: error?.error,
            message: error?.message,
            url: error?.url,
            requestId: this.selectedRequest?.id,
            actionType: this.actionType,
            comments: this.actionComments
          });
        }
      );
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'badge bg-warning';
      case 'APPROVED':
        return 'badge bg-success';
      case 'REJECTED':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  onPageChange(page: number): void {
    this.pageNumber = page;
    this.loadPendingRequests();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDaysDifference(date: string): number {
    const rosterDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    rosterDate.setHours(0, 0, 0, 0);
    const diffTime = rosterDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUrgencyClass(date: string): string {
    const days = this.getDaysDifference(date);
    if (days <= 2) return 'text-danger';
    if (days <= 7) return 'text-warning';
    return 'text-success';
  }
}