# placementProof

A lightweight HTML/CSS/JavaScript prototype for checking job and internship notices before students pay or apply.

## Run the project

1. Install Node.js.
2. Open a terminal in this folder.
3. Run:

```bash
node server.js
```

4. Open `http://localhost:3000` in a browser.

Do not open `index.html` from a file manager if you want to load the JSON file. The app still includes a built-in demo fallback, but the local server is the recommended way to run it.

## What to check

- **Approved opportunities:** shows the verified notice and official source.
- **Notice checker:** use “Load changed-fee example” to see `Details differ` for ₹1,499 versus the approved ₹0.
- **Placement cell dashboard:** scroll to “Placement cell”. Every record shows its status, reviewer, official source, approved contact, deadline and fee policy.
- **Pending:** the placement cell has not completed verification.
- **Approved:** the placement cell has verified and published the record.
- **Withdrawn:** the cell has removed the opportunity; students should not use old copies.

## Files

- `index.html` — page structure
- `styles.css` — responsive styling
- `app.js` — notice loading, dashboard rendering and checker logic
- `data/notices.json` — demo records
- `server.js` — small local static server
- `public/manus-routes.json` — route manifest
