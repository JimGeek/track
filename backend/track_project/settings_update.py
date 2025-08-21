# Update specific lines to use config
import re

with open('settings.py', 'r') as f:
    content = f.read()

# Replace hardcoded values with config calls
content = re.sub(
    r'SECRET_KEY = "django-insecure-&@=ak6=\*puv_8\*9\(gpk0jee4b_\(\)$$8o#ipl2\*6w0%3754e=%3"',
    'SECRET_KEY = config("SECRET_KEY", default="django-insecure-&@=ak6=*puv_8*9(gpk0jee4b_()35828o#ipl2*6w0%3754e=%3")',
    content
)

content = re.sub(
    r'DEBUG = True',
    'DEBUG = config("DEBUG", default=True, cast=bool)',
    content
)

content = re.sub(
    r'ALLOWED_HOSTS = \[\]',
    'ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=lambda v: [h.strip() for h in v.split(",")])',
    content
)

# Update CORS_ALLOWED_ORIGINS
cors_update = '''CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", 
    default="http://localhost:3000,http://127.0.0.1:3000", 
    cast=lambda v: [h.strip() for h in v.split(",")]
)'''

content = re.sub(
    r'CORS_ALLOWED_ORIGINS = \[[\s\S]*?\]',
    cors_update,
    content
)

# Update database configuration
db_update = '''DATABASES = {
    "default": {
        "ENGINE": config("DB_ENGINE", default="django.db.backends.sqlite3"),
        "NAME": config("DB_NAME", default=str(BASE_DIR / "db.sqlite3")),
        "USER": config("DB_USER", default=""),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default=""),
        "PORT": config("DB_PORT", default=""),
    }
}

# If DATABASE_URL is provided, parse it
DATABASE_URL = config("DATABASE_URL", default="")
if DATABASE_URL:
    import dj_database_url
    DATABASES["default"] = dj_database_url.parse(DATABASE_URL)'''

content = re.sub(
    r'DATABASES = \{[\s\S]*?\}',
    db_update,
    content
)

with open('settings.py', 'w') as f:
    f.write(content)

print("Settings updated successfully!")
