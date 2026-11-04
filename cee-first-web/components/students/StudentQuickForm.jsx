import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function StudentQuickForm({
    onCancel,
    onSave
}) {
    const today = new Date().toISOString().split("T")[0]

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        const formattedPayload = {
            first_name: payload.first_name,
            last_name: payload.last_name || null,
            birthdate: payload.birthdate || null,
            enroll_date: payload.enroll_date || today,
        };
        try {
            const res = await apiFetch(`/api/v1/centers/${CENTER_ID}/students`, {
                method: 'POST',
                body: JSON.stringify(formattedPayload),
            });

            console.log("QuickForm Response:")
            console.log(res)
            onSave(res);
        } catch (err) {
            alert(`Error creating student: ${err.message}`);
        }
    };
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-main mb-4">Add New Student</h3>
            <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                <input
                    name='first_name'
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                <input
                    name='last_name'
                    type="text"
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Birthday</label>
                <input
                    name='birthdate'
                    type="date"
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Enroll Date *</label>
                <input
                    name='enroll_date'
                    type="date"
                    defaultValue={today}
                    required
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                    type="button"
                    variant='outline'
                    onClick={() => onCancel()}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                >
                    Save Contact
                </Button>
                </div>
            </form>
            </div>
        </div>
    )
}