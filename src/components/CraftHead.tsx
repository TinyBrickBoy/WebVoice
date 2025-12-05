import type {UUID} from "../scripts/util/uuid.ts";
import type {FunctionComponent, JSX} from "preact";

interface Props extends JSX.HTMLAttributes {
    uuid: UUID;
    size: number;
}

const CraftHead: FunctionComponent<Props> = ({uuid, size, style, className, ...other}) => {
    const styleObj = typeof style !== "string" ? style : null;
    return <img
        {...other}
        alt={"Head of " + uuid.name}
        src={`/head/${uuid.name}/image`}
        className={`block select-none ${className || ""}`}
        draggable={false}
        style={{
            ...(styleObj || {}),
            imageRendering: "pixelated",
            width: `${size}px`,
            height: "auto",
        }}
    />;
};
export default CraftHead;
