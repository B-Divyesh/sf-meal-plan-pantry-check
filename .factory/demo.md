# Demo sandbox

- URL: <https://meal-plan-pantry-check.sociobot.in/demo>
- Entry point: choose **Try it with sample data** on the first screen.
- Sample: lemon herb pasta, black bean tacos, and roast vegetable bowls with realistic serving counts and ingredient lines.
- Storage: demo state is in memory only. Demo mode does not open the production IndexedDB database or read license localStorage keys.
- Reset: choose **Reset demo** in the persistent demo banner.
- Exit: choose **Start for real**. This reloads `/` and opens the normal IndexedDB-backed ledger without copying demo changes.
- Offline: visit the demo once while online; its sample and app shell then reopen from the service worker while offline.
