using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Timing;
using Abp.UI;
using AttendanceModule.AttendanceEvents.Dtos;
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

namespace AttendanceModule.AttendanceEvents
{
    public class AttendanceAppService : ApplicationService, IAttendenceAppService
    {
        private readonly IRepository<AttendanceEvent, int> _attendenceRepository;
        private readonly IMapper _mapper;


        public AttendanceAppService(
            IRepository<AttendanceEvent, int> attendenceRepository,
            IMapper mapper)
        {
            _attendenceRepository = attendenceRepository;
            _mapper = mapper;
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_ClockInOut)]
        public async Task ClockInAsync(ClockEventDto input)
        {
            var clockIn = new AttendanceEvent
            {
                EmployeeId = input.EmployeeId,
                EventType = "CLOCK_IN",
                EventTime = Clock.Now, // ABP ka helper (UTC save hota hai)
                TenantId = AbpSession.TenantId ?? 1,
                Latitude = input.Latitude,
                Longitude = input.Longitude,
                Notes = input.Notes,
                Source = "Web"
            };

            await _attendenceRepository.InsertAsync(clockIn);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_ClockInOut)]
        public async Task ClockOutAsync(ClockEventDto input)
        {
            var clockOut = new AttendanceEvent
            {
                EmployeeId = input.EmployeeId,
                EventType = "CLOCK_OUT",
                EventTime = Clock.Now,
                TenantId = AbpSession.TenantId ?? 1,
                Latitude = input.Latitude,
                Longitude = input.Longitude,
                Notes = input.Notes,
                Source = "Web"
            };

            await _attendenceRepository.InsertAsync(clockOut);
        }

        //Get All Attendance Events
        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetAllAttendenceEventsAsync()
        {
            var attendenceEvents = await _attendenceRepository.GetAllListAsync();

            if (!attendenceEvents.Any())
            {
                throw new UserFriendlyException("No attendance events found!");
            }

            return _mapper.Map<List<AttendanceEventDto>>(attendenceEvents);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<PagedResultDto<AttendanceEventDto>> GetPagedAttendenceListAsync(GetAttendenceListInputDTO input)
        {
            var query = _attendenceRepository.GetAll();

            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                query = query.Where(a => a.EventType.Contains(input.Keyword));
            }

            var totalCount = await query.CountAsync();

            var attendence = await query
                .OrderByDescending(e => e.EventTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            var attendenceDto = _mapper.Map<List<AttendanceEventDto>>(attendence);

            return new PagedResultDto<AttendanceEventDto>(totalCount, attendenceDto);
        }


        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetEmployeeAttendanceAsync(int employeeId, DateTime start, DateTime end)
        {
            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId && e.EventTime >= start && e.EventTime <= end)
                .OrderBy(e => e.EventTime)
                .ToListAsync();

            return _mapper.Map<List<AttendanceEventDto>>(events);
        }

        [AbpAuthorize(AttendencePermissions.Pages_Attendance_View)]
        public async Task<List<AttendanceEventDto>> GetTodayAttendanceAsync(int employeeId)
        {
            var today = DateTime.UtcNow.Date;

            var events = await _attendenceRepository
                .GetAll()
                .Where(e => e.EmployeeId == employeeId && e.EventTime.Date == today)
                .OrderBy(e => e.EventTime)
                .ToListAsync();

            return _mapper.Map<List<AttendanceEventDto>>(events);
        }
    }


}

