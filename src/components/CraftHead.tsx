import type {UUID} from "../scripts/uuid.ts";

interface Props {
    uuid: UUID;
    size: number;
}

const CraftHead = (props: Props) => {
    return <img
        alt={"Head of " + props.uuid.name}
        src={`https://crafthead.net/helm/${props.uuid.name}/8`}
        style={{
            imageRendering: "pixelated",
            width: `${props.size}px`,
            height: `${props.size}px`,
        }}
    />;
};
export default CraftHead;