import type {UUID} from "../scripts/util/uuid.ts";
import type {FunctionComponent} from "preact";

interface Props {
    uuid: UUID;
    size: number;
}

const CraftHead: FunctionComponent<Props> = ({uuid, size}) => {
    return <img
        alt={"Head of " + uuid.name}
        src={`/head/${uuid.name}/image`}
        className={"block select-none"}
        draggable={false}
        style={{
            imageRendering: "pixelated",
            width: `${size}px`,
            height: "auto",
        }}
    />;
};
export default CraftHead;
