# SpendWise - Deployment Guide

This guide will walk you through deploying SpendWise step by step. No technical knowledge required!

---

## Overview

SpendWise uses three services (all free):

1. **Supabase** - Your database (stores all your expenses, income, etc.)
2. **Vercel** - Hosts your website (makes it accessible on the internet)
3. **GitHub** - Stores your code (connects Supabase and Vercel together)

---

## Step 1: Create a GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click **"Sign up"**
3. Follow the steps to create your account
4. Verify your email address

---

## Step 2: Upload Your Code to GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `expense-tracker`
   - **Description**: `Personal expense tracker`
   - Make sure **"Public"** or **"Private"** is selected (either is fine)
3. Click **"Create repository"**
4. You'll see a page with instructions. On your computer, open a terminal (Command Prompt or PowerShell) and run these commands one by one:

```
cd "C:\Users\Tan Ee Sheng\expense-tracker"
```

Then run:

```
git init
git add .
git commit -m "Initial commit - SpendWise expense tracker"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/expense-tracker.git
git push -u origin main
```

**IMPORTANT**: Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

If git asks for your credentials, follow the prompts to log in.

---

## Step 3: Set Up Supabase (Your Database)

### 3a. Create a Supabase Account

1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign up using your GitHub account (easiest) or email
4. You'll land on your Supabase dashboard

### 3b. Create a New Project

1. Click **"New Project"**
2. Fill in:
   - **Name**: `expense-tracker`
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose the closest region to you (e.g., "Southeast Asia (Singapore)")
3. Click **"Create new project"**
4. Wait for the project to finish setting up (this takes about 1 minute)

### 3c. Set Up the Database Tables

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase-setup.sql` from your project folder on your computer
4. Copy ALL the contents of that file
5. Paste it into the SQL Editor
6. Click the **"Run"** button (or press Ctrl+Enter)
7. You should see a success message. If there are errors, try running it again.

### 3d. Get Your API Keys

1. In Supabase, go to **"Settings"** (gear icon in the left sidebar)
2. Click **"API"** under the "Configuration" section
3. You'll see these important values - copy them and save them:
   - **Project URL**: Looks like `https://abcdefgh.supabase.co`
   - **anon (public) key**: A long string starting with `eyJ...`
   - **service_role key**: Another long string starting with `eyJ...`

   **KEEP THE service_role KEY SECRET!** Never share it publicly.

---

## Step 4: Deploy to Vercel

### 4a. Create a Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended - uses your GitHub account)
4. Authorize Vercel to access your GitHub

### 4b. Import Your Project

1. On the Vercel dashboard, click **"Add New..."** > **"Project"**
2. Find your `expense-tracker` repository in the list and click **"Import"**
3. You'll see the project configuration page

### 4c. Add Environment Variables

Before clicking "Deploy", you MUST add your environment variables:

1. Click on **"Environment Variables"** section
2. Add these variables one by one:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (from Step 3d) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key (from Step 3d) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key (from Step 3d) |
| `NEXT_PUBLIC_CURRENCY` | `MYR` |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | `RM` |
| `CRON_SECRET` | Any random string (e.g., `my-secret-cron-key-12345`) |

For each variable:
- Type the name in the "Key" field
- Paste the value in the "Value" field
- Click "Add"

### 4d. Deploy!

1. Click the **"Deploy"** button
2. Wait for the build to complete (you'll see a progress bar)
3. Once done, you'll see a "Congratulations!" screen
4. Click **"Continue to Dashboard"**
5. Click the **"Visit"** button to see your live website!

Your app is now live at a URL like: `https://expense-tracker-xxxxx.vercel.app`

---

## Step 5: Generate App Icons (Optional but Recommended)

1. Open your deployed website
2. Navigate to: `https://YOUR-VERCEL-URL/generate-icons.html`
3. Click the "Download 192x192" and "Download 512x512" buttons
4. Save these files to your project's `public/icons/` folder as `icon-192.png` and `icon-512.png`
5. Push the changes to GitHub:
   ```
   cd "C:\Users\Tan Ee Sheng\expense-tracker"
   git add .
   git commit -m "Add app icons"
   git push
   ```
6. Vercel will automatically redeploy with the new icons

---

## Step 6: Install on Your Phone (PWA)

### iPhone/iPad:
1. Open your SpendWise URL in **Safari**
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. SpendWise icon will appear on your home screen!

### Android:
1. Open your SpendWise URL in **Chrome**
2. Tap the **three dots menu** (top right)
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **"Add"**
5. SpendWise icon will appear on your home screen!

### Desktop (Chrome/Edge):
1. Open your SpendWise URL
2. Look for the **install icon** in the address bar (looks like a monitor with a down arrow)
3. Click it and click **"Install"**

---

## Step 7: Set Up Monthly Notifications (Automatic)

The monthly report cron job is already configured in `vercel.json`. It will:
- Run automatically on the **1st of every month** at midnight (UTC)
- Generate a report for the previous month
- Create a notification you'll see when you open the app

This works automatically after deployment - no additional setup needed!

**Note**: Vercel's free tier supports cron jobs that run once per day. The monthly report runs once per month on the 1st.

---

## How to Use SpendWise

### Adding Expenses
1. Click **"Add Expense"** on the Dashboard or go to the Expenses page
2. Fill in: item name, amount, category, date, payment method
3. Check "Recurring" if it's a regular expense (like rent, subscriptions)
4. Click **"Add Expense"**

### Adding Income
1. Go to the **Income** page
2. Click **"Add Income"**
3. Fill in: source (e.g., "Salary"), amount, date
4. Check "Recurring" for regular income

### Viewing Reports
- **Dashboard**: Quick overview of current month
- **Analytics**: Detailed charts and visualizations
- **Reports**: Full monthly report with CSV export

### Scanning Receipts
1. Go to **"Scan Receipt"**
2. Take a photo or upload an image
3. The app will try to extract the amount and merchant name
4. Review and edit the extracted details
5. Click **"Save"** to add it as an expense

---

## Troubleshooting

### "supabaseUrl is required" error
- Make sure you've added ALL environment variables in Vercel (Step 4c)
- Check that the variable names are exactly correct (case-sensitive)
- Redeploy after adding variables (Vercel > Deployments > Redeploy)

### Charts not showing
- You need to have some expenses/income data first
- Add a few expenses and refresh the page

### Receipt scanner not working
- Make sure you're using a clear, well-lit photo
- The scanner works best with printed receipts
- You can always enter details manually

### App not installing on phone
- Make sure you're using Safari (iPhone) or Chrome (Android)
- The URL must be HTTPS (Vercel provides this automatically)

---

## Updating the App

If you ever need to make changes:
1. Edit files on your computer
2. Push changes to GitHub:
   ```
   cd "C:\Users\Tan Ee Sheng\expense-tracker"
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. Vercel will automatically redeploy!

---

## Cost

Everything used in this setup is **completely free**:
- **Supabase Free Tier**: 500MB database, 1GB storage
- **Vercel Free Tier**: Unlimited deployments, 100GB bandwidth
- **GitHub Free Tier**: Unlimited repositories

This is more than enough for personal use. You'll never need to pay unless you have thousands of users.
