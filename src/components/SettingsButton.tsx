import type {FunctionComponent} from "preact";
import Button from "./Button.tsx";

const SettingsButton: FunctionComponent = () => {
    return <>
        <div>
            <Button color={"purple"}>⚙</Button>
        </div>
    </>
}

export default SettingsButton
