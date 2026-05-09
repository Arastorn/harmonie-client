# Voice Channel Feature

This folder contains the voice channel experience for Harmonie. It handles joining a LiveKit room, rendering connected participants, showing active speakers, screen sharing, pinning, fullscreen screen shares, and the persistent voice connection bar.

## Folder Structure

```text
voice/
├── VoiceChannelView.tsx
├── VoiceConnectionBar.tsx
├── voiceUtils.ts
├── components/
├── context/
├── hooks/
└── layout/
```

## Responsibilities

### `VoiceChannelView.tsx`

Route-level view for a voice channel.

It gathers route params, channel metadata, guild metadata, current user data, theme state, and voice presence state. It decides whether to show the join prompt or the active voice stage.

Keep this file focused on orchestration. Avoid putting low-level LiveKit logic or large layout sections here.

### `VoiceConnectionBar.tsx`

Small persistent connection bar shown outside the voice channel view while the user is connected to a voice channel.

It displays connection state, ping, the current guild/channel label, and the leave button.

### `components/`

Small UI pieces used by the voice feature.

- `ScreenShareTile.tsx`: renders a local or remote screen share track, with pin and fullscreen controls.
- `VoiceParticipantTile.tsx`: renders a participant card, including avatar, speaking state, and pin control.
- `VoiceCallControls.tsx`: renders microphone, screen share, and leave controls.
- `VoiceJoinPrompt.tsx`: renders the pre-join state for a voice channel.

These components should stay presentational. They can handle local DOM behavior, such as attaching a video track or toggling fullscreen, but should not own room-level state.

### `layout/`

Layout composition for the active call.

- `VoiceActiveStage.tsx`: arranges participants and screen shares in the active call. It handles the pinned stage, thumbnail strip, screen share grid, and participant rows.
- `voiceLayout.ts`: pure layout helpers and shared view data types, including participant card mapping, row calculation, card sizing, and pin target ids.

### `hooks/`

React hooks that own the voice plumbing.

- `useVoiceRoom.ts`: owns the LiveKit room lifecycle, microphone state, remote audio elements, active speakers, ping measurement, and screen share track state.
- `useVoiceParticipants.ts`: owns participant presence, combining SignalR events, join-response snapshots, profile updates, and LiveKit room state.

### `context/`

Shared voice state for the app.

- `VoicePresenceContext.tsx`: combines participant presence and room state, then exposes a single API for joining, leaving, muting, screen sharing, participant lookup, and active channel metadata.

## Data Flow

1. `VoiceChannelView` is mounted for `/voice/:channelId`.
2. It calls `joinChannel` from `useVoicePresence` when the user is not already active in that channel.
3. `useVoiceRoom` calls the backend join endpoint, connects to LiveKit, enables the microphone, and listens for room events.
4. `useVoiceParticipants` keeps participant metadata in sync from the join response, SignalR events, LiveKit room state, and profile update events.
5. Screen share tracks are collected in `useVoiceRoom` and exposed through `VoicePresenceContext`.
6. `VoiceActiveStage` renders screen shares and participants, defaulting the first screen share to the large pinned stage.

## Screen Sharing

Screen sharing is controlled with LiveKit `setScreenShareEnabled`.

Remote and local screen share video tracks are exposed as `VoiceScreenShare` items. The UI attaches each track inside `ScreenShareTile`.

By default, the first available screen share is shown in the large stage. Users can pin another participant or screen share, or unpin the current item to return to the grid layout.
