using System;

namespace AttendanceModule.Leave.Dtos
{
    public class LeaveBalanceDto
    {
        public int EmployeeId { get; set; }
        public string LeaveType { get; set; }
        public decimal TotalAllocation { get; set; }
        public decimal UsedDays { get; set; }
        public decimal AvailableDays { get; set; }
        public DateTime AsOfDate { get; set; }
    }

    public class EmployeeLeaveBalanceDto
    {
        public int EmployeeId { get; set; }
        public LeaveBalanceDto[] Balances { get; set; }
    }
}