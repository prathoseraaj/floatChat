export interface ChatRequest {
  query: string;
}

export interface PlotlyData {
  type: string;
  [key: string]: any;
}

export interface PlotlyLayout {
  title?: string;
  [key: string]: any;
}

export interface PlotlyJson {
  data: PlotlyData[];
  layout: PlotlyLayout;
}

export interface ChatResponse {
  insights: string;
  plotly_json: PlotlyJson | null;
  sql_query: string;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  plotlyJson?: PlotlyJson | null;
  sqlQuery?: string;
}