export interface Employee {
  id: string;
  name: string;
  email: string;
  team: string;
  avatar_url: string | null;
  role: "employee" | "admin";
  sparks_earned_total: number;
  sparks_given_this_month: number;
  current_cycle_sparks: number;
  created_at: string;
  updated_at: string;
}

export interface Spark {
  id: string;
  giver_id: string;
  receiver_id: string;
  category: string;
  reason: string;
  month_key: string;
  created_at: string;
  giver?: Employee;
  receiver?: Employee;
}

export interface MilestoneClaim {
  id: string;
  employee_id: string;
  milestone: number;
  claimed_at: string;
}
