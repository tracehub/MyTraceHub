using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(MyMVC.Startup))]
namespace MyMVC
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);

            app.MapSignalR();
        }
    }
}
