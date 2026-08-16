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
- To know **how the printer is connected**. Print its self-test slip (below)
  and read the `Interface` line:
  - `Interface: USB & Serial 9600,n,8,1` — it has no network port. It is
    cabled to a PC's COM port, and that is the PC the agent must run on. Set
    `serialPort` in config.json.
  - An IP address on the slip — it is a network printer. Set `printerIp`.
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
   - **Either** `serialPort` (e.g. `COM1`) and `serialBaud` for a printer
     cabled to this PC, **or** `printerIp` for a printer with its own IP
     address. The self-test slip tells you which — see below. A `serialPort`
     wins if both are filled in.
   - `paperWidth` — characters per line, from the slip's `Char line` value.

   A network printer's IP can also be set in the dashboard under
   **Settings → Kitchen ticket printing**; a value in `config.json` takes
   priority. A serial port can only be set here, since the dashboard has no
   way to describe a cable.
5. Test the connection to the printer without needing a live order:
   ```
   node index.js --test-print
   ```
   If a test ticket comes out, you're set. If not, see Troubleshooting below.
6. Double-click **`install-service.bat`** and approve the administrator
   prompt.

That's it - step 6 is the last thing anyone has to do. See the next section
for what it sets up.

## Making a noise when a ticket prints

Paper appearing makes no sound, and a kitchen is loud. If the printer's
self-test slip says `Beeper: Yes`, add to `config.json`:

```json
"beep": true
```

That sounds three short beeps after each ticket, once it has been cut and is
there to tear off. For more control:

```json
"beep": { "times": 3, "duration": 2, "mode": "escB" }
```

`duration` is in tenths of a second. `mode` is `escB` (the SAM4S / Sewoo /
Bixolon command, and the one to try first) or `bel` for simpler firmware
that only understands a plain ASCII bell.

To hear which your printer supports without printing anything:

```
node index.js --test-beep
```

It sounds each dialect in turn on every configured printer and tells you
what it tried. A printer that understands neither simply stays silent - it
never prints stray characters, so guessing costs nothing.

A `beep` inside a `printers[]` entry overrides the global one, so you can
have the kitchen printer beep and the one at the pass stay quiet.

## More than one printer

Kitchens often run two - one at the stove, one at the pass by the display.
List them instead of the single-printer fields, and every ticket prints on
all of them:

```json
"printers": [
  { "name": "Kitchen", "serialPort": "COM1", "serialBaud": 9600, "paperWidth": 42 },
  { "name": "Pass",    "serialPort": "COM4", "serialBaud": 9600, "paperWidth": 42 }
]
```

Each entry takes the same settings as a single printer, so you can mix a
serial one with a network one. They print in parallel and independently: if
one is out of paper the other still prints, and the log names which
succeeded. The order is marked Preparing as long as at least one copy came
out.

## Reading the printer's self-test slip

Switch the printer off, hold the FEED button, switch it on, release after a
couple of seconds. It prints its own settings. Three lines matter:

- **`Interface`** — `USB & Serial 9600,n,8,1` means serial (use `serialPort`);
  an IP address means network (use `printerIp`).
- **`Char line FontA/B`** — characters per line, e.g. `42/42`. Put that number
  in `paperWidth`. Guessing 48 on a 42-column printer wraps every price onto
  its own line.
- **Baud rate** — the `9600` in the Interface line, for `serialBaud`.

Careful with the sockets on the back: POS printers have an RJ11/RJ12
**cash-drawer** port that looks exactly like an ethernet socket. A printer
whose self-test says `USB & Serial` has no network port no matter what the
back panel suggests.

## Which COM port is it on?

If the slip says serial but you do not know the port, send a test to each one
and let the printer tell you — whichever slip comes out names its own port:

```powershell
foreach ($n in 1..8) {
  $name = "COM$n"
  try {
    $sp = New-Object System.IO.Ports.SerialPort $name,9600,'None',8,'One'
    $sp.Open(); $sp.Write("`n`n*** TEST $name ***`n`n`n"); Start-Sleep -Milliseconds 800; $sp.Close()
    Write-Host "$name : sent"
  } catch { Write-Host "$name : $($_.Exception.Message)" }
}
```

## Finding a network printer's IP address

Only relevant if the self-test slip showed one. Check your router's
connected-devices list, or scan for anything listening on port 9100:

```powershell
$prefix = "192.168.1"   # first three parts of this PC's IPv4 address
1..254 | ForEach-Object {
  $c = New-Object System.Net.Sockets.TcpClient
  if ($c.BeginConnect("$prefix.$_", 9100, $null, $null).AsyncWaitHandle.WaitOne(150) -and $c.Connected) {
    Write-Host "PRINTER FOUND: $prefix.$_"
  }
  $c.Close()
}
```

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
- **Test print times out / connection refused** — network printers only:
  double check `printerIp` and that the computer and printer are on the same
  network. Try pinging the printer's IP from the same computer.
- **"another program is holding the port open"** — the till's POS software
  has the COM port. Close it, test again, and tell the maintainer: the two
  programs need to take turns on that port.
- **"Timed out … writing to COMn"** — the port accepted the connection but
  the printer never took the bytes: switched off, out of paper, or its cable
  is loose. The agent retries and keeps running.
- **Serial ticket prints garbage characters** — the baud rate is wrong. Use
  the number from the self-test slip's `Interface` line in `serialBaud`.
- **Every price wraps onto its own line** — `paperWidth` is too high. Use the
  slip's `Char line FontA/B` value (often 42, not 48).
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
