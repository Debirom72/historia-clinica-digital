import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          dni: string;
          dni_image_url: string | null;
          birth_date: string;
          address: string;
          email: string;
          phone: string;
          marital_status: string;
          gender: string;
          ethnicity: string;
          health_coverage: string;
          medical_plan: string;
          affiliate_number: string;
          face_registered: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['patients']['Insert']>;
      };
      attention_records: {
        Row: {
          id: string;
          patient_id: string;
          consultation_reason: string;
          patient_evolution: string;
          intervention: string;
          practice: string;
          requested_studies: string;
          doctor_name: string;
          date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attention_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['attention_records']['Insert']>;
      };
      nursing_records: {
        Row: {
          id: string;
          patient_id: string;
          vital_signs: string;
          observations: string;
          nurse_name: string;
          date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nursing_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['nursing_records']['Insert']>;
      };
      medications: {
        Row: {
          id: string;
          patient_id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          duration: string;
          doctor_name: string;
          prescription_url: string | null;
          date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['medications']['Insert']>;
      };
      studies: {
        Row: {
          id: string;
          patient_id: string;
          study_type: string;
          study_name: string;
          result: string;
          file_url: string | null;
          date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['studies']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['studies']['Insert']>;
      };
      sensitive_info: {
        Row: {
          id: string;
          patient_id: string;
          info_type: string;
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sensitive_info']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sensitive_info']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          appointment_type: string;
          doctor_name: string;
          location: string;
          date: string;
          time: string;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
    };
  };
};