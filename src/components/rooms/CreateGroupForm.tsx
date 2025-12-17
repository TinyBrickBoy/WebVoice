import type {FunctionComponent} from "preact";
import {useCallback, useState} from "preact/hooks";
import {RoomCreatePacket} from "../../scripts/network/packets.ts";
import {useVoiceStateContext} from "./../VoiceStateProvider.tsx";

type GroupAudioType = "normal" | "open" | "isolated"

const CreateGroupForm: FunctionComponent = () => {
    const {socket: [socket]} = useVoiceStateContext();

    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string | null>(null);
    const [type, setType] = useState<GroupAudioType>("normal");

    const submitGroup = useCallback((event: SubmitEvent) => {
        event.preventDefault();

        if (!name) {
            return;
        }
        const speakToOthers = type === "open";
        const listenToOthers = type === "normal" || type === "open";
        socket.sendPacket(new RoomCreatePacket(name, password, speakToOthers, listenToOthers));

        // reset form
        setName("");
        setPassword(null);
        setType("normal");
    }, [socket, name, password, type]);

    return (
        <form
            onSubmit={submitGroup}
            style={{
                marginTop: "1em",
                display: "flex",
                flexDirection: "column",
                gap: "0.2em",
                justifyContent: "space-between",
            }}
        >
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.2em",
            }}>
                <div className="input-entry">
                    <label>Name</label>
                    <input
                        required type="text" placeholder="Group name" value={name}
                        onChange={event => setName(event.currentTarget.value.trim())}
                    />
                </div>
                <div className="input-entry">
                    <label>Password</label>
                    <input
                        type="password" placeholder="Password (optional)" value={password || ""}
                        onChange={event => setPassword(event.currentTarget.value.trim() || null)}
                    />
                </div>
                <div className="input-entry">
                    <label>Group type</label>
                    <select
                        value={type}
                        onChange={event => setType(event.currentTarget.value as GroupAudioType)}
                    >
                        <option value={"normal"}>Normal</option>
                        <option value={"open"}>Open</option>
                        <option value={"isolated"}>Isolated</option>
                    </select>
                </div>
            </div>
            <button onSubmit={submitGroup} type={"submit"}>Create</button>
        </form>
    );
};
export default CreateGroupForm;
