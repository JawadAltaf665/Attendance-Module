using System.Threading.Tasks;
using AttendanceModule.Models.TokenAuth;
using AttendanceModule.Web.Controllers;
using Shouldly;
using Xunit;

namespace AttendanceModule.Web.Tests.Controllers
{
    public class HomeController_Tests: AttendanceModuleWebTestBase
    {
        [Fact]
        public async Task Index_Test()
        {
            await AuthenticateAsync(null, new AuthenticateModel
            {
                UserNameOrEmailAddress = "admin",
                Password = "123qwe"
            });

            //Act
            var response = await GetResponseAsStringAsync(
                GetUrl<HomeController>(nameof(HomeController.Index))
            );

            //Assert
            response.ShouldNotBeNullOrEmpty();
        }
    }
}