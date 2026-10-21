import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'

export default function ContactStudentQuickForm({
    contact,
    saveCallback=null,
    cancelCallback=null
}) {
    
    const handleCreateRelation = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        const formattedPayload = {
            student_id: payload.student_id,
            contact_id: contact.id,
            primary_contact: payload.primary_contact || false,
            emergency_contact: payload.emergency_contact || false,
            relation: payload.relation || null
        };
        try {
            const res = await apiFetch(`/api/v1/student-contacts`, {
                method: 'POST',
                body: JSON.stringify(formattedPayload),
            });

            if (saveCallback){
                saveCallback(res);
            }
        } catch (err) {
            alert(`Error adding Student to Contact: ${err.message}`);
        }
    };
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-main mb-4">Add New Student for {contact?.first_name || ""} {contact?.last_name || ""}</h3>
            <form onSubmit={handleCreateRelation} className="space-y-4">
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Student *</label>
                <input
                    name='student_id'
                    type="text"
                    required
                    className="w-full border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Relationship to Student</label>
                <input
                    name='relation'
                    type="text"
                    className="w-full border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Primary Contact for Student?</label>
                <input
                    name='primary_contact'
                    type="checkbox"
                    className="border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Emergency Contact for Student?</label>
                <input
                    name='emergency_contact'
                    type="checkbox"
                    className="border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                    type="button"
                    onClick={() => cancelCallback ? cancelCallback() : null}
                >
                    Cancel
                </Button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
                >
                    Save Contact
                </button>
                </div>
            </form>
            </div>
        </div>
    )
}