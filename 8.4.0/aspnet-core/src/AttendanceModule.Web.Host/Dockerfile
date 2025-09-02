FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

WORKDIR /src
COPY ["src/AttendanceModule.Web.Host/AttendanceModule.Web.Host.csproj", "src/AttendanceModule.Web.Host/"]
COPY ["src/AttendanceModule.Web.Core/AttendanceModule.Web.Core.csproj", "src/AttendanceModule.Web.Core/"]
COPY ["src/AttendanceModule.Application/AttendanceModule.Application.csproj", "src/AttendanceModule.Application/"]
COPY ["src/AttendanceModule.Core/AttendanceModule.Core.csproj", "src/AttendanceModule.Core/"]
COPY ["src/AttendanceModule.EntityFrameworkCore/AttendanceModule.EntityFrameworkCore.csproj", "src/AttendanceModule.EntityFrameworkCore/"]
WORKDIR "/src/src/AttendanceModule.Web.Host"
RUN dotnet restore 

WORKDIR /src
COPY ["src/AttendanceModule.Web.Host", "src/AttendanceModule.Web.Host"]
COPY ["src/AttendanceModule.Web.Core", "src/AttendanceModule.Web.Core"]
COPY ["src/AttendanceModule.Application", "src/AttendanceModule.Application"]
COPY ["src/AttendanceModule.Core", "src/AttendanceModule.Core"]
COPY ["src/AttendanceModule.EntityFrameworkCore", "src/AttendanceModule.EntityFrameworkCore"]
WORKDIR "/src/src/AttendanceModule.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:7.0
EXPOSE 80
WORKDIR /app
COPY --from=build /publish .
ENTRYPOINT ["dotnet", "AttendanceModule.Web.Host.dll"]
