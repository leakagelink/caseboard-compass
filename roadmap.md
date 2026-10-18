# Phase 1 completion
- [ ] Add animated ghost splash and Yes/No location invitation; verify optional permission and map entry.
- [x] Upgrade game presentation with cinematic case scenery, animated archive, evidence tiles, bestiary portraits and combat feedback; gameplay rules unchanged.
- [x] Use free local background music synthesis and built-in story narration; no paid API or automatic story generation.
- [x] Connect Google/Lovable player sign-in and online progress.
- [x] Validate deductions, encounter actions, rewards and case unlocks online.
- [x] Replace device-only case editing with restricted shared admin management.
- [x] Finish loading, retry, camera fallback and sound states.
- [x] Verify Case 001 gameplay, reload persistence, Case 002 unlock, profile, admin editing and publication restrictions; 11 tests pass.
- [ ] Assign the owner's admin account after they sign in and identify the account. No automatic admin grants.

Verification limits: social-provider round trips and physical camera feed need the user's device. Camera-unavailable fallback was verified; true tracked 3D AR is outside Phase 1 web scope.

# Location-based native AR game
- [x] Complete the remaining companion work: bearer-verified native HTTP endpoints, revision checks, atomic retry receipts, bounded writes and stage-safe responses; signed-in area/action/session/progress flow verified locally.
- [x] Add saved pause/resume, frozen combat clocks, active-start protection, 15-minute expiry and five-pause budget; engine tests and web/API pause round trip verified.
- [x] Expand new area campaigns to twelve authored plot choices with varied evidence, culprits and collision-free IDs; preserve already assigned stories.
- [x] Update the native AR implementation blueprint with implemented HTTP contracts, retry/errors, pause semantics and physical-device checklist.
- [x] Build approximate-area fictional template case assignment and persistent, independent progression in the web/cloud companion; verified signed-in assignment, investigation, combat win, reload and next-level unlock.
- [x] Add the completed-case story reveal, device-voice controls and saved story replay to the companion. Text fallback verified; audible narration requires a supported phone.
- [ ] Integrate a native spatial ghost search and combat client. Blocker: a separately developed native AR application; Lovable cannot build it.
- [ ] Verify real camera tracking, location accuracy, safe play areas and battery use. Blocker: native app and physical supported phones.

Verification: 25 targeted tests pass and preview build is OK. All four HTTP endpoints reject missing authentication; signed-in assignment, retry replay, request-ID reuse rejection, stale revision rejection, deduction, paused health, web resume/pause readback, validated combat win, one-time XP, story text/reload and next-level unlock were checked. Audible speech was unavailable in headless Chromium; text fallback and controls rendered. Hosted external ingress, concurrent cross-device races and native sign-in round trips remain unverified until deployment/native integration.

Current limits: three levels per area selected from twelve authored plots; plots can repeat across areas, not unlimited original stories or real local history. The same 2D ghost visual remains in browser encounters. Native sign-in callbacks, distinct 3D models, tracking-driven requests and physical hunt verification require the external native application. Deployment-level read/auth abuse monitoring and account deletion also require review before native release.