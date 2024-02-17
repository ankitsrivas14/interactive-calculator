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
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { evaluateExpression, isNode } from '../../utility';
import ArrowMarker from '../shared/ArrowMarker';

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
  const [chains, setChains] = useState<ChainData[]>([]);

  const detectAndStoreChains = useCallback(() => {
    const traceChain = (node: Node, chain: string[] = []): string[] => {
      if (node.type === 'result') return chain;

      const value = node.data.value || 'NA';
      chain.push(value);
      const incomingEdges = edges.filter(edge => edge.target === node.id);
      const parentNodes = incomingEdges.map(edge => nodes.find(n => n.id === edge.source)).filter((n): n is Node => !!n);
      
      if (parentNodes.length !== 1) return chain;
      return traceChain(parentNodes[0], chain);
    };
  
    const newChains = nodes.filter(node => node.type === 'result').map(resultNode => {
      const connectedNode = edges.find(edge => edge.target === resultNode.id);
      if (!connectedNode) return null;
  
      const parentNode = nodes.find(node => node.id === connectedNode.source);
      if (!isNode(parentNode)) return null;
  
      const chainData = traceChain(parentNode).reverse();
      const evaluatedValue = evaluateExpression(chainData);
  
      return { id: resultNode.id, data: chainData, value: evaluatedValue };
    }).filter((chain): chain is ChainData => chain !== null);

    return newChains;
  }, [nodes, edges]);
  

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
  
    const newEdge = {
      ...params,
      style: { stroke: '#ddd', markerEnd: 'url(#arrow)' },
    };

    setEdges((eds) => addEdge(newEdge, eds));
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

      const newId = uuidv4();
  
      const newNode = {
        id: newId,
        type: nodeType,
        position,
        data: { 
          label: nodeType === 'operator' && operatorId ? `${operatorId} node` : `${nodeType} node`,
          value: '',
          onChange: (value: any) => updateNodeData(newNode.id, { value }),
          ...(nodeType === 'operator' && operatorId ? { id: operatorId } : {}), 
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
    const newChains = detectAndStoreChains();
    if (_.isEqual(newChains, chains) === false) {
      setChains(newChains);
    }
  }, [nodes, edges]);


  useEffect(() => {
    chains.forEach(chain => {
      if (chain.value !== null) {
        updateNodeData(chain.id, { value: chain.value.toString() });
      } else {
        updateNodeData(chain.id, { value: 'NA' });
      }
    });
  }, [chains, updateNodeData]);
  
  return (
    <div className="dndflow">
      <ArrowMarker />
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
