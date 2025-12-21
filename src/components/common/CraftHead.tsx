import type {UUID} from "../../scripts/util/uuid.ts";
import type {FunctionComponent, JSX} from "preact";

interface Props extends JSX.ImgHTMLAttributes<HTMLImageElement> {
    uuid: UUID;
}

const CraftHead: FunctionComponent<Props> = ({uuid, className, ...other}) => {
    return <img
        draggable={false}
        loading={"eager"}
        alt={"Head of " + uuid.name}
        {...other}
        src={`/head/${uuid.name}/image`}
        className={`block select-none ${className || ""} image-pixelated aspect-square`}
    />;
};
export default CraftHead;
