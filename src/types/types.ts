
export interface NodeDataType {
    label: string;
    value: string | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface Node {
    id: string;
    type: 'primitive' | 'operator' | 'result';
    data: NodeDataType;
    dragging: boolean;
    selected: boolean;
    width: number;
    height: number;
    position: {
        x: number;
        y: number;
    };
    positionAbsolute: {
        x: number;
        y: number;
    }

  }
  
export interface Connection {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
}
  
export interface NodesArray extends Array<Node>{}
export interface EdgesArray extends Array<Connection>{}