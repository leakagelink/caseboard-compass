# Location-based ghost game: step-by-step plan

## Intended experience
The player starts at their current real-world location, gets a fictional unsolved thief case associated with that area, investigates clues, searches for the thief's ghost through the phone camera, and defeats it. Completion reveals who the thief was, what they did, and why they escaped capture, then unlocks the next level.

Different areas must have different fictional thieves and stories. These stories must not be presented as real crimes committed by real local residents.

## Important boundary
Lovable can build the web companion, shared accounts, case assignment, story delivery and progress services. It cannot build or export the native phone AR application. The existing camera overlay is not true spatial AR and will not be described as such.

Native ghost placement, walking around a ghost and tracked combat require a separately developed Unity AR Foundation app using ARCore/ARKit. GPS identifies the area; camera tracking places the ghost locally. GPS alone cannot accurately anchor a ghost in a room.

## 1. First deliverable: native AR blueprint
Prepare a project document covering:
- The complete investigation → physical search → combat → story → next-level flow.
- Camera/location permissions, unavailable-location states, tracking loss and safe-play requirements.
- Native scene structure, stable local ghost placement, clue discovery and combat states.
- How the native client connects to existing accounts and server-validated progress.
- A phone-test checklist and a clear list of work requiring the native app developer.

This step produces a specification, not a working APK or native AR game.

## 2. Location-based case companion
Next, implement explicit location permission and area-based fictional case assignment in this project. Make assigned cases persist across reloads, separate them from the existing three-case demo, and keep progression and rewards validated online. Avoid collecting precise location continuously or retaining movement trails unnecessarily.

Before this implementation, finalize the assignment and security contract in step 1 so location cases do not bypass the existing game rules.

## 3. Completed-case story and narration
Add a complete story reveal after a validated win, covering the thief's identity, theft, escape and death. Include narration with playback controls and a text alternative. Unlock the next assigned case only after the validated completion.

## 4. Native AR implementation — external dependency
A native app developer implements the spatial ghost hunt and real-time combat against the agreed services. No browser overlay will substitute for this requirement.

## 5. Physical-device verification — external dependency
Test supported phones for stable ghost placement, camera/location permissions, walking and search, combat, story playback, save recovery, tracking loss, battery use and unsafe-location handling.

## Technical details
- Preserve GameProvider as the web companion's shared state source.
- Preserve authenticated, revision-checked server mutations and protected user_roles administration.
- Keep the existing bundled demo catalogue intact while adding a distinct location-case model.
- Define an authenticated external-client integration contract before implementing native endpoints; never expose privileged service credentials to a phone app.
- Treat device-reported GPS and AR events as untrusted input, not proof that a reward was earned.

## Completion criteria
Do not call the overall game complete until a real supported phone has verified the native location → investigation → spatial ghost hunt → win → narrated reveal → next-level flow.