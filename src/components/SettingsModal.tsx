import type {FunctionComponent} from "preact";
import Modal from "./Modal.tsx";
import type {StateType} from "../scripts/types.ts";

interface Props {
    visible: StateType<boolean>;
}

const SettingsModal: FunctionComponent<Props> = ({visible}) => {
    return <>
        <Modal visible={visible} dismissable>
            <h2>Settings</h2>
        </Modal>
    </>;
};

export default SettingsModal;
