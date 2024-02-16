
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
                <div className="dndnode primitive-block ex-large" onDragStart={(event) => onDragStart(event, 'primitive')} draggable>
                    Primitive
                </div>
                <div className='operator-section'>
                    <div 
                        className="dndnode operator-block" 
                        onDragStart={(event) => onDragStart(event, 'operator')} 
                        draggable
                    >
                        +
                    </div>
                    <div 
                        className="dndnode operator-block" 
                        onDragStart={(event) => onDragStart(event, 'operator')} 
                        draggable
                    >
                        -
                    </div>
                    <div 
                        className="dndnode operator-block" 
                        onDragStart={(event) => onDragStart(event, 'operator')} 
                        draggable
                    >
                        x
                    </div>
                    <div 
                        className="dndnode operator-block" 
                        onDragStart={(event) => onDragStart(event, 'operator')} 
                        draggable
                    >
                        /
                    </div>
                </div>
                <div className="dndnode result-block ex-large" onDragStart={(event) => onDragStart(event, 'result')} draggable>
                    <span>Result</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;