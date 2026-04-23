// Sistema de autenticación local usando localStorage

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface PatientData {
  id: string;
  user_id: string;
  full_name: string;
  dni: string;
  dni_image_url: string | null;
  profile_photo_url: string | null;
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
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  emergency_blood_type?: string;
  emergency_allergies?: string;
  emergency_chronic_conditions?: string;
  emergency_current_medications?: string;
  created_at: string;
  updated_at: string;
}

class LocalAuth {
  private USERS_KEY = 'medical_app_users';
  private CURRENT_USER_KEY = 'medical_app_current_user';
  private PATIENTS_KEY = 'medical_app_patients';

  // Obtener todos los usuarios
  private getUsers(): Record<string, { email: string; password: string; id: string }> {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : {};
  }

  // Guardar usuarios
  private saveUsers(users: Record<string, { email: string; password: string; id: string }>) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // Registro de usuario
  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const users = this.getUsers();
      
      if (users[email]) {
        return { user: null, error: new Error('El usuario ya existe') };
      }

      const userId = `user_${Date.now()}`;
      users[email] = { email, password, id: userId };
      this.saveUsers(users);

      const user: User = {
        id: userId,
        email,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  // Inicio de sesión
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const users = this.getUsers();
      const userRecord = users[email];

      if (!userRecord || userRecord.password !== password) {
        return { user: null, error: new Error('Credenciales inválidas') };
      }

      const user: User = {
        id: userRecord.id,
        email: userRecord.email,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  // Obtener usuario actual
  async getUser(): Promise<{ user: User | null }> {
    const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
    if (!userStr) {
      return { user: null };
    }
    return { user: JSON.parse(userStr) };
  }

  // Cerrar sesión
  async signOut(): Promise<void> {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  // Crear perfil de paciente
  async createPatient(patientData: Omit<PatientData, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: PatientData | null; error: Error | null }> {
    try {
      const patientsStr = localStorage.getItem(this.PATIENTS_KEY);
      const patients: PatientData[] = patientsStr ? JSON.parse(patientsStr) : [];

      const newPatient: PatientData = {
        ...patientData,
        id: `patient_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      patients.push(newPatient);
      localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));

      return { data: newPatient, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  // Obtener paciente por user_id
  async getPatient(userId: string): Promise<{ data: PatientData | null; error: Error | null }> {
    try {
      const patientsStr = localStorage.getItem(this.PATIENTS_KEY);
      const patients: PatientData[] = patientsStr ? JSON.parse(patientsStr) : [];
      const patient = patients.find(p => p.user_id === userId);
      return { data: patient || null, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
}

export const localAuth = new LocalAuth();

// Sistema de base de datos local
class LocalDB {
  private getCollection<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveCollection<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async insert<T extends { id?: string }>(collection: string, item: Omit<T, 'id' | 'created_at'>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const items = this.getCollection<T>(collection);
      const newItem = {
        ...item,
        id: `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      } as T;
      items.push(newItem);
      this.saveCollection(collection, items);
      return { data: newItem, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async select<T>(collection: string, filter?: (item: T) => boolean): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      const items = this.getCollection<T>(collection);
      const filtered = filter ? items.filter(filter) : items;
      return { data: filtered, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const items = this.getCollection<T>(collection);
      const index = items.findIndex((item: any) => item.id === id);
      if (index === -1) {
        return { data: null, error: new Error('Item not found') };
      }
      items[index] = { ...items[index], ...updates };
      this.saveCollection(collection, items);
      return { data: items[index], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async delete<T extends { id: string }>(collection: string, id: string): Promise<{ error: Error | null }> {
    try {
      const items = this.getCollection<T>(collection);
      const filtered = items.filter((item: any) => item.id !== id);
      this.saveCollection(collection, filtered);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }
}

export const localDB = new LocalDB();
