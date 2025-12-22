import type {FunctionComponent} from "preact";
import HeadphonesOffIcon from "~icons/tabler/headphones-off";
import Tooltip from "../common/Tooltip.tsx";

interface Props {
    noHover?: boolean
}

const DeafenedIcon: FunctionComponent<Props> = ({noHover}) => {
    return <>
        <div>
            <Tooltip className={"h-full"} align={"top"} hint={!noHover && <>Deafened</>}>
                <HeadphonesOffIcon aria-label={"Deafened"} stroke-width={2} className={"h-full w-auto"}/>
            </Tooltip>
        </div>
    </>;
};

export default DeafenedIcon;
