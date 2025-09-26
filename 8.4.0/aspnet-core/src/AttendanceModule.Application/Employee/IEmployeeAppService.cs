using Abp.Application.Services;
using Abp.Application.Services.Dto;
using AttendanceModule.Employee.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Employee
{
    public interface IEmployeeAppService : IApplicationService
    {
        Task<string> TestConnectionAsync();
        Task<List<UserDto>> GetAvailableUsersAsync();
        Task<List<UserDto>> GetAllUsersAsync();
        Task<List<EmployeeDto>> GetAllEmployeesAsync();
        Task<EmployeeDto> GetEmployeeByIdAsync(int id);
        Task<EmployeeDto> GetCurrentUserEmployeeAsync();
        Task<EmployeeDto> GetEmployeeByUserIdAsync(long userId);
        Task<EmployeeDto> CreateEmployee(CreateEmployeeDto input);
        Task<EmployeeDto> UpdateEmployeeAsync(UpdateEmployeeDto input);
        Task DeactivateEmployeeAsync(int id);
        Task<PagedResultDto<EmployeeDto>> GetPagedEmployeeListAsync(GetEmployeeListInputDTO input);
    }
}
