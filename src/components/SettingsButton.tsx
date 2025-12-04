import type {FunctionComponent} from "preact";
import Button from "./Button.tsx";
import SettingsIcon from "~icons/tabler/settings";

const SettingsButton: FunctionComponent = () => {
    return <>
        <div className={"h-full"}>
            <Button color={"purple"} className={"h-full"}>
                <SettingsIcon className={"h-full w-auto"}/>
            </Button>
        </div>
    </>;
};

export default SettingsButton;
