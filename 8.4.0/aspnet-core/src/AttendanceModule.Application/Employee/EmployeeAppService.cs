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
using System.Linq.Dynamic.Core;
using System.Linq;
using System.Text;
using Abp.Application.Services.Dto;
using Abp.Linq.Extensions;
using Abp.Extensions;
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
        private readonly IRepository<User, long> _userRepository;
        private readonly IMapper _mapper;
        private readonly UserManager _userManager;

        public EmployeeAppService(
            IRepository<AttendanceModuleEntities.Employee, int> employeeRepository,
            IRepository<User, long> userRepository,
            IMapper mapper,
            UserManager userManager
        )
        {
            _employeeRepository = employeeRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _userManager = userManager;
        }

        /// <summary>
        /// Simple test method to check if the service is working
        /// </summary>
        public async Task<string> TestConnectionAsync()
        {
            try
            {
                Logger.Info("TestConnectionAsync called");
                var userCount = await _userRepository.CountAsync();
                var employeeCount = await _employeeRepository.CountAsync();
                return $"Service is working. Users: {userCount}, Employees: {employeeCount}";
            }
            catch (Exception ex)
            {
                Logger.Error($"Error in TestConnectionAsync: {ex.Message}", ex);
                return $"Error: {ex.Message}";
            }
        }

        /// <summary>
        /// Get all existing ABP Users (not assigned to any employee) for dropdown/selection
        /// </summary>
        public async Task<List<UserDto>> GetAvailableUsersAsync()
        {
            try
            {
                Logger.Info("Starting GetAvailableUsersAsync");
                
                // Get all users that are NOT already assigned to any employee
                var assignedUserIds = await _employeeRepository.GetAll()
                    .Select(e => e.UserId)
                    .ToListAsync();

                Logger.Info($"Found {assignedUserIds.Count} assigned user IDs");

                var availableUsers = await _userRepository.GetAll()
                    .Where(u => u.IsActive && !assignedUserIds.Contains(u.Id))
                    .OrderBy(u => u.Name)
                    .ToListAsync();

                Logger.Info($"Found {availableUsers.Count} available users");

                var result = availableUsers.Select(u => new UserDto
                {
                    Id = u.Id,
                    Name = u.Name ?? "Unknown",
                    Surname = u.Surname ?? "",
                    UserName = u.UserName ?? "unknown",
                    EmailAddress = u.EmailAddress ?? "noemail@domain.com",
                    FullName = $"{u.Name ?? "Unknown"} {u.Surname ?? ""}".Trim()
                }).ToList();

                Logger.Info($"Returning {result.Count} user DTOs");
                return result;
            }
            catch (Exception ex)
            {
                Logger.Error($"Error in GetAvailableUsersAsync: {ex.Message}", ex);
                throw new UserFriendlyException("Failed to retrieve available users: " + ex.Message);
            }
        }

        /// <summary>
        /// Get all existing ABP Users (including assigned ones) for editing
        /// </summary>
        [AbpAuthorize(EmployeePermissions.Pages_Employees_View)]
        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            try
            {
                var users = await _userRepository.GetAll()
                    .Where(u => u.IsActive)
                    .OrderBy(u => u.Name)
                    .ToListAsync();

                return users.Select(u => new UserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Surname = u.Surname,
                    UserName = u.UserName,
                    EmailAddress = u.EmailAddress,
                    FullName = $"{u.Name} {u.Surname}".Trim()
                }).ToList();
            }
            catch (Exception ex)
            {
                Logger.Error("Error in GetAllUsersAsync", ex);
                throw new UserFriendlyException("Failed to retrieve users: " + ex.Message);
            }
        }

        /// <summary>
        /// Create Employee - Only creates employee record, assigns to existing ABP User
        /// </summary>
        public async Task<EmployeeDto> CreateEmployee(CreateEmployeeDto input)
        {
            try
            {
                // Validate that the user exists and is not already assigned
                var user = await _userRepository.FirstOrDefaultAsync(input.UserId);
                if (user == null)
                {
                    throw new UserFriendlyException("Selected user not found");
                }

                // Check if user is already assigned to another employee
                var existingEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == input.UserId);
                if (existingEmployee != null)
                {
                    throw new UserFriendlyException($"User '{user.UserName}' is already assigned to another employee");
                }

                // Create employee record only
                var employee = new AttendanceModuleEntities.Employee
                {
                    UserId = input.UserId,
                    TenantId = AbpSession.TenantId ?? 1,
                    FirstName = input.FirstName ?? user.Name,
                    LastName = input.LastName ?? user.Surname,
                    Email = input.Email ?? user.EmailAddress,
                    Timezone = input.Timezone ?? "UTC",
                    IsActive = input.IsActive
                };

                await _employeeRepository.InsertAsync(employee);
                await CurrentUnitOfWork.SaveChangesAsync();

                Logger.Info($"Employee created successfully for User ID: {input.UserId}");

                return await GetEmployeeByIdAsync(employee.Id);
            }
            catch (Exception ex)
            {
                Logger.Error($"Error creating employee: {ex.Message}", ex);
                throw new UserFriendlyException($"Failed to create employee: {ex.Message}");
            }
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_Delete)]
        public async Task DeactivateEmployeeAsync(int id)
        {
            var employee = await _employeeRepository.FirstOrDefaultAsync(id);
            if (employee == null)
            {
                throw new UserFriendlyException("Employee not found");
            }

            employee.IsActive = false;
            await _employeeRepository.UpdateAsync(employee);

            Logger.Info($"Employee ID: {id} deactivated successfully");
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_View)]
        public async Task<List<EmployeeDto>> GetAllEmployeesAsync()
        {
            try
            {
                Logger.Info("Starting GetAllEmployeesAsync");
                
                var employees = await _employeeRepository.GetAllIncluding(e => e.User).ToListAsync();

                Logger.Info($"Retrieved {employees.Count} employees from database");

                if (!employees.Any())
                {
                    Logger.Info("No employees found in database");
                    return new List<EmployeeDto>();
                }

                Logger.Info($"Mapping {employees.Count} employees to DTOs");
                var result = new List<EmployeeDto>();
                
                foreach (var employee in employees)
                {
                    try
                    {
                        var dto = MapToEmployeeDto(employee);
                        result.Add(dto);
                    }
                    catch (Exception mapEx)
                    {
                        Logger.Error($"Error mapping employee ID {employee.Id}: {mapEx.Message}", mapEx);
                        // Continue with other employees
                    }
                }
                
                Logger.Info($"Successfully mapped {result.Count} employees");
                return result;
            }
            catch (Exception ex)
            {
                Logger.Error($"Error in GetAllEmployeesAsync: {ex.Message}", ex);
                throw new UserFriendlyException("Failed to retrieve employees: " + ex.Message);
            }
        }

        [AbpAuthorize(RosterPermissions.Pages_Rosters_Assign)]
        public async Task<List<EmployeeDto>> GetEmployeesForAssignmentAsync()
        {
            try
            {
                var employees = await _employeeRepository.GetAllIncluding(e => e.User)
                    .Where(e => e.IsActive == true)
                    .ToListAsync();

                Logger.Info($"Found {employees.Count} active employees for assignment");
                return employees.Select(MapToEmployeeDto).ToList();
            }
            catch (Exception ex)
            {
                Logger.Error("Error in GetEmployeesForAssignmentAsync", ex);
                throw new UserFriendlyException("Failed to retrieve employees for assignment: " + ex.Message);
            }
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_View)]
        public async Task<EmployeeDto> GetEmployeeByIdAsync(int id)
        {
            var employee = await _employeeRepository.GetAllIncluding(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
            {
                throw new UserFriendlyException("Employee not found");
            }

            return MapToEmployeeDto(employee);
        }

        public async Task<EmployeeDto> GetCurrentUserEmployeeAsync()
        {
            var userId = AbpSession.UserId;
            if (!userId.HasValue)
            {
                throw new UserFriendlyException("User not logged in");
            }

            var employee = await _employeeRepository.GetAllIncluding(e => e.User)
                .FirstOrDefaultAsync(e => e.UserId == userId.Value);

            if (employee == null)
            {
                throw new UserFriendlyException("No employee record found for current user. Please contact administrator.");
            }

            return MapToEmployeeDto(employee);
        }

        public async Task<EmployeeDto> GetEmployeeByUserIdAsync(long userId)
        {
            var employee = await _employeeRepository.GetAllIncluding(e => e.User)
                .FirstOrDefaultAsync(e => e.UserId == userId);

            if (employee == null)
            {
                throw new UserFriendlyException($"No employee record found for user ID {userId}");
            }

            return MapToEmployeeDto(employee);
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_Edit)]
        public async Task<EmployeeDto> UpdateEmployeeAsync(UpdateEmployeeDto input)
        {
            var employee = await _employeeRepository.FirstOrDefaultAsync(input.Id);
            if (employee == null)
            {
                throw new UserFriendlyException("Employee not found");
            }

            // Check if trying to assign to a different user that's already assigned
            if (input.UserId != employee.UserId)
            {
                var existingEmployee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == input.UserId && e.Id != input.Id);
                if (existingEmployee != null)
                {
                    throw new UserFriendlyException("Selected user is already assigned to another employee");
                }
            }

            // Update employee fields
            employee.UserId = input.UserId;
            employee.FirstName = input.FirstName;
            employee.LastName = input.LastName;
            employee.Email = input.Email;
            employee.Timezone = input.Timezone;
            employee.IsActive = input.IsActive;

            await _employeeRepository.UpdateAsync(employee);
            await CurrentUnitOfWork.SaveChangesAsync();

            return await GetEmployeeByIdAsync(employee.Id);
        }

        [AbpAuthorize(EmployeePermissions.Pages_Employees_View)]
        public async Task<PagedResultDto<EmployeeDto>> GetPagedEmployeeListAsync(GetEmployeeListInputDTO input)
        {
            try
            {
                var query = _employeeRepository
                    .GetAllIncluding(e => e.User)
                    .WhereIf(!input.Keyword.IsNullOrWhiteSpace(),
                        e => (e.User.Name.Contains(input.Keyword) ||
                              e.User.Surname.Contains(input.Keyword) ||
                              e.User.EmailAddress.Contains(input.Keyword) ||
                              e.FirstName.Contains(input.Keyword) ||
                              e.LastName.Contains(input.Keyword) ||
                              e.Email.Contains(input.Keyword)))
                    .WhereIf(input.IsActive.HasValue, e => e.IsActive == input.IsActive);

                var totalCount = await query.CountAsync();

                var sorting = string.IsNullOrWhiteSpace(input.Sorting) ? "Id desc" : input.Sorting;

                var employees = await query
                    .OrderBy(sorting)
                    .PageBy(input)
                    .ToListAsync();

                return new PagedResultDto<EmployeeDto>(
                    totalCount,
                    employees.Select(MapToEmployeeDto).ToList()
                );
            }
            catch (Exception ex)
            {
                Logger.Error("Error in GetPagedEmployeeListAsync", ex);
                throw new UserFriendlyException("Failed to retrieve employees: " + ex.Message);
            }
        }

        private EmployeeDto MapToEmployeeDto(AttendanceModuleEntities.Employee employee)
        {
            try
            {
                return new EmployeeDto
                {
                    Id = employee.Id,
                    UserId = employee.UserId,
                    FirstName = employee.User?.Name ?? employee.FirstName ?? "Unknown",
                    LastName = employee.User?.Surname ?? employee.LastName ?? "",
                    Email = employee.User?.EmailAddress ?? employee.Email ?? "noemail@domain.com",
                    UserName = employee.User?.UserName ?? "unknown",
                    Timezone = employee.Timezone ?? "UTC",
                    IsActive = employee.IsActive,
                    CreationTime = employee.CreationTime,
                    CreatorUserId = employee.CreatorUserId,
                    LastModificationTime = employee.LastModificationTime,
                    LastModifierUserId = employee.LastModifierUserId
                };
            }
            catch (Exception ex)
            {
                Logger.Error($"Error in MapToEmployeeDto for employee ID {employee?.Id}: {ex.Message}", ex);
                throw;
            }
        }
    }
}


