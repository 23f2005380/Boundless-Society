import { db } from '@/firebaseConfig';
import { 
    ref, 
    push, 
    update, 
    remove, 
    get, 
    query, 
    orderByChild, 
    limitToLast,
    onValue,
    Unsubscribe
} from 'firebase/database';

// Types for admin operations
export interface CityData {
    id?: string;
    name: string;
    lat: number;
    lng: number;
    type: 'meetup' | 'trip';
    description: string;
    members?: number;
    registrations?: number;
    createdAt?: number;
    updatedAt?: number;
}

export interface FormField {
    id: string;
    name: string;
    type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    validationPattern?: string;
    order: number;
}

export interface FormConfig {
    id?: string;
    name: string;
    description: string;
    formType: 'cityMeetup' | 'trip' | 'general';
    fields: FormField[];
    isActive: boolean;
    gdriveLink?: string;
    createdAt?: number;
    updatedAt?: number;
}

export interface FormSubmission {
    id?: string;
    formId: string;
    formName: string;
    cityId?: string;
    cityName?: string;
    submittedData: Record<string, any>;
    submittedAt?: number;
    ip?: string;
    userAgent?: string;
}

// Admin Service
export class AdminService {
    // ============= CITIES MANAGEMENT =============
    
    static async addCity(cityData: CityData): Promise<string> {
        try {
            const citiesRef = ref(db, 'admin/cities');
            const newCityRef = push(citiesRef, {
                ...cityData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                registrations: 0
            });
            return newCityRef.key || '';
        } catch (error) {
            console.error('Error adding city:', error);
            throw new Error('Failed to add city');
        }
    }

    static async updateCity(cityId: string, cityData: Partial<CityData>): Promise<void> {
        try {
            const cityRef = ref(db, `admin/cities/${cityId}`);
            await update(cityRef, {
                ...cityData,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('Error updating city:', error);
            throw new Error('Failed to update city');
        }
    }

    static async deleteCity(cityId: string): Promise<void> {
        try {
            const cityRef = ref(db, `admin/cities/${cityId}`);
            await remove(cityRef);
        } catch (error) {
            console.error('Error deleting city:', error);
            throw new Error('Failed to delete city');
        }
    }

    static async getCities(): Promise<CityData[]> {
        try {
            const citiesRef = ref(db, 'admin/cities');
            const snapshot = await get(citiesRef);
            if (!snapshot.exists()) return [];
            
            const cities: CityData[] = [];
            snapshot.forEach((childSnapshot) => {
                cities.push({
                    id: childSnapshot.key || '',
                    ...childSnapshot.val()
                });
            });
            return cities;
        } catch (error) {
            console.error('Error fetching cities:', error);
            throw new Error('Failed to fetch cities');
        }
    }

    static subscribeToCitiesChanges(callback: (cities: CityData[]) => void): Unsubscribe {
        const citiesRef = ref(db, 'admin/cities');
        return onValue(citiesRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }
            
            const cities: CityData[] = [];
            snapshot.forEach((childSnapshot) => {
                cities.push({
                    id: childSnapshot.key || '',
                    ...childSnapshot.val()
                });
            });
            callback(cities);
        });
    }

    // ============= FORM CONFIGURATION MANAGEMENT =============

