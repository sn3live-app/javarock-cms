# JavaRock CMS

Strapi backend for controlling who can activate the JavaRock Android app.

## Local Development

```powershell
cd D:\Mine-bed-java\javarock-cms
npm run develop
```

Open:

```text
http://localhost:1337/admin
```

Create your Strapi admin account. This admin account is only for managing the CMS.

## License Seats

In Strapi Admin, open **Content Manager** and create entries under **License Seat**.

For each allowed user, fill:

```text
username
setPassword
enabled = true
notes, optional
```

Leave these blank when creating a new user:

```text
deviceId
deviceIds
token
lastSeenAt
lastAppVersion
passwordHash
```

The first successful JavaRock app login will bind that username to that Android device. After that, the same username/password cannot be used on another Android device unless you manually clear `deviceId` in Strapi.

To change a user's password later, type the new password into `setPassword` and save. Strapi will clear that field and update `passwordHash`.

Device identifiers are stored as backend-generated HMAC-SHA-256 fingerprints. For best production security, set a long random `DEVICE_ID_HASH_SECRET` value in Render and keep it stable; changing it later will stop existing device bindings from matching.

## Bridge Config

In Strapi Admin, open **Content Manager** and create or edit the **Bridge Config** single type.

Fill:

```text
serverHost
serverPort
serverName
enabled = true
```

The Android app reads this from:

```text
GET /api/bridge-config
```

## Android Endpoint

JavaRock calls:

```text
POST /api/activate
```

Request body:

```json
{
  "username": "user1",
  "password": "password1",
  "deviceId": "primary-client-hashed-device-id",
  "deviceIds": [
    "client-hashed-widevine-id",
    "client-hashed-ssaid",
    "client-hashed-advertising-id"
  ],
  "appVersion": "0.1.9"
}
```

Response:

```json
{
  "ok": true,
  "message": "Device linked successfully.",
  "token": "generated-token"
}
```

## Render + Supabase

Use these Render settings:

```text
Build Command: npm install && npm run build
Start Command: npm run start
```

Set environment variables on Render, not in source control:

```text
NODE_ENV=production
HOST=0.0.0.0
DATABASE_CLIENT=postgres
DATABASE_HOST=your-supabase-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=your-postgres-username
DATABASE_PASSWORD=your-postgres-password
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
APP_KEYS=random1,random2
API_TOKEN_SALT=random
ADMIN_JWT_SECRET=random
TRANSFER_TOKEN_SALT=random
JWT_SECRET=random
ENCRYPTION_KEY=random
DEVICE_ID_HASH_SECRET=random-long-stable-secret
```

Then build JavaRock with:

```powershell
$env:LICENSE_API_BASE_URL = "https://your-render-app.onrender.com/api"
.\javarock\build-release-bundle.ps1
```
