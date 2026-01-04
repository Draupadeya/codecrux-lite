# Railway Deployment Guide for Django Backend

## 1. Prerequisites
- Railway account: https://railway.app/
- Your Django project (video_proctoring_project folder)

## 2. Project Structure
Make sure your Django backend is in the `video_proctoring_project/` folder.

## 3. Required Files
- `requirements.txt` (already present)
- `Procfile` (to tell Railway how to run Django)
- `runtime.txt` (optional, to specify Python version)
- `.env` (for secrets, set in Railway dashboard)

## 4. Procfile Example
```
web: python manage.py runserver 0.0.0.0:$PORT
```

## 5. runtime.txt Example
```
python-3.10.12
```

## 6. Steps to Deploy
1. Go to https://railway.app/ and create a new project.
2. Link your GitHub repo or upload your code.
3. Add the above files if missing.
4. Set environment variables in Railway dashboard (see below).
5. Deploy!

## 7. Environment Variables
- `DJANGO_SECRET_KEY`: Your Django secret key
- `DJANGO_DEBUG`: False
- `ALLOWED_HOSTS`: `*` or your Railway domain
- Any DB credentials if using Postgres/MySQL

## 8. After Deploy
- Railway will give you a public backend URL (e.g., `https://your-app.up.railway.app`)
- Update your frontend to use this new backend URL

## 9. Troubleshooting
- Check Railway build logs for errors
- Make sure all required environment variables are set
- If using a database, set up Railway's Postgres/MySQL plugin and update Django settings

---
For custom domains, SSL, or advanced settings, see Railway docs: https://docs.railway.app/
