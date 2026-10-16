
using System.Text;
using apartmanim_api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ApartmanimClient", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// JWT ayarlarını uygulama başlangıcında doğrula.
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
var expiresInMinutesValue =
    builder.Configuration["Jwt:ExpiresInMinutes"];

if (string.IsNullOrWhiteSpace(jwtKey) ||
    Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "JWT anahtarı en az 32 byte olmalıdır.");
}

if (string.IsNullOrWhiteSpace(jwtIssuer) ||
    string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "JWT Issuer ve Audience ayarları zorunludur.");
}

if (!int.TryParse(expiresInMinutesValue, out var expiresInMinutes) ||
    expiresInMinutes <= 0)
{
    throw new InvalidOperationException(
        "Jwt:ExpiresInMinutes pozitif bir sayı olmalıdır.");
}

// PostgreSQL
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Veritabanı bağlantı ayarı bulunamadı.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Controller ve OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT token'ınızı girin."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// JWT kimlik doğrulama
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                ValidateAudience = true,
                ValidAudience = jwtAudience,

                ValidateLifetime = true,
                RequireExpirationTime = true,
                ClockSkew = TimeSpan.FromSeconds(30),

                ValidateIssuerSigningKey = true,
                RequireSignedTokens = true,

                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey))
            };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();
app.UseCors("ApartmanimClient");


app.UseAuthentication();

// İlk giriş şifresi değiştirilene kadar
// geçici token yalnızca şifre değiştirme endpoint'ine erişebilir.
app.Use(async (context, next) =>
{
    var isPasswordChangeOnly = context.User.Identity?.IsAuthenticated == true
        && context.User.HasClaim("PasswordChangeOnly", "true");

    var isChangePasswordEndpoint =
        HttpMethods.IsPost(context.Request.Method)
        && context.Request.Path.Equals(
            "/api/auth/change-password",
            StringComparison.OrdinalIgnoreCase);

    if (isPasswordChangeOnly && !isChangePasswordEndpoint)
    {
        context.Response.StatusCode =
            StatusCodes.Status403Forbidden;

        await context.Response.WriteAsJsonAsync(new
        {
            message = "Devam etmek için önce şifrenizi değiştirmelisiniz."
        });

        return;
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();


app.Run();
