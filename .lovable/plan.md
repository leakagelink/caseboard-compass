# Complete the remaining live-game foundation

## What will be completed here
1. Add a secure connection for a future native phone app to retrieve the player's location cases and saved progress, submit evidence and combat actions, and receive validated rewards. Reuse the existing game rules rather than creating a second reward system.
2. Add saved encounter pause/resume support for tracking loss and app backgrounding, with tests ensuring paused time cannot damage the player or bypass cooldowns. Add retry protection so repeated requests cannot grant duplicate rewards.
3. Expand location-specific fictional stories and thief identities beyond the current three repeated plot patterns. Keep assigned stories stable when revisiting an area, and retain the post-win reveal and narration transcript. Clearly distinguish invented stories from real local crimes.
4. Update the native integration guide with the implemented contracts, authentication requirements, error states and an actionable physical-phone acceptance checklist. Verify signed-in progress and mutations end-to-end in the companion.

## Work requiring something outside this project
- **True native AR application:** Unity/AR Foundation development, native sign-in callbacks, anchored 3D ghost models, animations, walking-based search and camera combat require a separate native app. This web project cannot produce or verify an Android APK or iPhone build.
- **Physical-phone testing:** requires that native app installed on supported Android/iPhone devices. Spatial tracking, safe placement, camera quality, battery and audible narration cannot be signed off from browser tests.
- **Owner admin access:** requires identifying the owner's signed-in account; no account will receive admin privileges by guessing.

These items will remain explicitly blocked, not marked complete or replaced with a browser camera overlay.

## Technical approach
- Versioned HTTP handlers under `/api/public/native/v1/`, each verifying its own user bearer token before private reads or writes; private/no-store responses and bounded request validation.
- Extract shared server-only persistence helpers used by both authenticated web functions and native HTTP handlers. Preserve owner-scoped data, revision checks, campaign unlocks and one-time rewards.
- Persist encounter pause state and bounded retry identifiers with the player's save; device GPS and AR claims remain untrusted and do not prove physical presence.
- Preserve existing campaigns and web gameplay. Add targeted engine/API tests and update the roadmap to show verified work separately from external blockers.