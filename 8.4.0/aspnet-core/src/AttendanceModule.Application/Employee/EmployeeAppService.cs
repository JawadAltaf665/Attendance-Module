using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using AttendanceModule.AttendanceModuleEntities;
using AttendanceModule.Employee.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static AttendanceModule.Authorization.AttendanceModuleAuthorizationProvider;
using AttendanceModule.Authorization.Users;
using Microsoft.AspNetCore.Identity;
using Abp.Runtime.Session;

namespace AttendanceModule.Employee
{
    public class EmployeeAppService : ApplicationService, IEmployeeAppService
    {
        private readonly IRepository<AttendanceModuleEntities.Employee, int> _employeeRepository;
        private readonly IMapper _mapper;
        private readonly UserManager _userManager;

        public EmployeeAppService(
            IRepository<AttendanceModuleEntities.Employee, int> employeeRepository,
            IMapper mapper,
            UserManager userManager
        )
        {
            _employeeRepository = employeeRepository;
            _mapper = mapper;
            _userManager = userManager;
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_Create)]
        public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto input)
        {
            var employee = _mapper.Map<AttendanceModuleEntities.Employee>(input);

            employee.TenantId = 1;
            employee.IsActive = true;

            await _employeeRepository.InsertAsync(employee);

            return _mapper.Map<EmployeeDto>(employee);
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_Delete)]
        public async Task DeactivateEmployeeAsync(int id)
        {
            var employee = await _employeeRepository.FirstOrDefaultAsync(id);
            if (employee == null)
            {
                throw new UserFriendlyException("Employee not found");
            }

            employee.IsActive = false; // soft delete instead of hard delete
            await _employeeRepository.UpdateAsync(employee);
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_View)]
        public async Task<List<EmployeeDto>> GetAllEmployeesAsync()
        {
            var employees = await _employeeRepository.GetAllListAsync();

            if (!employees.Any())
            {
                throw new UserFriendlyException("No employees found");
            }

            return _mapper.Map<List<EmployeeDto>>(employees);
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_View)]
        public async Task<EmployeeDto> GetEmployeeByIdAsync(int id)
        {
            var employee = await _employeeRepository.FirstOrDefaultAsync(id);
            if (employee == null)
            {
                throw new UserFriendlyException("Employee not found");
            }

            return _mapper.Map<EmployeeDto>(employee);
        }

        public async Task<EmployeeDto> GetCurrentUserEmployeeAsync()
        {
            var userId = AbpSession.UserId;
            if (!userId.HasValue)
            {
                throw new UserFriendlyException("User not logged in");
            }

            var employee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == userId.Value);
            if (employee == null)
            {
                // Auto-create employee record for the current user
                var user = await _userManager.GetUserByIdAsync(userId.Value);
                employee = new AttendanceModuleEntities.Employee
                {
                    UserId = (int)userId.Value,
                    EmployeeNumber = $"EMP{userId.Value:D4}",
                    FirstName = user.Name?.Split(' ').FirstOrDefault() ?? user.UserName,
                    LastName = user.Surname ?? "",
                    Email = user.EmailAddress,
                    Timezone = "UTC",
                    IsActive = true,
                    TenantId = AbpSession.TenantId ?? 1
                };

                employee = await _employeeRepository.InsertAsync(employee);
                await CurrentUnitOfWork.SaveChangesAsync();
            }

            return _mapper.Map<EmployeeDto>(employee);
        }

        public async Task<EmployeeDto> GetEmployeeByUserIdAsync(int userId)
        {
            var employee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee == null)
            {
                throw new UserFriendlyException($"No employee record found for user ID {userId}");
            }

            return _mapper.Map<EmployeeDto>(employee);
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_Edit)]
        public async Task<EmployeeDto> UpdateEmployeeAsync(CreateEmployeeDto input)
        {
            var employee = await _employeeRepository.FirstOrDefaultAsync(input.Id);
            if (employee == null)
            {
                throw new UserFriendlyException("Employee not found");
            }

            _mapper.Map(input, employee); // map dto → entity

            await _employeeRepository.UpdateAsync(employee);

            return _mapper.Map<EmployeeDto>(employee);
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_View)]
        public async Task<PagedResultDto<EmployeeDto>> GetPagedEmployeeListAsync(GetEmployeeListInputDTO input)
        {
            var query = _employeeRepository.GetAll();

            if (!string.IsNullOrWhiteSpace(input.keyword))
            {
                query = query.Where(e =>
                    e.FirstName.Contains(input.keyword) ||
                    e.LastName.Contains(input.keyword) ||
                    e.EmployeeNumber.Contains(input.keyword) ||
                    e.Email.Contains(input.keyword));
            }

            var totalCount = await query.CountAsync();

            var employees = await query
                .OrderBy(e => e.FirstName)
                .ThenBy(e => e.LastName)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            var employeeDtos = _mapper.Map<List<EmployeeDto>>(employees);

            return new PagedResultDto<EmployeeDto>(totalCount, employeeDtos);
        }
    }
}


