// types/api.ts

export interface LocationData {
  lat: number;
  lon: number;
  label?: string;
}

export interface PlotlyJson {
  data: any[];
  layout: any;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  plotlyJson?: PlotlyJson;
  sqlQuery?: string;
}

export interface ChatQuery {
  query: string;
}

export interface ChatResponse {
  insights: string;
  plotly_json: PlotlyJson | null;
  sql_query: string;
  locations?: LocationData[] | null;
}