import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function FileQuickForm({
    onCancel,
    onSave,
    ref_table,
    ref_id
}) {
    const today = new Date().toISOString().split("T")[0]

    const handleUploadFile = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (ref_table) formData.set('ref_table', ref_table);
        if (ref_id) formData.set('ref_id', ref_id);
        try {
            const res = await apiFetch(`/api/v1/centers/${CENTER_ID}/files`, {
                method: 'POST',
                body: formData,
            });

            onSave(res);
        } catch (err) {
            alert(`Error uploading file: ${err.message}`);
        }
    };
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-main mb-4">Add New Student</h3>
            <form onSubmit={handleUploadFile} className="space-y-4">
                <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">File *</label>
                <input
                    name="file"
                    type="file"
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
                    Upload File
                </Button>
                </div>
            </form>
            </div>
        </div>
    )
}