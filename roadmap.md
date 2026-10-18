# Phase 1 completion
- [x] Connect Google/Lovable player sign-in and online progress.
- [x] Validate deductions, encounter actions, rewards and case unlocks online.
- [x] Replace device-only case editing with restricted shared admin management.
- [x] Finish loading, retry, camera fallback and sound states.
- [x] Verify Case 001 gameplay, reload persistence, Case 002 unlock, profile, admin editing and publication restrictions; 11 tests pass.
- [ ] Assign the owner's admin account after they sign in and identify the account. No automatic admin grants.

Verification limits: social-provider round trips and physical camera feed need the user's device. Camera-unavailable fallback was verified; true tracked 3D AR is outside Phase 1 web scope.

# Location-based native AR game
- [x] Prepare the native AR implementation blueprint and proposed integration contract; native HTTP endpoints are not implemented.
- [x] Build approximate-area fictional template case assignment and persistent, independent progression in the web/cloud companion; verified signed-in assignment, investigation, combat win, reload and next-level unlock.
- [x] Add the completed-case story reveal, device-voice controls and saved story replay to the companion. Text fallback verified; audible narration requires a supported phone.
- [ ] Integrate a native spatial ghost search and combat client. Blocker: a separately developed native AR application; Lovable cannot build it.
- [ ] Verify real camera tracking, location accuracy, safe play areas and battery use. Blocker: native app and physical supported phones.

Current limits: three plot templates per area, not unlimited original stories or real local history; the same 2D ghost visual remains in browser encounters. Native sign-in, HTTP integration, pause/resume, distinct 3D models and physical hunt verification depend on the external native application.