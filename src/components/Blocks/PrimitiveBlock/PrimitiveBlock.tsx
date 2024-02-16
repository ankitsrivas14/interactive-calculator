import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './PrimitiveBlock.css'
import { NodeDataType } from '../../../types/types';

interface PrimitiveBlockProps {
    data: NodeDataType;
    isConnectable: boolean;
  }

const PrimitiveBlock = memo<PrimitiveBlockProps>(({ data, isConnectable }) => {

    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={isConnectable}
            />
            <div className='primitive-block'>
                <input className="nodrag" type="number" onChange={data.onChange} />
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="b"
                style={{ bottom: 10, top: 'auto', background: '#555' }}
                isConnectable={isConnectable}
            />
        </>
    );
});

export default PrimitiveBlock;