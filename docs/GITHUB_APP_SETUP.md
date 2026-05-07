# GitHub App Setup For Native Team OS

This document covers the team workflow for the native Team OS GitHub App.

## What goes in git

Commit only the public GitHub App identity that every teammate needs:

- app name
- client ID
- app slug

The checked-in public config file is:

- `native-app/TeamOSAppConfig.json`

Update it with:

```sh
python3 scripts/github_app/update_native_public_config.py \
  --client-id <client-id> \
  --app-slug <app-slug>
```

The script updates the checked-in public config and prints the exact next steps for secure secret storage and team rollout. Then commit the resulting change and push it so the team gets the same sign-in target.

## What must stay out of git

Do not commit any of the following:

- GitHub App client secret
- GitHub App private key
- webhook secret
- one-off user tokens

The native Team OS clients do not need the client secret or private key for user sign-in. The desktop and mobile flow uses GitHub App device flow plus refreshable user access tokens stored in platform secure storage.

If an admin workflow or future backend needs the GitHub App client secret or private key, keep those values in your team's secure secret manager and distribute them outside git.

## GitHub App settings checklist

When creating or rotating the GitHub App:

1. Enable device flow.
2. Keep expiring user-to-server tokens enabled.
3. Request the repository permissions that the native app needs:
   - contents: read and write
   - metadata: read
   - pull requests: read and write
4. Install the app on the organization or repositories that Team OS will target.

## Team onboarding

After the public config is committed:

1. Pull the latest repo changes.
2. Build or open the native app.
3. Click `Install App` if the GitHub App is not already installed on the target account or organization.
4. Click `Sign In to GitHub`.
5. Follow the device-flow prompt, enter the code on GitHub, and approve the app.
6. Return to the app and click `Check Access`.

## Admin fast path

Use this when rotating the GitHub App or onboarding a new team:

1. Create or update the GitHub App in GitHub settings.
2. Run `python3 scripts/github_app/update_native_public_config.py --client-id <client-id> --app-slug <app-slug>`.
3. Copy the script's printed checklist:
   - commit the public config change
   - keep client secret, private key, and webhook secret in the team secret manager
   - send the generated rollout note to the team
4. Ask teammates to pull the latest repo and reauthorize from the native app if needed.

## Rotation and recovery

Use this workflow when rotating the public GitHub App identity:

1. Update the GitHub App in GitHub settings.
2. Run the public-config update script with the new client ID or slug.
3. Commit the updated `native-app/TeamOSAppConfig.json`.
4. Ask teammates to pull the new config and use `Reconnect` in the app if their auth state needs to be re-established.

If a teammate's user token expires or refresh fails, the app should move them back to a reauthorize flow without asking them to mint a PAT.
