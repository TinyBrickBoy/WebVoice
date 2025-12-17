import type {FunctionComponent} from "preact";
import {useCallback, useEffect, useState} from "preact/hooks";
import {RoomCreatePacket} from "../../scripts/network/packets.ts";
import {useVoiceStateContext} from "./../VoiceStateProvider.tsx";
import type {GroupAudioType} from "./RoomInfo.tsx";
import type {StateType} from "../../scripts/types.ts";
import Modal from "../common/Modal.tsx";
import Dropdown from "../common/Dropdown.tsx";
import Button from "../common/Button.tsx";
import TextBox from "../common/TextBox.tsx";
import Input from "../common/Input.tsx";

interface Props {
    visible: StateType<boolean>;
}

const RoomCreateModal: FunctionComponent<Props> = ({visible: [visible, setVisible]}) => {
    const {socket: [socket]} = useVoiceStateContext();

    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string | null>(null);
    const [type, setType] = useState<GroupAudioType>("normal");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const submitGroup = useCallback((event: SubmitEvent) => {
        event.preventDefault();

        if (!name) {
            return;
        }
        const speakToOthers = type === "open";
        const listenToOthers = type === "normal" || type === "open";
        socket.sendPacket(new RoomCreatePacket(name, password, speakToOthers, listenToOthers));
        setSubmitting(true); // wait for response
    }, [socket, name, password, type]);

    // wait for response from service before hiding modal
    useEffect(() => {
        setSubmitting(false);
        return socket.register("room_join_response", () => setVisible(false));
    }, [socket]);
    // reset state when toggling visibility
    useEffect(() => {
        setSubmitting(false);
        setName("");
        setPassword(null);
        setType("normal");
    }, [visible]);

    return <>
        <Modal visible={[visible, setVisible]} dismissable title={<>Create Group</>}>
            <form onSubmit={submitGroup} className={"flex flex-col gap-2"}>
                <Input label={<>Name</>}>
                    <TextBox
                        required max={32} disabled={submitting}
                        value={name} placeholder={"Group name"}
                        onChange={val => setName(val.trim())}
                    />
                </Input>
                <Input label={<>Password</>}>
                    <TextBox
                        max={32} disabled={submitting}
                        value={password || ""} placeholder={"Password (optional)"}
                        onChange={val => setPassword(val.trim())}
                    />
                </Input>
                <Input label={<>Group type</>}>
                    <Dropdown
                        disabled={submitting}
                        value={type}
                        onUpdate={value => setType(value as GroupAudioType)}
                    >
                        <option value={"normal"}>Normal</option>
                        <option value={"open"}>Open</option>
                        <option value={"isolated"}>Isolated</option>
                    </Dropdown>
                </Input>
                <Button
                    className={"mt-5"} color={"purple"}
                    type={"submit"} disabled={submitting}
                >
                    Create
                </Button>
            </form>
        </Modal>
    </>;
};
export default RoomCreateModal;
