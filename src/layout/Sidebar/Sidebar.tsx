
import './Sidebar.css'
import '../../components/Blocks/PrimitiveBlock/PrimitiveBlock.css'
import '../../components/Blocks/OperatorBlock/OperatorBlock.css'
import '../../components/Blocks/ResultBlock/ResultBlock.css'
import { operators } from '../../data/blocks';

const Sidebar = () => {
    const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: 'primitive' | 'operator' | 'result', id?: string) => {
        const dragData = id ? `${nodeType}:${id}` : nodeType;
        event.dataTransfer.setData('application/reactflow', dragData);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">Interactive Calculator</div>
            <div className='block-list'>
                <div className="dndnode primitive-block ex-large" onDragStart={(event) => onDragStart(event, 'primitive')} draggable>
                    Primitive
                </div>
                <div className='operator-section'>
                    {operators.map((operator) => (
                        <div 
                        key={operator.id} 
                        className="dndnode operator-block" 
                        onDragStart={(event) => onDragStart(event, 'operator', operator.id)} 
                        draggable
                        >
                        {operator.symbol}
                        </div>
                    ))}
                </div>
                <div className="dndnode result-block ex-large" onDragStart={(event) => onDragStart(event, 'result')} draggable>
                    <span>Result</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;