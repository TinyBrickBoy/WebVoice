import type {FunctionComponent} from "preact";
import {useCallback, useState} from "preact/hooks";
import {RoomCreatePacket} from "../../scripts/network/packets.ts";
import {useVoiceStateContext} from "./../VoiceStateProvider.tsx";
import type {GroupAudioType} from "./RoomInfo.tsx";
import type {StateType} from "../../scripts/types.ts";
import Modal from "../common/Modal.tsx";
import Dropdown from "../common/Dropdown.tsx";

interface Props {
    visible: StateType<boolean>;
}

const RoomCreateModal: FunctionComponent<Props> = ({visible}) => {
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

    return <>
        <Modal visible={visible} dismissable>
            <form onSubmit={submitGroup} className={"flex flex-col"}>
                <div className={"flex flex-col"}>
                    <label>
                        <span>Name</span>
                        <input
                            required type="text" placeholder="Group name" value={name}
                            onChange={event => setName(event.currentTarget.value.trim())}
                        />
                    </label>
                    <label>
                        <span>Password</span>
                        <input
                            type="password" placeholder="Password (optional)" value={password || ""}
                            onChange={event => setPassword(event.currentTarget.value.trim() || null)}
                        />
                    </label>
                    <label>
                        <span>Group type</span>
                        <Dropdown onUpdate={value => setType(value as GroupAudioType)}>
                            <option value={"normal"}>Normal</option>
                            <option value={"open"}>Open</option>
                            <option value={"isolated"}>Isolated</option>
                        </Dropdown>
                    </label>
                </div>
                <button onSubmit={submitGroup} type={"submit"}>Create</button>
            </form>
        </Modal>
    </>;
};
export default RoomCreateModal;
