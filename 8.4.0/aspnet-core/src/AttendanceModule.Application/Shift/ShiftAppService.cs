using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using AttendanceModule.AttendanceModuleEntities;
using AttendanceModule.Shift.Dtos;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static AttendanceModule.Authorization.AttendanceModuleAuthorizationProvider;

namespace AttendanceModule.Shift
{
    public class ShiftAppService : ApplicationService, IShiftAppService
    {
        private readonly IRepository<AttendanceModuleEntities.Shift, int> _shiftRepository;
        private readonly IRepository<AttendanceModuleEntities.Roster, int> _rosterRepository;
        private readonly IRepository<AttendanceModuleEntities.Employee, int> _employeeRepository;
        private readonly IMapper _mapper;

        public ShiftAppService(
            IRepository<AttendanceModuleEntities.Shift, int> shiftRepository,
            IRepository<AttendanceModuleEntities.Roster, int> rosterRepository,
            IRepository<AttendanceModuleEntities.Employee, int> employeeRepository,
            IMapper mapper)
        {
            _shiftRepository = shiftRepository;
            _rosterRepository = rosterRepository;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_Create)]
        public async Task<ShiftDto> CreateShiftAsync(CreateShiftDto input)
        {
            try
            {
                Logger.Info($"Creating shift: {input.Name}");

                var shift = _mapper.Map<AttendanceModuleEntities.Shift>(input);
                shift.TenantId = AbpSession.TenantId ?? 1;
                shift.CreatedBy = (int)(AbpSession.UserId ?? 0);

                Logger.Info($"Shift TenantId: {shift.TenantId}, CreatedBy: {shift.CreatedBy}");

                var createdShift = await _shiftRepository.InsertAsync(shift);
                await CurrentUnitOfWork.SaveChangesAsync();

                Logger.Info($"Shift created with ID: {createdShift.Id}");

                return _mapper.Map<ShiftDto>(createdShift);
            }
            catch (Exception ex)
            {
                Logger.Error($"Error creating shift: {ex.Message}", ex);
                throw;
            }
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_View)]
        public async Task<ShiftDto> GetShiftByIdAsync(int id)
        {
            var shift = await _shiftRepository.FirstOrDefaultAsync(id);
            if (shift == null)
            {
                throw new UserFriendlyException("Shift not found.");
            }

            return _mapper.Map<ShiftDto>(shift);
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_View)]
        public async Task<PagedResultDto<ShiftDto>> GetPagedShiftListAsync(GetShiftListInputDTO input)
        {
            try
            {
                // Get current tenant ID for debugging
                var currentTenantId = AbpSession.TenantId;
                Logger.Info($"Getting shifts for TenantId: {currentTenantId}");

                var query = _shiftRepository.GetAll();

                if (!string.IsNullOrWhiteSpace(input.keyword))
                {
                    query = query.Where(s =>
                        s.Name.Contains(input.keyword) ||
                        (s.RecurrenceRule != null && s.RecurrenceRule.Contains(input.keyword)));
                }

                var totalCount = await query.CountAsync();
                Logger.Info($"Total shifts found: {totalCount}");

                var shifts = await query
                    .OrderBy(s => s.Name)
                    .Skip(input.SkipCount)
                    .Take(input.MaxResultCount)
                    .ToListAsync();

                var shiftDtos = _mapper.Map<List<ShiftDto>>(shifts);
                Logger.Info($"Returning {shiftDtos.Count} shifts");

                return new PagedResultDto<ShiftDto>(totalCount, shiftDtos);
            }
            catch (Exception ex)
            {
                Logger.Error("Error in GetPagedShiftListAsync", ex);
                throw;
            }
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_Edit)]
        public async Task<ShiftDto> UpdateShiftAsync(int id, UpdateShiftDto input)
        {
            var shift = await _shiftRepository.GetAsync(id);
            if (shift == null)
            {
                throw new UserFriendlyException("Shift not found.");
            }

            _mapper.Map(input, shift);
            await _shiftRepository.UpdateAsync(shift);

            return _mapper.Map<ShiftDto>(shift);
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_Delete)]
        public async Task DeleteShiftAsync(int id)
        {
            var shift = await _shiftRepository.GetAsync(id);
            if (shift == null)
            {
                throw new UserFriendlyException("Shift not found.");
            }

            // Check if shift is in use
            var hasRosters = await _rosterRepository.GetAll()
                .AnyAsync(r => r.ShiftId == id);

            if (hasRosters)
            {
                throw new UserFriendlyException("Cannot delete shift that is assigned to rosters.");
            }

            await _shiftRepository.DeleteAsync(id);
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_View)]
        public async Task<List<ShiftDto>> GetAllShiftsAsync()
        {
            try
            {
                Logger.Info($"GetAllShiftsAsync - TenantId: {AbpSession.TenantId}");

                // First, let's check without any filters
                var allShiftsCount = await _shiftRepository.GetAll().CountAsync();
                Logger.Info($"Total shifts in repository: {allShiftsCount}");

                // Now with tenant filter (should be automatic)
                var shifts = await _shiftRepository.GetAll()
                    .OrderBy(s => s.Name)
                    .ToListAsync();

                Logger.Info($"Shifts for current tenant: {shifts.Count}");

                foreach (var shift in shifts)
                {
                    Logger.Info($"Shift: Id={shift.Id}, Name={shift.Name}, TenantId={shift.TenantId}");
                }

                return _mapper.Map<List<ShiftDto>>(shifts);
            }
            catch (Exception ex)
            {
                Logger.Error("Error in GetAllShiftsAsync", ex);
                throw;
            }
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_View)]
        public async Task<List<RosterWithShiftDto>> GetRosterAsync(int? employeeId, DateTime startDate, DateTime endDate)
        {
            Logger.Info($"GetRosterAsync called with: employeeId={employeeId}, startDate={startDate:yyyy-MM-dd}, endDate={endDate:yyyy-MM-dd}");

            // Use Date property to ensure we compare dates without time
            var startDateOnly = startDate.Date;
            var endDateOnly = endDate.Date.AddDays(1).AddTicks(-1); // Include entire end date

            var query = _rosterRepository
                .GetAllIncluding(r => r.Employee, r => r.Shift)
                .Where(r => r.RosterDate >= startDateOnly && r.RosterDate <= endDateOnly);

            if (employeeId.HasValue)
            {
                query = query.Where(r => r.EmployeeId == employeeId.Value);
            }

            var rosters = await query
                .OrderBy(r => r.RosterDate)
                .ThenBy(r => r.Shift.StartTime)
                .ToListAsync();

            var rosterDtos = rosters.Select(r => new RosterWithShiftDto
            {
                Id = r.Id,
                RosterDate = r.RosterDate.Date, // Ensure date only
                EmployeeId = r.EmployeeId,
                EmployeeName = $"{r.Employee.FirstName} {r.Employee.LastName}",
                Shift = new ShiftDetailsDto
                {
                    Id = r.Shift.Id,
                    Name = r.Shift.Name,
                    StartTime = r.Shift.StartTime,
                    EndTime = r.Shift.EndTime,
                    BreakMinutes = r.Shift.BreakMinutes
                }
            }).ToList();

            Logger.Info($"Returning {rosterDtos.Count} roster entries");
            foreach (var dto in rosterDtos)
            {
                Logger.Info($"Roster: Employee={dto.EmployeeName}, Date={dto.RosterDate:yyyy-MM-dd}, Shift={dto.Shift.Name}");
            }

            return rosterDtos;
        }

        /// <summary>
        /// Get roster for the current logged-in user
        /// </summary>
        [AbpAuthorize(ShiftPermissions.Pages_Shifts_View)]
        public async Task<List<RosterWithShiftDto>> GetMyRosterAsync(DateTime startDate, DateTime endDate)
        {
            var userId = AbpSession.UserId;
            if (!userId.HasValue)
            {
                throw new UserFriendlyException("User not logged in");
            }

            var employee = await _employeeRepository.FirstOrDefaultAsync(e => e.UserId == (int)userId.Value);
            if (employee == null)
            {
                Logger.Warn($"No employee record found for user ID: {userId.Value}");
                return new List<RosterWithShiftDto>();
            }

            // Use Date property to ensure we compare dates without time
            var startDateOnly = startDate.Date;
            var endDateOnly = endDate.Date.AddDays(1).AddTicks(-1); // Include entire end date

            var rosters = await _rosterRepository
                .GetAllIncluding(r => r.Employee, r => r.Shift)
                .Where(r => r.EmployeeId == employee.Id &&
                           r.RosterDate >= startDateOnly &&
                           r.RosterDate <= endDateOnly)
                .OrderBy(r => r.RosterDate)
                .ThenBy(r => r.Shift.StartTime)
                .ToListAsync();

            var rosterDtos = rosters.Select(r => new RosterWithShiftDto
            {
                Id = r.Id,
                RosterDate = r.RosterDate.Date, // Ensure date only
                EmployeeId = r.EmployeeId,
                EmployeeName = $"{r.Employee.FirstName} {r.Employee.LastName}",
                Shift = new ShiftDetailsDto
                {
                    Id = r.Shift.Id,
                    Name = r.Shift.Name,
                    StartTime = r.Shift.StartTime,
                    EndTime = r.Shift.EndTime,
                    BreakMinutes = r.Shift.BreakMinutes
                }
            }).ToList();

            Logger.Info($"Found {rosterDtos.Count} roster entries for employee {employee.Id} between {startDateOnly:yyyy-MM-dd} and {endDateOnly:yyyy-MM-dd}");

            return rosterDtos;
        }

    }

}
