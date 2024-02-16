import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './ResultBlock.css'

interface ResultBlockProps {
    data: {
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={isConnectable}
            />
            <div className='result-block'>
                <span>25</span>
            </div>
        </>
    );
});

export default ResultBlock;