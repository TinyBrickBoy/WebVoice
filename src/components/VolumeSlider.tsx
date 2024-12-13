interface Props {
    volume: number;
    setVolume: (volume: number) => void;
}

const VolumeSlider = (props: Props) => {
    return <span>Volume: {Math.round(props.volume * 100)}%</span>;
};
export default VolumeSlider;