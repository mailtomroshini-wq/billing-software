# South Spice Restaurant — Billing Website

A simple restaurant billing website built with **HTML, CSS, and JavaScript**. No server or npm required.

## Features

- **Menu billing** — click items to add to cart instantly
- **Pay Now** — dynamic UPI QR code with exact bill amount
- **Print bill** — browser print for receipts
- **Clear cart** — reset current order
- **Manage menu** — add, edit, delete menu items with images (admin)
- **Monthly sales report** — view totals, order count, top item, export CSV
- **Backup** — export/import all data as JSON

## Menu Items (default — 20 dishes)

**Breakfast:** Idly, Puttu, Poori, Dosai, Vada, Pongal, Upma, Masala Dosa, Parotta, Chappathi  
**Rice:** Lemon Rice, Sambar Rice, Biryani, Meals  
**Snacks:** Pazhampori, Kesari, Samosa  
**Beverages:** Coffee, Tea, Filter Coffee

Use category filters and search on the billing page.

## Run Locally

1. Open the project folder.
2. Double-click `index.html` or serve with any static server:

```bash
# Python
python -m http.server 8080

# Node (if installed)
npx serve .
```

3. Open `http://localhost:8080` in your browser.

> **Note:** For UPI QR generation, use a local server (not `file://`) so the CDN script loads correctly.

## Admin Access

- Go to **Manage Menu** or **Reports**
- Default password: `admin123`
- Change password in Admin → Settings

## Configure UPI

1. Login to Admin
2. Go to **Settings**
3. Set your **UPI ID** (e.g. `yourname@paytm`) and **Payee Name**
4. Save — QR codes on the billing page will use these details

## Deploy to the Internet

### Option A: Netlify Drop (easiest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire project folder onto the page
3. Your site gets a public URL instantly

### Option B: GitHub Pages

1. Create a GitHub repository
2. Push this folder to the repo
3. Go to repo **Settings → Pages**
4. Set source to `main` branch, root folder
5. Your site will be at `https://yourusername.github.io/repo-name/`

## Data Storage

All data (menu, orders, settings) is stored in **localStorage** in the browser.

- Use the **same computer/browser** for billing and reports
- Use **Export Backup** in Admin regularly to avoid data loss
- Import backup to restore on a new browser or device

## File Structure

```
├── index.html          Billing POS
├── admin.html          Menu CRUD + settings
├── reports.html        Monthly sales
├── css/
│   ├── style.css
│   └── print.css
├── js/
│   ├── storage.js
│   ├── cart.js
│   ├── menu.js
│   ├── upi.js
│   ├── billing.js
│   ├── admin.js
│   └── reports.js
└── images/             Menu item images
```

## Default Prices (sample)

| Item | Price | Category |
|------|-------|----------|
| Idly | ₹40 | Breakfast |
| Puttu | ₹50 | Breakfast |
| Poori | ₹45 | Breakfast |
| Dosai | ₹60 | Breakfast |
| Vada | ₹35 | Breakfast |
| Pongal | ₹55 | Breakfast |
| Upma | ₹45 | Breakfast |
| Masala Dosa | ₹75 | Breakfast |
| Parotta | ₹50 | Breakfast |
| Chappathi | ₹40 | Breakfast |
| Lemon Rice | ₹55 | Rice |
| Sambar Rice | ₹65 | Rice |
| Biryani | ₹120 | Rice |
| Meals | ₹90 | Rice |
| Pazhampori | ₹30 | Snacks |
| Kesari | ₹35 | Snacks |
| Samosa | ₹25 | Snacks |
| Coffee | ₹20 | Beverages |
| Tea | ₹15 | Beverages |
| Filter Coffee | ₹25 | Beverages |

Edit prices anytime from the Admin panel.
