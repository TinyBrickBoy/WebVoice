import type {FunctionComponent} from "preact";
import LockIcon from "~icons/tabler/lock-filled";
import Tooltip from "../common/Tooltip.tsx";

const LockedIcon: FunctionComponent = () => {
    return <>
        <Tooltip align={"top"} hint={"Locked"}>
            <LockIcon/>
        </Tooltip>
    </>;
};

export default LockedIcon;
