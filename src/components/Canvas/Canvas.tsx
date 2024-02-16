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
import { ChainData, Node } from '../../types/types';


let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  primitive: PrimitiveBlock,
  operator: OperatorBlock,
  result: ResultBlock,
};

function isNode (node: any): node is Node {
  return node !== undefined && (node.type === 'primitive' || node.type === 'operator' || node.type === 'result');
}

const Canvas = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [chains, setChains] = useState<ChainData[]>([]);

  const detectAndStoreChains = useCallback(() => {
    const traceChain = (node: Node, chain: string[] = []): string[] => {
      if (node.type === 'result') return chain;
  
      const value = node.data.value || 'NA';
      chain.push(value);
      
      const incomingEdges = edges.filter(edge => edge.target === node.id);
      const parentNodes = incomingEdges.map(edge => nodes.find(n => n.id === edge.source)).filter((n): n is Node => !!n);
      
      if (parentNodes.length !== 1) return chain;
  
      // Safe to call traceChain since we've filtered out undefined with type guard
      return traceChain(parentNodes[0], chain);
    };
  
    const evaluateExpression = (expression: string[]): string | null => {
      
      // Do not evaluate if the chain does not start with a number
      if (expression.length === 0 || isNaN(Number(expression[0]))) {
        return null;
      }
      
      if (expression.includes('NA')) return null;
      try {
        // Safer evaluation method should be used in production
        return eval(expression.join(' ')).toString();
      } catch (error) {
        console.error("Error evaluating expression:", error);
        return null;
      }
    };
  
    // Use a type guard to ensure we only deal with non-null values
    const newChains = nodes.filter(node => node.type === 'result').map(resultNode => {
      const connectedNode = edges.find(edge => edge.target === resultNode.id);
      if (!connectedNode) return null;

      const parentNode = nodes.find(node => node.id === connectedNode.source);
      // Use the type guard here
      if (!isNode(parentNode)) return null;

      const chainData = traceChain(parentNode).reverse(); // Now safe to call
      const evaluatedValue = evaluateExpression(chainData);
      
      return { id: resultNode.id, data: chainData, value: evaluatedValue };
  }).filter((chain): chain is ChainData => chain !== null);

  setChains(newChains);
  }, [nodes, edges, setChains]);
  
  
  

  const onConnect = useCallback((params: Edge | Connection) => {
    const { source, target, sourceHandle, targetHandle } = params;
  
    // Prevent direct circular connection
    if (source === target) return;
  
    const existingOutgoingConnection = edges.some(edge => 
      edge.source === source && edge.sourceHandle === sourceHandle
    );
  
    const existingIncomingConnection = edges.some(edge => 
      edge.target === target && edge.targetHandle === targetHandle
    );
  
    // Check for potential cycles
    const findCycle = (currentNodeId: string, targetId: string, visited = new Set<string>()) => {
      if (currentNodeId === targetId) return true;
      visited.add(currentNodeId);
  
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      for (let edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (findCycle(edge.target, targetId, visited)) return true;
        }
      }
      return false;
    };
  
    if (existingOutgoingConnection || existingIncomingConnection || findCycle(target as string, source as string)) return;
  
    setEdges((eds) => addEdge(params, eds));
  }, [edges, setEdges]);
  
  

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: { value: string }) => {
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
          onChange: (value: any) => updateNodeData(newNode.id, { value }),
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
