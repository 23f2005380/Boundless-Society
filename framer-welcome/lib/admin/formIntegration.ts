import { AdminService, FormSubmission } from './adminService';

/**
 * Hook to fetch and use form configuration on client side
 * This helps with rendering dynamic forms based on admin configuration
 */

export const FormIntegration = {
    /**
     * Get active form configuration for rendering
     */
    async getActiveForm(formType: 'cityMeetup' | 'trip' | 'general') {
        try {
            const forms = await AdminService.getFormConfigs();
            const form = forms.find(f => f.formType === formType && f.isActive);
            return form || null;
        } catch (error) {
            console.error('Error fetching form:', error);
            return null;
        }
    },

    /**
     * Submit form data with city context
     */
    async submitRegistration(
        formId: string,
        formName: string,
        formData: Record<string, any>,
        cityId?: string,
        cityName?: string
    ) {
        try {
            const submission: FormSubmission = {
                formId,
                formName,
                submittedData: formData,
                cityId,
                cityName,
                ip: await getClientIp(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
            };

            const submissionId = await AdminService.submitFormData(submission);
            return { success: true, submissionId };
        } catch (error) {
            console.error('Error submitting form:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },

    /**
     * Validate form field based on configuration
     */
    validateField(value: any, fieldType: string, required: boolean): boolean {
        if (required && (!value || value.toString().trim() === '')) {
            return false;
        }

        if (!value) return true;

        switch (fieldType) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'phone':
                return /^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10;
            case 'number':
                return !isNaN(parseFloat(value));
            case 'text':
            case 'textarea':
            case 'select':
            case 'checkbox':
            case 'radio':
            default:
                return true;
        }
    },

    /**
     * Get field-specific error message
     */
    getFieldErrorMessage(fieldLabel: string, fieldType: string, value: any): string {
        if (!value && value !== 0) {
            return `${fieldLabel} is required`;
        }

        switch (fieldType) {
            case 'email':
                return `Please enter a valid email address`;
            case 'phone':
                return `Please enter a valid phone number`;
            case 'number':
                return `Please enter a valid number`;
            default:
                return `Invalid ${fieldLabel}`;
        }
    },

    /**
     * Transform form data for storage
     */
    transformFormData(rawData: Record<string, any>, fields: any[]): Record<string, any> {
        const transformed: Record<string, any> = {};

        fields.forEach(field => {
            if (rawData.hasOwnProperty(field.name)) {
                transformed[field.name] = rawData[field.name];
            }
        });

        return transformed;
    }
};

/**
 * Get client IP address for analytics (optional)
 */
async function getClientIp(): Promise<string> {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'unknown';
    }
}

/**
 * Example usage in a form component:
 *
 * import { FormIntegration } from '@/lib/admin/formIntegration';
 * 
 * export default function RegistrationForm() {
 *   const [form, setForm] = useState(null);
 *   const [submitting, setSubmitting] = useState(false);
 *   const [errors, setErrors] = useState({});
 *   const [formData, setFormData] = useState({});
 *
 *   useEffect(() => {
 *     FormIntegration.getActiveForm('cityMeetup').then(setForm);
 *   }, []);
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *
 *     // Validate all fields
 *     const newErrors = {};
 *     form.fields.forEach(field => {
 *       if (!FormIntegration.validateField(formData[field.name], field.type, field.required)) {
 *         newErrors[field.name] = FormIntegration.getFieldErrorMessage(
 *           field.label,
 *           field.type,
 *           formData[field.name]
 *         );
 *       }
 *     });
 *
 *     if (Object.keys(newErrors).length > 0) {
 *       setErrors(newErrors);
 *       return;
 *     }
 *
 *     setSubmitting(true);
 *     const result = await FormIntegration.submitRegistration(
 *       form.id,
 *       form.name,
 *       FormIntegration.transformFormData(formData, form.fields),
 *       cityId,
 *       cityName
 *     );
 *
 *     if (result.success) {
 *       alert('Form submitted successfully!');
 *       setFormData({});
 *     } else {
 *       alert('Error: ' + result.error);
 *     }
 *     setSubmitting(false);
 *   };
 *
 *   if (!form) return <div>Loading form...</div>;
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {form.fields.map(field => (
 *         <div key={field.id}>
 *           <label>{field.label} {field.required && '*'}</label>
 *           {field.type === 'text' && (
 *             <input
 *               type="text"
 *               name={field.name}
 *               value={formData[field.name] || ''}
 *               onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
 *               placeholder={field.placeholder}
 *             />
 *           )}
 *           {errors[field.name] && <p className="error">{errors[field.name]}</p>}
 *         </div>
 *       ))}
 *       <button type="submit" disabled={submitting}>
 *         {submitting ? 'Submitting...' : 'Submit'}
 *       </button>
 *     </form>
 *   );
 * }
 */
