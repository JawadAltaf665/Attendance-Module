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
        private readonly IMapper _mapper;

        public ShiftAppService(
            IRepository<AttendanceModuleEntities.Shift, int> shiftRepository,
            IRepository<AttendanceModuleEntities.Roster, int> rosterRepository,
            IMapper mapper)
        {
            _shiftRepository = shiftRepository;
            _rosterRepository = rosterRepository;
            _mapper = mapper;
        }

        [AbpAuthorize(ShiftPermissions.Pages_Shifts_Create)]
        public async Task<ShiftDto> CreateShiftAsync(CreateShiftDto input)
        {
            var shift = _mapper.Map<AttendanceModuleEntities.Shift>(input);
            shift.TenantId = 1;

            await _shiftRepository.InsertAsync(shift);

            return _mapper.Map<ShiftDto>(shift);
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
            var query = _shiftRepository.GetAll();

            if (!string.IsNullOrWhiteSpace(input.keyword))
            {
                query = query.Where(s =>
                    s.Name.Contains(input.keyword) ||
                    s.RecurrenceRule.Contains(input.keyword));
            }

            var totalCount = await query.CountAsync();

            var shifts = await query
                .OrderBy(s => s.Name)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            var shiftDtos = _mapper.Map<List<ShiftDto>>(shifts);
            return new PagedResultDto<ShiftDto>(totalCount, shiftDtos);
        }

        

    }

}
