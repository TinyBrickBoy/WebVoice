import type {FunctionComponent} from "preact";
import {useCallback, useState} from "preact/hooks";
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
        <Modal visible={visible} dismissable title={<>Create Group</>}>
            <form onSubmit={submitGroup} className={"flex flex-col gap-2"}>
                <Input label={<>Name</>}>
                    <TextBox
                        required
                        placeholder={"Group name"}
                        onChange={val => setName(val.trim())}
                    />
                </Input>
                <Input label={<>Password</>}>
                    <TextBox
                        placeholder={"Password (optional)"}
                        onChange={val => setName(val.trim())}
                    />
                </Input>
                <Input label={<>Group type</>}>
                    <Dropdown onUpdate={value => setType(value as GroupAudioType)}>
                        <option value={"normal"}>Normal</option>
                        <option value={"open"}>Open</option>
                        <option value={"isolated"}>Isolated</option>
                    </Dropdown>
                </Input>
                <Button className={"mt-5"} color={"purple"} type={"submit"}>
                    Create
                </Button>
            </form>
        </Modal>
    </>;
};
export default RoomCreateModal;
