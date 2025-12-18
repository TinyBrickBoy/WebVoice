import type {FunctionComponent} from "preact";
import {useVoiceStateContext} from "../VoiceStateProvider.tsx";
import {useMemo} from "preact/hooks";
import MinecraftComponent from "../common/MinecraftComponent.tsx";

const CurrentRoom: FunctionComponent = () => {
    const {user: [user], rooms: [rooms], players: [players]} = useVoiceStateContext();

    // find out which room the user is in
    const room = useMemo(() => {
        const roomId = players[user.uuid.name]?.primaryRoomId;
        return roomId ? rooms[roomId.name] : null;
    }, [user, rooms, players]);

    return <>
        <div className={"flex flex-col mb-6 items-end w-full"}>
            <span className={"text-sm"}>Current group</span>
            {room ?
                <MinecraftComponent className={"text-xl"} component={room.name}/> :
                <span className={"text-xl text-neutral-400"}>Not in a group</span>
            }
        </div>
    </>;
};

export default CurrentRoom;
