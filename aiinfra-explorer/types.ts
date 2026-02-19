
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url?: string;
  type: 'upload' | 'search' | 'drive';
}

export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  year: number;
  paperId: string;
  category: 'algorithm' | 'optimization' | 'architecture' | 'hardware';
}

export interface EvolutionEdge {
  source: string;
  target: string;
  label: string;
}

export interface EvolutionGraph {
  nodes: ConceptNode[];
  edges: EvolutionEdge[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  groundingUrls?: string[];
}
