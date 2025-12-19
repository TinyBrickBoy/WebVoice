import type {PlayerState, StateType, UserInfo} from "../types.ts";
import type {Dispatch, StateUpdater} from "preact/hooks";
import type {AudioControls} from "../audio/audio_controls.ts";

const SPEAK_DURATION_MILLIS = 100;

const tickSpeaking = (
    controls: AudioControls,
    [user]: StateType<UserInfo>,
    [players]: StateType<Record<string, PlayerState>>,
    setRefresh: Dispatch<StateUpdater<number>>,
) => {
    const minTimestamp = Date.now() - SPEAK_DURATION_MILLIS;

    // update last speaking state for user
    const userState = players[user.uuid.name];
    if (userState) {
        userState.lastSpeaking = controls.lastSound;
    }

    // check if any player (including the user) started/stopped speaking
    let mut = false;
    Object.values(players).forEach(player => {
        const speaking = player.lastSpeaking >= minTimestamp;
        if (speaking !== player.speaking) {
            player.speaking = speaking;
            mut = true;
        }
    });

    // trigger global refresh
    if (mut) {
        setRefresh(i => i + 1);
    }
};

const TASK_INTERVAL_MILLIS = SPEAK_DURATION_MILLIS / 3;

export const startSpeakingTask = (
    controls: AudioControls,
    user: StateType<UserInfo>,
    players: StateType<Record<string, PlayerState>>,
    setRefresh: Dispatch<StateUpdater<number>>,
) => {
    const interval = setInterval(
        () => tickSpeaking(controls, user, players, setRefresh),
        TASK_INTERVAL_MILLIS,
    );
    return () => clearInterval(interval);
};
