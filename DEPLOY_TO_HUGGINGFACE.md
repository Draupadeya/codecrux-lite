# Deploying to Hugging Face Spaces

This guide explains how to deploy the Video Proctoring Project to Hugging Face Spaces for free.

## Prerequisites

1.  A [Hugging Face account](https://huggingface.co/join).
2.  The project code pushed to GitHub (which you have already done).

## Step 1: Create a New Space

1.  Go to [Hugging Face Spaces](https://huggingface.co/spaces).
2.  Click **"Create new Space"**.
3.  **Space Name:** Enter a name (e.g., `video-proctoring`).
4.  **License:** Select `MIT` or `Apache 2.0` (optional).
5.  **Space SDK:** Select **Docker**.
6.  **Space Hardware:** Select **CPU Basic (Free)** (2 vCPU, 16GB RAM).
7.  **Visibility:** Public or Private.
8.  Click **"Create Space"**.

## Step 2: Upload Code to the Space

You have two options:

### Option A: Sync with GitHub (Recommended)
1.  In your new Space, go to **Settings**.
2.  Scroll down to **"Docker"** or **"Repository"** section.
3.  Look for **"Link with GitHub"** or similar options to mirror your repository.
    *   *Note:* Hugging Face might require you to push directly to their git repo if mirroring isn't available on the free tier for Docker spaces immediately.

### Option B: Push Directly to Hugging Face (Easiest)
1.  On your Space page, click the **"Files"** tab.
2.  Click **"Clone repository"** to get the git command, e.g., `git clone https://huggingface.co/spaces/YOUR_USERNAME/video-proctoring`.
3.  Copy all the files from your local `video_proctoring_project` folder (where the `Dockerfile` is) into this new cloned folder.
    *   **Important:** The `Dockerfile` must be at the root of the Hugging Face repo.
    *   So your Hugging Face repo structure should look like:
        ```
        Dockerfile
        requirements.txt
        proctoring/
            manage.py
            ...
        ```
4.  Commit and push:
    ```bash
    git add .
    git commit -m "Initial deploy"
    git push
    ```

## Step 3: Configuration (Environment Variables)

1.  In your Space, go to **Settings**.
2.  Scroll to **"Variables and secrets"**.
3.  Add the following **Variables**:
    *   `DEBUG`: `False`
    *   `ALLOWED_HOSTS`: `*` (or your space URL)
    *   `CSRF_TRUSTED_ORIGINS`: `https://YOUR_SPACE_NAME.hf.space`

## Step 4: Database (Optional but Recommended)

The current setup uses SQLite, which will **reset every time the Space restarts** (every few days or after inactivity). To keep your data:

1.  Create a free PostgreSQL database on [Supabase](https://supabase.com/).
2.  Get the `DATABASE_URL`.
3.  Update `settings.py` to use `dj_database_url` (you'll need to add `dj-database-url` and `psycopg2-binary` to `requirements.txt` and configure it in `settings.py`).
4.  Add `DATABASE_URL` as a **Secret** in Hugging Face Settings.

## Troubleshooting

*   **Build Logs:** Click the "Logs" tab in your Space to see the build process.
*   **Timeout:** If the build takes too long, it might fail. The Dockerfile is optimized to use cache.
*   **Memory:** If the app crashes on load, it might be `deepface` loading models. The 16GB RAM on the free tier should be sufficient.
