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

function formatNumber(value: string) {
  const num = Number(value);
  if (Number.isNaN(num)) return value; 
  if (Number.isInteger(num)) {
    return num.toString();
  } else {
    return num.toFixed(2).replace(/\.00$|0+$/, '');
  }
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
        <span>{!!data?.value ? formatNumber(data.value) : 'NA'}</span>
      </div>
    </>
  );
});

export default ResultBlock;
