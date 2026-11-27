'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function RelatedContacts({contact}) {
    const [contacts, setContacts] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadContacts = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/api/v1/contacts/'+contact.id+'/related');
            setContacts(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    return (
        <div>
            <h3 className="text-xl font-bold tracking-tight text-main">Related Contacts</h3>
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
                    {error}
                </div>
            )}
    
            {loading && (
                <div className="text-center py-12 text-main">Getting Related Contacts...</div>
            )}
            
            {contacts?.length ? (
                <div>
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {contacts.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 hover:cursor-pointer" onClick={() => window.location.pathname = "/contacts/"+c.id}>
                                        {c.first_name} {c.last_name || ''}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div> 
            ) : (
                <div className='flex justify-center stretch border border-primary rounded m-6 px-12 py-8'>
                    Nothing to show here
                </div>
            )}
        </div>
    )
}