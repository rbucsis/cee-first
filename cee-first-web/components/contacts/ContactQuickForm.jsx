import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function ContactQuickForm({
    closeHandler = null
}) {
    
    const handleCreateContact = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        const formattedPayload = {
            first_name: payload.first_name,
            last_name: payload.last_name || null,
            email: payload.email || null,
            phone: payload.phone || null,
        };
        try {
            await apiFetch(`/api/v1/centers/${CENTER_ID}/contacts`, {
                method: 'POST',
                body: JSON.stringify(formattedPayload),
            });

            closeHandler(false);
        } catch (err) {
            alert(`Error adding Contact: ${err.message}`);
        }
    };
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-main mb-4">Add New Contact</h3>
            <form onSubmit={handleCreateContact} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                    name='email'
                    type="email"
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                    name='phone'
                    type="text"
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => closeHandler(false)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50"
                >
                    Cancel
                </button>
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