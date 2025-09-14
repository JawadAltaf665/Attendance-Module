using AttendanceModule.AttendanceEvents.Dtos;
using AttendanceModule.AttendanceModuleEntities;
using AttendanceModule.Employee.Dtos;
using AttendanceModule.Leave.Dtos;
using AttendanceModule.Roster.Dtos;
using AttendanceModule.Shift.Dtos;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AttendanceModule.AutoMapper
{
    public class AutoMapperProfile: Profile
    {
        public AutoMapperProfile()
        {
            // Employee
            CreateMap<AttendanceModuleEntities.Employee, EmployeeDto>();
            CreateMap<CreateEmployeeDto, AttendanceModuleEntities.Employee>()
                .ForMember(x => x.Rosters, opt => opt.Ignore())
                .ForMember(x => x.AttendanceEvents, opt => opt.Ignore())
                .ForMember(x => x.LeaveRequests, opt => opt.Ignore());

            // Attendence Event
            CreateMap<AttendanceEvent, AttendanceEventDto>();
            CreateMap<ClockEventDto, AttendanceEvent>();

            // Shift
            CreateMap<AttendanceModuleEntities.Shift, ShiftDto>();
            CreateMap<CreateShiftDto, AttendanceModuleEntities.Shift>();
            CreateMap<UpdateShiftDto, AttendanceModuleEntities.Shift>();

            CreateMap<CreateShiftSwapRequestDto, ShiftSwapRequest>();
            CreateMap<ShiftSwapRequest, ShiftSwapRequestDto>();


            // Leave mappings
            CreateMap<LeaveRequest, LeaveDto>(); // entity -> dto
            CreateMap<CreateLeaveDto, LeaveRequest>()  // dto -> entity
                .ForMember(dest => dest.EmployeeId, opt => opt.Ignore())  
                .ForMember(dest => dest.ApproverId, opt => opt.Ignore())   
                .ForMember(dest => dest.Status, opt => opt.Ignore());

            CreateMap<AttendanceModuleEntities.Roster, RosterDto>()
            .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.Employee.FirstName + " " + src.Employee.LastName))
            .ForMember(dest => dest.ShiftName, opt => opt.MapFrom(src => src.Shift.Name));

            CreateMap<CreateRosterDto, AttendanceModuleEntities.Roster>();


        }
    }
}
