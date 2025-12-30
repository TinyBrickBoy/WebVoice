import type {UUID} from "../../scripts/util/uuid.ts";
import type {FunctionComponent, JSX} from "preact";
import {fixSha256} from "../../scripts/util/util.ts";

interface Props extends JSX.ImgHTMLAttributes<HTMLImageElement> {
    textureHash?: string | null;
    uuid: UUID;
}

const CraftHead: FunctionComponent<Props> = ({textureHash, uuid, className, ...other}) => {
    return <img
        draggable={false}
        loading={"eager"}
        alt={`Head of ${uuid}`}
        {...other}
        src={`/head/${fixSha256(textureHash) ?? uuid}/image`}
        className={`block select-none ${className || ""} image-pixelated aspect-square`}
    />;
};
export default CraftHead;
