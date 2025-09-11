using Abp.Application.Services;
using Abp.Application.Services.Dto;
using AttendanceModule.Employee.Dtos;
using AttendanceModule.Shift.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.Shift
{
    public interface IShiftAppService: IApplicationService
    {
        Task<ShiftDto> CreateShiftAsync(CreateShiftDto input);
        Task<ShiftDto> GetShiftByIdAsync(int id);
        Task<PagedResultDto<ShiftDto>> GetPagedShiftListAsync(GetShiftListInputDTO input);

    }
}
