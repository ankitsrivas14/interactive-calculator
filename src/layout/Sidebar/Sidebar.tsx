
import './Sidebar.css'
import '../../components/Blocks/PrimitiveBlock/PrimitiveBlock.css'
import '../../components/Blocks/OperatorBlock/OperatorBlock.css'
import '../../components/Blocks/ResultBlock/ResultBlock.css'

const Sidebar = () => {
    const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: 'primitive' | 'operator' | 'result') => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">Interactive Calculator</div>
            <div className='block-list'>
                <div className="dndnode primitive-block" onDragStart={(event) => onDragStart(event, 'primitive')} draggable>
                    Primitive Block
                </div>
                <div className="dndnode operator-block" onDragStart={(event) => onDragStart(event, 'operator')} draggable>
                    Op
                </div>
                <div className="dndnode result-block" onDragStart={(event) => onDragStart(event, 'result')} draggable>
                    <span>Result Block</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;