# Vivora Print Agent

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
6. Double-click **`install-service.bat`** and approve the administrator
   prompt.

That's it - step 6 is the last thing anyone has to do. See the next section
for what it sets up.

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

## Running automatically (the normal way to run it)

`install-service.bat` registers the agent as a Windows service. Once that's
done:

- It starts on its own every time the computer is switched on, **before
  anyone logs in**. Staff never have to open or click anything.
- There is no window to accidentally close.
- If it crashes, or the internet drops, Windows restarts it.
- It waits patiently at boot. The PC finishes starting up before the WiFi
  connects, so the agent retries the connection until it succeeds instead of
  giving up.

To check on it: press `Win + R`, type `services.msc`, and look for **Vivora
Print Agent**. You can stop, start, or restart it from there. Or just read
`print-agent.log` in this folder.

To remove it, double-click `uninstall-service.bat`.

`start.bat` is still there if you want to run the agent by hand in a window
(useful when testing) - but don't run both at once, or every ticket prints
twice.

## Uzbek text on the ticket

Thermal printers do not understand Unicode - they print one byte per
character from a fixed character set. So the agent converts every menu name
and note to plain ASCII before sending it:

- `oʻ` and `gʻ` (and any curly quote a phone keyboard inserts) become `o'`
  and `g'`. Menus typed with a normal apostrophe are already fine and are
  left exactly as they are.
- Cyrillic is transliterated to Latin: `Қовурма Лағмон` prints as
  `Qovurma Lag'mon`, `Шўрва` as `Sho'rva`.

This means a Cyrillic menu prints in Latin letters, not Cyrillic. That is
deliberate: it is readable on every printer, whereas sending Cyrillic bytes
depends on the printer's character-set setting and often comes out as
nonsense. If the kitchen would rather see real Cyrillic, tell the platform
maintainer - it can be done for a specific printer model that supports it.

## Troubleshooting

- **"Config file not found"** — you need to copy `config.example.json` to
  `config.json` (not just rename it, both files should exist).
- **"Authenticated as..." never appears** — check `email`/`password` in
  config.json match a real staff login, and `apiUrl` is correct.
- **Test print times out / connection refused** — double check `printerIp`
  and that the computer and printer are on the same WiFi/network. Try
  pinging the printer's IP from the same computer.
- **Nothing prints after a restart** — check the service is running in
  `services.msc` (see above). If it isn't listed at all, `install-service.bat`
  was never run, or it was run without approving the administrator prompt.
- **"install-service.bat" closes instantly** — it needs `config.json` to
  exist first (step 4 of Setup).
- **Every ticket prints twice** — the service and a manual `start.bat` window
  are both running. Close the window.
- **Tickets print with garbled special characters** — the agent folds text
  down to plain ASCII before printing (see "Uzbek text" below), so this
  should not happen. If it still does, message the platform maintainer with
  the printer's exact model number and a photo of the ticket.
- Everything the agent does is written to `print-agent.log` in this folder —
  attach it when asking for help.
