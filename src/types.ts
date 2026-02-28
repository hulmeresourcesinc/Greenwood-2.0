export interface User {
  id: string;
  pin: string;
  zipcode?: string;
  state?: string;
  land_zone?: string;
  interests?: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  goals: string;
  lat: number;
  lng: number;
  is_public: boolean;
  isMember?: boolean;
  soil_type?: string;
  resources?: string;
  outcome?: string;
  time_commitment?: string;
  ai_plan?: string;
  sub_goals?: string[];
  grid_map?: string;
}

export interface FeedItem {
  id: number;
  type: 'News' | 'Warning' | 'Update';
  title: string;
  content: string;
  url?: string;
}

export interface JoinRequest {
  id: number;
  user_id: string;
  project_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requester_id: string;
  project_name: string;
}
