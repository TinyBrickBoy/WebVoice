import type {FunctionComponent} from "preact";
import MicrophoneOffIcon from "~icons/tabler/microphone-off";
import Tooltip from "../common/Tooltip.tsx";

interface Props {
    noHover?: boolean
}

const MutedIcon: FunctionComponent<Props> = ({noHover}) => {
    return <>
        <Tooltip className={"h-full"} align={"top"} hint={!noHover && <>Muted</>}>
            <MicrophoneOffIcon aria-label={"Muted"} stroke-width={2} className={"h-full w-auto"}/>
        </Tooltip>
    </>;
};

export default MutedIcon;
