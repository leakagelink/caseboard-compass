# Phase 1 completion
- [x] Connect Google/Lovable player sign-in and online progress.
- [x] Validate deductions, encounter actions, rewards and case unlocks online.
- [x] Replace device-only case editing with restricted shared admin management.
- [x] Finish loading, retry, camera fallback and sound states.
- [x] Verify Case 001 gameplay, reload persistence, Case 002 unlock, profile, admin editing and publication restrictions; 11 tests pass.
- [ ] Assign the owner's admin account after they sign in and identify the account. No automatic admin grants.

Verification limits: social-provider round trips and physical camera feed need the user's device. Camera-unavailable fallback was verified; true tracked 3D AR is outside Phase 1 web scope.

# Location-based native AR game
- [ ] Prepare the native AR implementation blueprint and integration contract.
- [ ] Build location-specific fictional case assignment and persistent progression in the web/cloud companion.
- [ ] Add the completed-case story reveal and narration to the companion.
- [ ] Integrate a native spatial ghost search and combat client. Blocker: a separately developed native AR application; Lovable cannot build it.
- [ ] Verify real camera tracking, location accuracy, safe play areas and battery use. Blocker: native app and physical supported phones.