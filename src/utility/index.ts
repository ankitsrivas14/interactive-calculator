import { Node } from "../types/types";

export function isNode (node: any): node is Node {
    return node !== undefined && (
        node.type === 'primitive' || 
        node.type === 'operator' || 
        node.type === 'result'
    );
}


export function evaluateExpression (expression: string[]): string | null {
    if (expression.length === 0 || isNaN(Number(expression[0]))) {
      return null; // Do not evaluate if the chain does not start with a number
    }
    
    if (expression.includes('NA')) return null;

    let result = parseFloat(expression[0]);
    for (let i = 1; i < expression.length; i += 2) {
      const operator = expression[i];
      const nextValue = parseFloat(expression[i + 1]);

      switch (operator) {
        case '+':
          result += nextValue;
          break;
        case '-':
          result -= nextValue;
          break;
        case '*':
          result *= nextValue;
          break;
        case '/':
          if (nextValue === 0) {
            console.error("Error: Division by zero.");
            return null;
          }
          result /= nextValue;
          break;
        default:
          console.error("Error: Unknown operator.");
          return null;
      }
    }

    return result.toString();
};