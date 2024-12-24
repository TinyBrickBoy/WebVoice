import type {FunctionComponent} from "preact";
import {useState} from "preact/hooks";
import type {CreateGroupPacket, PacketClientGroupType} from "../scripts/packets.ts";

const CreateGroupForm: FunctionComponent<{ createGroup: (packet: CreateGroupPacket) => void }> = (props) => {
    const [name, setName] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [type, setType] = useState<PacketClientGroupType>("normal");

    const submitGroup = (event: SubmitEvent) => {
        event.preventDefault();

        if (!name) {
            return;
        }
        const realPassword = password ? password : undefined;
        props.createGroup({name, password: realPassword, type});

        // reset form
        setName("");
        setPassword("");
        setType("normal");
    };

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
                        onChange={event => setName(event.currentTarget.value)}
                    />
                </div>
                <div className="input-entry">
                    <label>Password</label>
                    <input
                        type="text" placeholder="Password (optional)" value={password}
                        onChange={event => setPassword(event.currentTarget.value)}
                    />
                </div>
                <div className="input-entry">
                    <label>Group type</label>
                    <select
                        value={type}
                        onChange={event => setType(event.currentTarget.value as PacketClientGroupType)}
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