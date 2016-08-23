# MyTraceHub

The CS projects created through VS 2015 are to demonstrate how to make existing Web applications have TraceHub functions through importing one of the NuGet packages of TraceHub.

This is also used to test how well the TraceHub components could be integrated with your Web and service appplications.

## MyMVC

This is an ASP.NET MVC application.

### Initial Twists

1. Optionally have Microsoft ApplicationInsights components all uninstalled. These components might have been introduced during scaffolding of MVC.
2. Update all NuGet packages to the latest.
3. **Install Fonlow.TraceHub NuGet package. And this will introduce references to Fonlow.TraceHub.Core and Microsoft.AspNet.SignalR packages.**
4. **In Startup.cs, add `app.MapSignalR();`**

### Optional twists

Depending on how the scaffolding of your MVC template had gone through or how you had added functionality, you may or may not need these twists in your existing ASP.NET MVC application.

#### 1. In App_Start/Startup.Auth.cs, add the following

```c#
        public static OAuthAuthorizationServerOptions OAuthOptions { get; private set; }

        public static string PublicClientId { get; private set; }
        
        public void ConfigureAuth(IAppBuilder app)
        {
        ...
        ...
            PublicClientId = "self";
            OAuthOptions = new OAuthAuthorizationServerOptions
            {
                TokenEndpointPath = new PathString("/Token"),
                Provider = new ApplicationOAuthProvider(PublicClientId),
                AuthorizeEndpointPath = new PathString("/api/Account/ExternalLogin"),
                AccessTokenExpireTimeSpan = TimeSpan.FromDays(14),
                // In production mode set AllowInsecureHttp = false
                AllowInsecureHttp = true
            };

            // Enable the application to use bearer tokens to authenticate users
            app.UseOAuthBearerTokens(OAuthOptions);

```

#### 2. In the project, add ApplicationOAuthProvider

```c#
    public class ApplicationOAuthProvider : OAuthAuthorizationServerProvider
    {
        private readonly string _publicClientId;

        public ApplicationOAuthProvider(string publicClientId)
        {
            if (publicClientId == null)
            {
                throw new ArgumentNullException("publicClientId");
            }

            _publicClientId = publicClientId;
        }

        public override async Task GrantResourceOwnerCredentials(OAuthGrantResourceOwnerCredentialsContext context)
        {
            var userManager = context.OwinContext.GetUserManager<ApplicationUserManager>();

            ApplicationUser user = await userManager.FindAsync(context.UserName, context.Password);

            if (user == null)
            {
                context.SetError("invalid_grant", "The user name or password is incorrect.");
                return;
            }

            ClaimsIdentity oAuthIdentity = await user.GenerateUserIdentityAsync(userManager,
               OAuthDefaults.AuthenticationType);
            ClaimsIdentity cookiesIdentity = await user.GenerateUserIdentityAsync(userManager,
                CookieAuthenticationDefaults.AuthenticationType);

            AuthenticationProperties properties = CreateProperties(user.UserName);
            AuthenticationTicket ticket = new AuthenticationTicket(oAuthIdentity, properties);
            context.Validated(ticket);
            context.Request.Context.Authentication.SignIn(cookiesIdentity);
        }

        public override Task TokenEndpoint(OAuthTokenEndpointContext context)
        {
            foreach (KeyValuePair<string, string> property in context.Properties.Dictionary)
            {
                context.AdditionalResponseParameters.Add(property.Key, property.Value);
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientAuthentication(OAuthValidateClientAuthenticationContext context)
        {
            // Resource owner password credentials does not provide a client ID.
            if (context.ClientId == null)
            {
                context.Validated();
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientRedirectUri(OAuthValidateClientRedirectUriContext context)
        {
            if (context.ClientId == _publicClientId)
            {
                Uri expectedRootUri = new Uri(context.Request.Uri, "/");

                if (expectedRootUri.AbsoluteUri == context.RedirectUri)
                {
                    context.Validated();
                }
            }

            return Task.FromResult<object>(null);
        }

        public static AuthenticationProperties CreateProperties(string userName)
        {
            IDictionary<string, string> data = new Dictionary<string, string>
            {
                { "userName", userName }
            };
            return new AuthenticationProperties(data);
        }
    }
```

#### 3. In class ApplicationUser in Models/IdentityModels.cs, add this member function:

```c#
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager, string authenticationType)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, authenticationType);
            // Add custom user claims here
            return userIdentity;
        }
```

**Remarks:**

These code snipets are generated during scaffolding of ASP.NET Web API, or ASP.NET MVC+Web API. However, in certain versions of ASP.NET MVC template, even if you have added option Web API, the scaffolding won't generated the codes needed for Web API. So you just need to ensure these codes exist in your MVC project. Nevertheless, if you have other designs for authentication of SignalR, you may probably ignore these steps above. 

#### 4. Add some CSS scripts to make the trace message look beautiful

```css
/*About Logging*/
li.even {
    background-color : lightgray;
}

span.Critical{color: #800000}
span.Error{color:#FF0000}
span.Warning{color:#FFA500}
span.Info{color:#0000FF}
span.Verbose{color:#808080}
span.Misc{color:#2F4F4F}

span.time{background-color : #66a9a9}
span.origin{background-color:burlywood}
/*Logging*/
```


#### 5. Initialze some user data

1. In table AspNetRoles of LocalDB, add 1 role: API.
2. Run MyMVC, and register a user called api@mytracehub.com, and the password is "Aaaaaa*8", quotes not included.
3. In table AspNetUsers, copy the Id of the newly created user.
4. In table AspNetUserRoles, add the mapping between UserId and the RoleId of role API.


