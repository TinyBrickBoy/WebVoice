import type {UUID} from "../scripts/util/uuid.ts";
import type {FunctionComponent} from "preact";

interface Props {
    uuid: UUID;
    size: number;
}

const CraftHead: FunctionComponent<Props> = ({uuid, size}) => {
    return <img
        alt={"Head of " + uuid.name}
        src={`https://crafthead.net/helm/${uuid.name}/8`}
        style={{
            imageRendering: "pixelated",
            width: `${size}px`,
            height: `${size}px`,
        }}
    />;
};
export default CraftHead;