    static async addFormConfig(formConfig: FormConfig): Promise<string> {
        try {
            const formsRef = ref(db, 'admin/formConfigs');
            const newFormRef = push(formsRef, {
                ...formConfig,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            return newFormRef.key || '';
        } catch (error) {
            console.error('Error adding form config:', error);
            throw new Error('Failed to add form configuration');
        }
    }

    static async updateFormConfig(formId: string, formConfig: Partial<FormConfig>): Promise<void> {
        try {
            const formRef = ref(db, `admin/formConfigs/${formId}`);
            await update(formRef, {
                ...formConfig,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('Error updating form config:', error);
            throw new Error('Failed to update form configuration');
        }
    }

    static async deleteFormConfig(formId: string): Promise<void> {
        try {
            const formRef = ref(db, `admin/formConfigs/${formId}`);
            await remove(formRef);
        } catch (error) {
            console.error('Error deleting form config:', error);
            throw new Error('Failed to delete form configuration');
        }
    }

    static async getFormConfigs(): Promise<FormConfig[]> {
        try {
            const formsRef = ref(db, 'admin/formConfigs');
            const snapshot = await get(formsRef);
            if (!snapshot.exists()) return [];
            
            const forms: FormConfig[] = [];
            snapshot.forEach((childSnapshot) => {
                forms.push({
                    id: childSnapshot.key || '',
                    ...childSnapshot.val()
                });
            });
            return forms;
        } catch (error) {
            console.error('Error fetching form configs:', error);
            throw new Error('Failed to fetch form configurations');
        }
    }

    static async getFormConfigById(formId: string): Promise<FormConfig | null> {
        try {
            const formRef = ref(db, `admin/formConfigs/${formId}`);
            const snapshot = await get(formRef);
            if (!snapshot.exists()) return null;
            
            return {
                id: formId,
                ...snapshot.val()
            };
        } catch (error) {
            console.error('Error fetching form config:', error);
            throw new Error('Failed to fetch form configuration');
        }
    }

    // ============= FORM SUBMISSIONS =============

    static async submitFormData(submission: FormSubmission): Promise<string> {
        try {
            const submissionsRef = ref(db, 'admin/submissions');
            const newSubmissionRef = push(submissionsRef, {
                ...submission,
                submittedAt: Date.now()
            });
            
            // Update city registration count if cityId exists
            if (submission.cityId) {
                const cityRef = ref(db, `admin/cities/${submission.cityId}`);
                const snapshot = await get(cityRef);
                if (snapshot.exists()) {
                    const currentRegistrations = snapshot.val().registrations || 0;
                    await update(cityRef, {
                        registrations: currentRegistrations + 1
                    });
                }
            }
            
            return newSubmissionRef.key || '';
        } catch (error) {
            console.error('Error submitting form:', error);
            throw new Error('Failed to submit form');
        }
    }

    static async getFormSubmissions(limit: number = 100): Promise<FormSubmission[]> {
        try {
            const submissionsRef = ref(db, 'admin/submissions');
            const submissionsQuery = query(submissionsRef, limitToLast(limit));
            const snapshot = await get(submissionsQuery);
            
            if (!snapshot.exists()) return [];
            
            const submissions: FormSubmission[] = [];
            snapshot.forEach((childSnapshot) => {
                submissions.push({
                    id: childSnapshot.key || '',
                    ...childSnapshot.val()
                });
            });
            
            // Reverse to show newest first
            return submissions.reverse();
        } catch (error) {
            console.error('Error fetching submissions:', error);
            throw new Error('Failed to fetch submissions');
        }
    }

    static async getSubmissionsByForm(formId: string, limit: number = 100): Promise<FormSubmission[]> {
        try {
            const submissionsRef = ref(db, 'admin/submissions');
            const snapshot = await get(submissionsRef);
            
            if (!snapshot.exists()) return [];
            
            const submissions: FormSubmission[] = [];
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.formId === formId) {
                    submissions.push({
                        id: childSnapshot.key || '',
                        ...data
                    });
                }
            });
            
            // Sort by date descending and limit
            return submissions
                .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching submissions by form:', error);
            throw new Error('Failed to fetch submissions');
        }
    }

    static async getSubmissionsByCity(cityId: string, limit: number = 100): Promise<FormSubmission[]> {
        try {
            const submissionsRef = ref(db, 'admin/submissions');
            const snapshot = await get(submissionsRef);
            
            if (!snapshot.exists()) return [];
            
            const submissions: FormSubmission[] = [];
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.cityId === cityId) {
                    submissions.push({
                        id: childSnapshot.key || '',
                        ...data
                    });
                }
            });
            
            // Sort by date descending and limit
            return submissions
                .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching submissions by city:', error);
            throw new Error('Failed to fetch submissions');
        }
    }

    static subscribeToSubmissions(callback: (submissions: FormSubmission[]) => void): Unsubscribe {
        const submissionsRef = ref(db, 'admin/submissions');
        return onValue(submissionsRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }
            
            const submissions: FormSubmission[] = [];
            snapshot.forEach((childSnapshot) => {
                submissions.push({
                    id: childSnapshot.key || '',
                    ...childSnapshot.val()
                });
            });
            
            // Sort by date descending
            submissions.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
            callback(submissions);
        });
    }

    static async deleteSubmission(submissionId: string): Promise<void> {
        try {
            const submissionRef = ref(db, `admin/submissions/${submissionId}`);
            await remove(submissionRef);
        } catch (error) {
            console.error('Error deleting submission:', error);
            throw new Error('Failed to delete submission');
        }
    }

    static async exportSubmissionsAsCSV(submissions: FormSubmission[]): Promise<string> {
        if (submissions.length === 0) return '';

        // Get all unique field keys from all submissions
        const allKeys = new Set<string>();
        submissions.forEach(submission => {
            Object.keys(submission.submittedData).forEach(key => allKeys.add(key));
        });

        const headers = ['ID', 'Form Name', 'City Name', 'Submitted At', ...Array.from(allKeys)];
        const rows = submissions.map(submission => [
            submission.id,
            submission.formName,
            submission.cityName || 'N/A',
            new Date(submission.submittedAt || 0).toLocaleString(),
            ...Array.from(allKeys).map(key => submission.submittedData[key] || '')
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csv;
    }
}