**Remarks:**

In your Web application, you probably already have Web UI to manage users and roles.

## MySPA

This demo project is created through the SPA template with option Web API.

### Initial Twists

1. Optionally have Microsoft ApplicationInsights components all uninstalled. These components might have been introduced during scaffolding of MVC.
2. Update all NuGet packages to the latest.
3. **Install Fonlow.TraceHub NuGet package. And this will introduce references to Fonlow.TraceHub.Core and Microsoft.AspNet.SignalR packages.**
4. **In Startup.cs, add `app.MapSignalR();`**

### Optional twists

Depending on how the scaffolding of your SPA template had gone through or how you had added functionality, you may or may not need these twists in your existing ASP.NET MVC application.

Step 1 in MyMVC could be skipped. 

#### 2. In the project, modify Providers/ApplicationOAuthProvider, and make sure the provider has some more functions needed for authenticating SignalR requests.

```c#
    public class ApplicationOAuthProvider : OAuthAuthorizationServerProvider
    {
        private readonly string _publicClientId;

        public ApplicationOAuthProvider(string publicClientId)
        {
            if (publicClientId == null)
            {
                throw new ArgumentNullException("publicClientId");
            }

            _publicClientId = publicClientId;
        }

        public override async Task GrantResourceOwnerCredentials(OAuthGrantResourceOwnerCredentialsContext context)
        {
            var userManager = context.OwinContext.GetUserManager<ApplicationUserManager>();

            ApplicationUser user = await userManager.FindAsync(context.UserName, context.Password);

            if (user == null)
            {
                context.SetError("invalid_grant", "The user name or password is incorrect.");
                return;
            }

            ClaimsIdentity oAuthIdentity = await user.GenerateUserIdentityAsync(userManager,
               OAuthDefaults.AuthenticationType);
            ClaimsIdentity cookiesIdentity = await user.GenerateUserIdentityAsync(userManager,
                CookieAuthenticationDefaults.AuthenticationType);

            AuthenticationProperties properties = CreateProperties(user.UserName);
            AuthenticationTicket ticket = new AuthenticationTicket(oAuthIdentity, properties);
            context.Validated(ticket);
            context.Request.Context.Authentication.SignIn(cookiesIdentity);
        }

        public override Task TokenEndpoint(OAuthTokenEndpointContext context)
        {
            foreach (KeyValuePair<string, string> property in context.Properties.Dictionary)
            {
                context.AdditionalResponseParameters.Add(property.Key, property.Value);
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientAuthentication(OAuthValidateClientAuthenticationContext context)
        {
            // Resource owner password credentials does not provide a client ID.
            if (context.ClientId == null)
            {
                context.Validated();
            }

            return Task.FromResult<object>(null);
        }

        public override Task ValidateClientRedirectUri(OAuthValidateClientRedirectUriContext context)
        {
            if (context.ClientId == _publicClientId)
            {
                Uri expectedRootUri = new Uri(context.Request.Uri, "/");

                if (expectedRootUri.AbsoluteUri == context.RedirectUri)
                {
                    context.Validated();
                }
            }

            return Task.FromResult<object>(null);
        }

        public static AuthenticationProperties CreateProperties(string userName)
        {
            IDictionary<string, string> data = new Dictionary<string, string>
            {
                { "userName", userName }
            };
            return new AuthenticationProperties(data);
        }
    }
```

#### 3. In class ApplicationUser in Models/IdentityModels.cs, add this member function:

```c#
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager, string authenticationType)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, authenticationType);
            // Add custom user claims here
            return userIdentity;
        }
```


#### 4. Add some CSS scripts to make the trace message look beautiful

```css
/*About Logging*/
li.even {
    background-color : lightgray;
}

span.Critical{color: #800000}
span.Error{color:#FF0000}
span.Warning{color:#FFA500}
span.Info{color:#0000FF}
span.Verbose{color:#808080}
span.Misc{color:#2F4F4F}

span.time{background-color : #66a9a9}
span.origin{background-color:burlywood}
/*Logging*/
```


#### 5. Initialze some user data

The database used in MySPA is a copy of the one in MyMVC.

## MyWebApi

This project is created through the Web API template.

### Initial Twists

1. Optionally have Microsoft ApplicationInsights components all uninstalled. These components might have been introduced during scaffolding of MVC.
2. Update all NuGet packages to the latest.
3. **Install Fonlow.TraceHub NuGet package. And this will introduce references to Fonlow.TraceHub.Core and Microsoft.AspNet.SignalR packages.**
4. **In Startup.cs, add `app.MapSignalR();`**


Then you are done, as long as the user with role "API" is already created.

**Remarks:**

* The scaffolding codes of Web API have almost everything needed for authentication of SignalR. However, in some versions ((latest in VS 2015) of MVC and SPA, the codes generated for the Web API options have a lot missing, thus you might have to add some more codes for non-Web clients.
* By default, a Web API project has no authorized UI, so you won't be authorized to see the logging page without further twisting the auth pages. Nevertheless, it is not likely you will use a Web API service to host the logging page. 

## MySimpleWeb

If your ASP.NET Web application is not based on MVC or Web API, you may use NuGet package Fonlow.TraceHub.Slim. Just import this package and you are done. Your simple Web will become a TraceHub. No twist is needed unless you want to apply some security either in your app level or at the IIS level.








