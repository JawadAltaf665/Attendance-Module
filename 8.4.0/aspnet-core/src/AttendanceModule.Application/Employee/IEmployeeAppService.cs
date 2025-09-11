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
        Task<List<EmployeeDto>> GetAllEmployeesAsync();
        Task<EmployeeDto> GetEmployeeByIdAsync(int id);
        Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto input);
        Task<EmployeeDto> UpdateEmployeeAsync(CreateEmployeeDto input);
        Task DeactivateEmployeeAsync(int id);
        Task<PagedResultDto<EmployeeDto>> GetPagedEmployeeListAsync(GetEmployeeListInputDTO input);
    }
}
