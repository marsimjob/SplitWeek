using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SplitWeek.Server.Data;
using SplitWeek.Server.Hubs;
using SplitWeek.Server.Models;
using SplitWeek.Server.Services;

namespace SplitWeek.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Database
            builder.Services.AddDbContext<SplitWeekDbContext>(options =>
                options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

            // JWT Authentication
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
                    };

                    // Allow SignalR to receive the JWT via query string
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;
                            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            {
                                context.Token = accessToken;
                            }
                            return Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddAuthorization();

            // Services
            builder.Services.AddScoped<JwtService>();
            builder.Services.AddScoped<NotificationService>();

            builder.Services.AddControllers();
            builder.Services.AddSignalR();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // CORS for development (SignalR requires credentials)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("DevCors", policy =>
                {
                    policy.WithOrigins("http://localhost:49754", "http://localhost:5173")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            var app = builder.Build();

            // Auto-migrate database and seed test data
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<SplitWeekDbContext>();
                db.Database.Migrate();

                // Seed test users if database is empty
                if (!db.Users.Any())
                {
                    var parentA = new User
                    {
                        Email = "mario@splitweek.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
                        FirstName = "Mario",
                        LastName = "Parent",
                        Phone = "555-0101",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    var parentB = new User
                    {
                        Email = "alex@splitweek.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
                        FirstName = "Alex",
                        LastName = "Parent",
                        Phone = "555-0102",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    db.Users.AddRange(parentA, parentB);
                    db.SaveChanges();

                    var child = new Child
                    {
                        FirstName = "Sophie",
                        LastName = "Parent",
                        DateOfBirth = "2019-06-15",
                        Allergies = "Peanuts",
                        MedicalNotes = "Carries EpiPen",
                        EmergencyContact1Name = "Grandma Rose",
                        EmergencyContact1Phone = "555-0201",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    db.Children.Add(child);
                    db.SaveChanges();

                    db.ParentChildren.AddRange(
                        new ParentChild { UserId = parentA.Id, ChildId = child.Id, Role = "ParentA", ColorHex = "#3B82F6" },
                        new ParentChild { UserId = parentB.Id, ChildId = child.Id, Role = "ParentB", ColorHex = "#8B5CF6" }
                    );
                    db.SaveChanges();
                }
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
                app.UseCors("DevCors");
            }

            app.UseHttpsRedirection();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<ChatHub>("/hubs/chat");

            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
