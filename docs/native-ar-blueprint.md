# CASE ZERO: native location ghost hunt

## Delivery boundary
This is a specification for a separately developed native phone application, not an APK, Unity project or working native AR implementation. The current web companion supports area assignment and camera overlays, not spatial AR.

## Player journey
1. Sign in and choose to use the current location. Ask for foreground location only, explain fictional content and ask the player to confirm a safe place.
2. Quantize coordinates on the device and send only the area key. Retrieve the saved area campaign and its current unlocked case.
3. Read the briefing, find clues, sort evidence and deduce the betrayal. The server validates case progression.
4. Ask for camera access. Start an AR session, detect an accessible surface and let the player confirm a nearby safe placement. Attach a local anchor; do not derive a precise floor position from GPS.
5. Place clue objects and a distinct animated ghost model in the anchored scene. The player turns and moves carefully to scan it, confront it and dodge its attacks. A fixed image centered on the camera is not this experience.
6. Server-validated combat completion grants rewards once, records the case as solved and unlocks the next case in that area.
7. Show the thief’s identity, theft, escape method, death and betrayal. Narrate on explicit playback and retain a transcript and replay entry.

## Native scene structure
Use a supported Unity LTS/editor and mutually compatible AR Foundation, ARCore XR and ARKit XR packages, verified at native project setup rather than assuming a particular phone is supported.

- Bootstrap: account session, authenticated HTTPS transport, permission coordinator and case cache.
- Investigation: dossier, clue discovery, deduction and saved progression.
- Hunt: ARSession, XR Origin, AR camera background, plane/raycast managers, anchor manager, animated ghost prefab, collision/hit detection, scanner and DOM-equivalent native HUD.
- Resolution: validated result, narration, transcript, next-case action and bestiary.

Native states: permissions → locating → briefing → investigating → deduction → surface scan → placement → searching → confrontation → resolving → story → next level. Support denied, unsupported, offline, limited tracking, lost tracking and expired session branches from the outset.

## Anchoring and safety
- GPS selects an approximate area, not an exact ghost position. The companion currently uses 0.01-degree cells; boundaries and variable longitude width mean these are not fixed-radius geofences.
- Local plane anchors provide nearby placement during a session. Persistence across sessions is a separate requirement; never claim it from a GPS key alone.
- Geospatial anchors require additional platform services, device support, localization quality and regional coverage. Make them optional, not a prerequisite to play anywhere safely.
- Do not spawn targets on roads, tracks, water, private land or inaccessible surfaces. GPS cannot prove a safe surface. Require player confirmation and avoid encouraging running or backward movement.
- Pause native combat on tracking loss and app backgrounding. A corresponding authenticated server pause/resume protocol must be implemented before native release; current browser combat timers do not provide that protocol.
- Never let poor tracking or unavailable depth cause invisible attacks. Depth-based occlusion is optional and provider-specific.
- Never upload camera frames by default or retain movement trails. Keep only necessary area/case progress and provide account-data deletion before release.

## Companion implementation and limits
The web companion saves approximate area campaigns inside the existing private, revision-checked game save. Server-generated case snapshots are retained so revisiting an area does not rewrite an ongoing story. Each area currently has three template-based levels, unique IDs and thief identity suffixes. These are fictional variations, not researched local history or unlimited original AI stories.

Rewards and evidence progression remain server-authoritative. Area assignment is not evidence of physical presence. A fresh area campaign is independent of the bundled demo campaign. The initial archive cap is twenty areas; it must be reviewed with storage and reward-abuse limits before launch.

## Proposed native HTTP contract — NOT implemented
Native clients must not manually call TanStack RPC URLs. Introduce versioned raw HTTP handlers with their own bearer verification and request validation before integrating Unity:

| Proposed endpoint | Contract |
| --- | --- |
| POST /api/public/native/v1/area | Authenticated area key; returns assigned cases, current progress and revision |
| GET /api/public/native/v1/progress | Authenticated own progress only; private/no-store caching |
| POST /api/public/native/v1/action | Case ID, action, expected revision, unique request ID; server validates progression, cooldowns and damage |
| POST /api/public/native/v1/session | Tracking/background pause and resume with bounded abuse protection |

All of these paths are proposals, not existing endpoints. The public prefix only enables external access; handlers must reject unauthenticated requests before any private read. Extract shared server mutation helpers instead of calling RPC stubs inside these handlers.

Use short-lived user bearer tokens in Authorization, OS secure token storage, session refresh, expiry handling and retry-safe action IDs. Never embed service keys in Unity. Native sign-in/deep-link callbacks need a separate verified integration; current web broker redirects cannot simply be copied into a native client.

Client GPS, poses and hit claims can be fabricated. Server cooldowns, revisions, one-time rewards, bounded encounters and rate limits reduce abuse but do not prove physical movement. Device attestation is a separate hardening measure, not an anti-cheat guarantee.

## Native release checklist
- Android and iOS builds produced and installed on supported physical devices.
- Camera/location denial, timeout, approximate location and disabled location services tested.
- Three different area campaigns assigned, saved, revisited and independently progressed.
- Full case solved through investigation, tracked search and combat; reward reads back through a second signed-in client.
- Ghost remains locally anchored while turning and moving; tracking-loss/background pause verified.
- Next level unlock and repeated completion do not duplicate rewards.
- Distinct ghost models/animations, visible attack feedback, sound controls and narration verified.
- Poor lighting, empty surfaces, interrupted network, token expiry and concurrent requests tested.
- Safe placement, accessibility, thermal/battery behavior and privacy/deletion reviewed.

## Official references
- AR Foundation overview: https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@6.0/manual/index.html
- Local anchors: https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@6.0/manual/features/anchors/introduction.html
- Plane detection: https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@6.0/manual/features/plane-detection/arplane.html
- ARCore geospatial anchors: https://developers.google.com/ar/develop/unity-arf/geospatial/anchors
- VPS availability: https://developers.google.com/ar/develop/unity-arf/geospatial/check-vps-availability
- Apple geotracking: https://developer.apple.com/documentation/arkit/tracking-geographic-locations-in-ar
- Unity authenticated request headers: https://docs.unity3d.com/ScriptReference/Networking.UnityWebRequest.SetRequestHeader.html