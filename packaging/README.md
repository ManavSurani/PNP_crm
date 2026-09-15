# PNP CRM Windows distribution

The Windows package keeps immutable application files under `C:\Program Files\PNP CRM\`
and stores mutable configuration, SQLite data, uploads, logs, and backups under
`C:\ProgramData\PNP CRM\`.

The installer is built with `installer/PNP CRM.iss`. The release payload is copied
into `packaging/release/` by the release build process. The existing developer setup
and npm commands are intentionally unchanged.

The installer registers a daily Windows Task Scheduler backup with battery support,
`StartWhenAvailable`, and missed-run recovery. It uses the installed Node.js runtime;
if Node.js is not present, installation continues but the task is not registered and
the installer log reports the prerequisite.

`tools/pnp-crm-launch.ps1 -BackgroundOnly` starts the packaged production server
silently. `tools/pnp-crm-launch.ps1 -Stop` stops only the configured CRM port.

The only auth exception added for distribution is the existing NextAuth
authorization callback allowing `/setup`; the dashboard and all other application
pages remain protected. `POST /api/setup` is write-enabled only while no user
exists, or for an authenticated administrator. When `app-config.json` is absent,
the launcher leaves the existing developer `.env` behavior intact.
