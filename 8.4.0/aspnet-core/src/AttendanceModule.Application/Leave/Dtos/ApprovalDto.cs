using System;
using System.Collections.Generic;

namespace AttendanceModule.Leave.Dtos
{
    public class ApprovalRequestDto
    {
        public int ApproverId { get; set; }
        public string Comment { get; set; }
        public DateTime? ApprovalDate { get; set; }
    }

    public class BulkApprovalRequestDto
    {
        public List<int> Ids { get; set; }
        public int ApproverId { get; set; }
        public string Comment { get; set; }
        public bool IsApproved { get; set; }
    }

    public class GetPendingLeavesInputDto
    {
        public int? ManagerId { get; set; }
        public int? TeamId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string LeaveType { get; set; }
    }

    public class LeaveDetailDto : LeaveDto
    {
        public string EmployeeName { get; set; }
        public string ApproverName { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public string RejectionReason { get; set; }
        public decimal TotalDays { get; set; }
    }

    public class ApprovalHistoryDto
    {
        public DateTime ActionDate { get; set; }
        public string Action { get; set; } // SUBMITTED, APPROVED, REJECTED, CANCELLED
        public string ActionBy { get; set; }
        public string Comment { get; set; }
    }
}