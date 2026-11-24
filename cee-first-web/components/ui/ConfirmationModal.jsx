import Button from '@/components/ui/Button'

export default function ConfirmationModal({
    title = "Confirm",
    message = "Are you sure?",
    onCancel = null,
    onConfirm = null
}) {
    if ((!onCancel) && (!onConfirm)) {
        throw new Error("'onCancel' or 'onConfirm' event required.")
    }
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <h3 className="text-lg font-bold text-main mb-4">{title}</h3>
                <div className="space-y-4">
                    <div>
                    <p className="block text-xs font-semibold text-main mb-1">{message}</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    {onCancel && (<Button
                        type="button"
                        variant='outline'
                        onClick={() => onCancel()}
                    >
                        Cancel
                    </Button>)}
                    {onConfirm && (<Button
                        type="submit"
                        onClick={() => onConfirm()}
                    >
                        Confirm
                    </Button>)}
                    </div>
                </div>
            </div>
        </div>
    )
}