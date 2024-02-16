import { memo, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import './OperatorBlock.css'
import { NodeDataType } from '../../../types/types';

interface OperatorProps {
    data: NodeDataType;
    isConnectable: boolean;
  }

const OperatorBlock = memo<OperatorProps>(({ data, isConnectable }) => {

    useEffect(() => {
        data.onChange('+');
    }, [])
    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={isConnectable}
            />
            <div className='operator-block'>
               <span>+</span>
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

export default OperatorBlock;