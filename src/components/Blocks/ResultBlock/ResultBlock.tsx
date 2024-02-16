import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './ResultBlock.css';

interface ResultBlockProps {
  data: {
    value: string; // Assuming value is a string. Adjust type as necessary.
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void; // Optional if not used in ResultBlock
  };
  isConnectable: boolean;
}

const ResultBlock = memo<ResultBlockProps>(({ data, isConnectable }) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      <div className='result-block'>
        <span>{data.value}</span>
      </div>
    </>
  );
});

export default ResultBlock;
