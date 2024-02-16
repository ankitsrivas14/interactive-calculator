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
    const traceChain = (node, chain = []) => {
      // Exclude the result node's value from the chain data
      if (node.type === 'result') return chain;
  
      const value = node.data.value || 'NA';
      chain.push(value);
      
      const incomingEdges = edges.filter(edge => edge.target === node.id);
      const parentNodes = incomingEdges.map(edge => nodes.find(n => n.id === edge.source)).filter(n => n);
  
      if (parentNodes.length !== 1) return chain; // Stop tracing if no parent node
  
      return traceChain(parentNodes[0], chain);
    };
  
    const evaluateExpression = (expression) => {
      if (expression.includes('NA')) return null; // Return null if 'NA' is in the expression
  
      try {
        // Note: Using eval() for demonstration; consider a safer evaluation method for production
        return eval(expression.join(' ')).toString();
      } catch (error) {
        console.error("Error evaluating expression:", error);
        return null;
      }
    };
  
    // Map each result node to its chain, excluding the result node itself from chain data
    const newChains = nodes.filter(node => node.type === 'result').map(resultNode => {
      const connectedNode = edges.find(edge => edge.target === resultNode.id);
      if (!connectedNode) return null; // Skip if the result node is not connected
  
      const parentNode = nodes.find(node => node.id === connectedNode.source);
      if (!parentNode) return null; // Skip if there's no parent node
  
      const chainData = traceChain(parentNode).reverse();
      const evaluatedValue = evaluateExpression(chainData); // Evaluate the chain expression
  
      return { id: resultNode.id, data: chainData, value: evaluatedValue };
    }).filter(chain => chain !== null); // Remove any null entries for unconnected result nodes
  
    setChains(newChains);
  }, [nodes, edges]);
  
  

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((prevNodes) => prevNodes.map((node) => {
      if (node.id === nodeId && node.data.value !== newData.value) {
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

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;
  
      const dragData = event.dataTransfer.getData('application/reactflow');
      if (!dragData) {
        return;
      }
  
      const [nodeType, operatorId] = dragData.includes(':') ? dragData.split(':') : [dragData, undefined];
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
  
      // Adjusting how newNode is created based on nodeType and potentially operatorId
      const newNode = {
        id: getId(),
        type: nodeType,
        position,
        data: { 
          label: nodeType === 'operator' && operatorId ? `${operatorId} node` : `${nodeType} node`,
          value: '', // Assuming you want to start with an empty string or specify a default value
          onChange: (value) => updateNodeData(newNode.id, { value }),
          ...(nodeType === 'operator' && operatorId ? { id: operatorId } : {}), // Add operatorId to data if applicable
        },
      };
  
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, updateNodeData],
  );
  

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
  }, [nodes, edges]); // Removed detectAndStoreChains from dependencies

  useEffect(() => {
    chains.forEach(chain => {
      // Update node data only if it's different to minimize re-renders
      const currentNode = nodes.find(n => n.id === chain.id);
      if (currentNode && currentNode.data.value !== 'Calculating..') {
        updateNodeData(chain.id, { value: 'Calculating..' });
      }
    });
  }, [chains]);

  useEffect(() => {
    chains.forEach(chain => {
      if (chain.value !== null) {
        updateNodeData(chain.id, { value: chain.value.toString() });
      } else {
        updateNodeData(chain.id, { value: 'NA' });
      }
    });
  }, [chains, updateNodeData]);

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
