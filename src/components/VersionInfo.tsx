import type {FunctionComponent} from "preact";
import Modal from "./Modal.tsx";
import type {StateType} from "../scripts/types.ts";

const VersionInfo: FunctionComponent = () => {
    const hash = import.meta.env.GIT_COMMIT_HASH;
    return <>
        <span className={"text-sm font-medium text-neutral-300"}>
          <a href={"https://github.com/MinceraftMC/SonusWeb/"}>MinceraftMC/SonusWeb</a>
            {" @ "}
            <a href={`https://github.com/MinceraftMC/SonusWeb/commit/${hash}`}>{hash}</a>
        </span>
    </>;
};

export default VersionInfo;
