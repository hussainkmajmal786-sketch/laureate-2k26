# Ceremony workflow

How Laureate 2K26 is actually used, from the day before to years afterwards.

## Day before — passes

1. **Import the student list.** Console → **QR Passes**. Upload a CSV whose
   first column is the admission/register number, or paste the numbers
   directly. Each is matched against the student records.
2. **Print the passes.** The preview shows one invitation card per graduate:
   department masthead, their name, a personal quote, the QR, and the register
   number in large mono underneath. Use **Print** — the print stylesheet lays
   them two per page at invitation size.
3. **Cross-check and hand out.** Every card shows the register number in plain
   text, so a desk can verify it without scanning.

Each QR encodes a link to `/hub/<token>` — an unguessable token unique to that
graduate. It is their badge for the day *and* their permanent photo archive.

## On the day — stations

| Station | Screen | What it does |
| --- | --- | --- |
| Gate | **Registration** | Scan the pass to check the graduate in |
| Stage | **Stage** | "Call next" opens their stage window, then Complete |
| Booths | **Photo Booth** / **Queue Monitor** | Scan to issue a booth token |
| Dining | **Lunch** | One coupon each; a second scan is refused |
| Hall B | **Certificates** | Log the handover |

**The Stage screen matters more than it looks.** Pressing *Call next* records
when that graduate stepped up. Photo import later matches each photo to a
graduate using those windows — a graduate who is never "called" here cannot
have photos matched to them automatically.

## Live stream

Stream the ceremony on YouTube or Facebook as normal. In **Settings → Live
stream**, paste the ordinary watch URL and switch **Stream is live now** on.
Every graduate hub then embeds the player. No embed code needed — the app
converts the link.

## After the ceremony — photos

1. Copy the photographer's card to the laptop.
2. Console → **Photo Import**. Select the files, choose the category, and
   import.
3. Each photo's EXIF capture time is matched against the stage log, uploaded to
   Drive, and linked to that graduate.

**Two settings that matter:**

- **Tolerance** (default 45s) — how far outside a stage window a photo can
  still match. Raise it if the ceremony ran loosely.
- **Camera clock offset** — if the camera's clock was wrong, correct it here in
  minutes. *Check this before the event*: set the camera clock to match the
  laptop, or note the difference. A wrong clock is the one thing that reliably
  attaches photos to the wrong graduate.

The result screen lists every file, what it matched to, and why anything
failed. Unmatched photos are not uploaded, so you can fix the offset and
re-run.

## Google Drive

Files are filed into:

```
Laureate 2K26/
├── All Media/        every photo from the event
├── Stage/
├── Photo Booth/
├── Candid/
└── Group/
```

Every photo goes into **All Media** *and* its category folder — one archive of
everything, plus a sorted view.

### Connecting Drive

1. [Google Cloud Console](https://console.cloud.google.com) → new project.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **Credentials → Create credentials → Service account**. Create it, open it,
   then **Keys → Add key → JSON**. A file downloads.
4. In Google Drive, create the folder you want everything under, and **share it
   with the service account's email address as Editor**. A service account has
   no storage of its own, so this step is required.
5. Add to `.env.local` (and to Vercel):

   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_DRIVE_ROOT_FOLDER_ID=<the folder id from its URL>
   ```

   Keep the private key on one line with literal `\n` sequences, wrapped in
   double quotes.

Never commit the JSON file. `.gitignore` already excludes `.env*`.

## What a graduate sees, forever

Scanning their QR opens their hub — no login, on any phone:

- the live stream while the ceremony is running
- their ceremony progress
- their booth token when queued
- **their own photos**, and only theirs

The link keeps working indefinitely. Photos are served from Drive; the database
records which files are theirs.

**Be honest about the limit:** the link is unguessable, but anyone a graduate
*shares* their own link with can see their photos. Nobody can browse to another
graduate's hub, and no one can enumerate the cohort — but a shared link is a
shared link.
