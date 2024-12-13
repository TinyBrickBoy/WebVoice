interface Props {
    uuid: string;
    size: number;
}

const CraftHead = (props: Props) => {
    return <img
        alt={"Head of " + props.uuid}
        src={`https://crafthead.net/helm/${props.uuid}/8`}
        style={{
            imageRendering: "pixelated",
            width: `${props.size}px`,
            height: `${props.size}px`,
        }}
    />;
};
export default CraftHead;