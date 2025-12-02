import type {UUID} from "../scripts/util/uuid.ts";

interface Props {
    uuid: UUID;
    size: number;
}

const CraftHead = ({uuid, size}: Props) => {
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
