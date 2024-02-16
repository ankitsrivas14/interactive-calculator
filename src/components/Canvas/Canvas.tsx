import { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Edge,
  Connection,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from '../../layout/Sidebar/Sidebar';
import PrimitiveBlock from '../Blocks/PrimitiveBlock/PrimitiveBlock';
import OperatorBlock from '../Blocks/OperatorBlock/OperatorBlock';
import ResultBlock from '../Blocks/ResultBlock/ResultBlock';
import './Canvas.css';


let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  primitive: PrimitiveBlock,
  operator: OperatorBlock,
  result: ResultBlock,
};

const Canvas = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [chains, setChains] = useState([]);

  const detectAndStoreChains = useCallback(() => {
    // Function to trace back from a given node to the start of its chain
    const traceChain = (node, chain = []) => {
      // Add the current node's value to the chain
      const value = node.data.value || 'NA';
      chain.push(value);
  
      // Find the node(s) that connects to this node
      const incomingEdges = edges.filter(edge => edge.target === node.id);
      const parentNodes = incomingEdges.map(edge => nodes.find(n => n.id === edge.source)).filter(n => n);
  
      // If there's no parent node (start of a chain), or multiple inputs (error in chain logic), stop tracing
      if (parentNodes.length !== 1) return chain;
  
      // Continue tracing back from the found parent node
      return traceChain(parentNodes[0], chain);
    };
  
    // Find all result nodes as starting points for tracing
    const resultNodes = nodes.filter(node => node.type === 'result');
    const chains = resultNodes.map(resultNode => {
      // Trace back the chain for each result node, then reverse it to get the correct order
      const chain = traceChain(resultNode);
      return chain.reverse();
    });
  
    // Update the state with the detected chains
    setChains(chains);
  }, [nodes, edges]);
  
  

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
          label: `${type} node`,
          value: null,
          onChange: (value) => updateNodeData(newNode.id, { value }),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((prevNodes) => prevNodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...newData,
          },
        };
      }
      return node;
    }));
  }, [setNodes]);

  const isValidConnection = (connection: Connection): boolean => {
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
  
    if (!sourceNode || !targetNode) {
      return false;
    }
  
    if (sourceNode.type === 'primitive' && targetNode.type === 'primitive') {
      return false;
    }
    if (sourceNode.type === 'operator' && targetNode.type === 'operator') {
      return false;
    }
    if (sourceNode.type === 'result' && targetNode.type === 'result') {
      return false;
    }
    if ((sourceNode.type === 'operator' && targetNode.type === 'result') || 
        (sourceNode.type === 'result' && targetNode.type === 'operator')) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    detectAndStoreChains();
  }, [nodes, edges, detectAndStoreChains]);

  console.log(chains);
  
  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <Sidebar />
        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            isValidConnection={isValidConnection}
          >
            <Background variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default Canvas;
