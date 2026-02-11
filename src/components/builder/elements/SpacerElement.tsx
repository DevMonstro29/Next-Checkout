interface Props {
  props: Record<string, any>;
}

const SpacerElement = ({ props }: Props) => {
  const { height = '20px' } = props;

  return <div style={{ height }} />;
};

export default SpacerElement;
