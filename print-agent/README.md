# RestoPlatform Print Agent

Prints a kitchen ticket automatically the moment a customer places an order by
scanning the table's QR code. Runs on a Windows (or Mac/Linux) computer at the
restaurant, on the same network as the kitchen printer.

## Why this exists

The kitchen printer sits on the restaurant's local WiFi/LAN — the cloud
backend has no way to reach it directly. This program is the bridge: it stays
open on a computer at the restaurant, listens for new orders in real time
(the same live feed the Kitchen Display page uses), and sends the ticket
straight to the printer.

## What you need

- A Windows computer at the restaurant that can stay on (the cashier's PC is
  usually fine), with an internet connection.
- The kitchen printer's IP address, if it's a network printer (the SAM4S and
  Sewoo printers in most kitchens support this — see "Finding the printer's
  IP" below).
- A dedicated login for the printer — **do not** use the owner's own
  email/password. Create one from the dashboard: **Staff → Add staff**, e.g.
  `printer@yourrestaurant.com` with any password. This account only needs to
  receive order notifications, nothing else.

## Setup (one-time)

1. Install [Node.js](https://nodejs.org) (the LTS version) on the restaurant
   computer, if it isn't already installed.
2. Copy this whole `print-agent` folder onto that computer.
3. Open a terminal/Command Prompt in the folder and run:
   ```
   npm install
   ```
4. Copy `config.example.json` to `config.json` and fill in:
   - `apiUrl` / `wsUrl` — your backend's address (ask whoever set up the
     platform if you're not sure).
   - `email` / `password` — the dedicated printer login from Staff → Add staff.
   - `printerIp` — the printer's IP address (see below). You can leave this
     blank and set it instead in the dashboard under
     **Settings → Kitchen ticket printing** — either place works, a value in
     `config.json` just takes priority.
5. Test the connection to the printer without needing a live order:
   ```
   node index.js --test-print
   ```
   If a test ticket comes out, you're set. If not, see Troubleshooting below.
6. Start it for real:
   ```
   node index.js
   ```
   or double-click `start.bat` on Windows.

Leave this window running — closing it stops printing. See "Run it
automatically" below to have it start with the computer.

## Finding the printer's IP address

Most SAM4S/Sewoo kitchen printers have a small LCD or a self-test button:

- Hold the printer's feed button while powering it on (or check the printer's
  manual for "self-test print" / "network status print") — it prints a
  ticket showing its IP address.
- Or check your router's connected-devices list for a device named after the
  printer brand.

If the printer only has a USB cable (no network/ethernet port), this version
of the agent can't reach it directly — let the platform maintainer know and
we'll set up USB support for that printer instead.

## Run it automatically (so it survives a restart)

Windows: press `Win + R`, type `shell:startup`, press Enter — this opens your
Startup folder. Copy a shortcut to `start.bat` into that folder. Next time
the computer restarts, the agent starts on its own.

## Troubleshooting

- **"Config file not found"** — you need to copy `config.example.json` to
  `config.json` (not just rename it, both files should exist).
- **"Authenticated as..." never appears** — check `email`/`password` in
  config.json match a real staff login, and `apiUrl` is correct.
- **Test print times out / connection refused** — double check `printerIp`
  and that the computer and printer are on the same WiFi/network. Try
  pinging the printer's IP from the same computer.
- **Tickets print with garbled special characters** — some printers use a
  different default character set; message the platform maintainer with your
  printer's exact model number.
- Everything the agent does is written to `print-agent.log` in this folder —
  attach it when asking for help.
