'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '../ui/Button';
import ContactStudentQuickForm from '../student-contacts/ContactStudentQuickForm';

export default function RelatedContacts({student}) {
    const [contacts, setContacts] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const loadContacts = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/api/v1/student-contacts?student_id='+student.id);
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

    const saveCallback = () => {
        loadContacts();
        setModalOpen(false);
    }

    return (
        <div>
            <h3 className="text-xl font-bold tracking-tight text-main">Related Contacts</h3>
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
                    {error}
                </div>
            )}
    
            {loading && (
                <div className="text-center py-12 text-main">Getting Contacts...</div>
            )}
            
            {contacts?.length ? (
                <div>
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Relation</th>
                                <th className="px-6 py-3">Primary Contact</th>
                                <th className="px-6 py-3">Emergency Contact</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {contacts.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 hover:cursor-pointer" onClick={() => window.location.pathname = "/contacts/"+c.contact_id}>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {c.contact_first_name} {c.contact_last_name || ''}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {c.relation}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {c.primary_contact ? "Yes" : ""}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {c.emergency_contact ? "Yes" : ""}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <Button size='sm' onClick={() => setModalOpen(true)}>+ Add Family Member</Button>
                </div> 
            ) : (
                <div className='flex justify-center stretch border border-primary rounded m-6 px-12 py-8'>
                    <Button onClick={() => setModalOpen(true)}>+ Add First Family Member</Button>
                </div>
            )}

            {modalOpen && <ContactStudentQuickForm contact={contact} saveCallback={() => saveCallback(false)} cancelCallback={() => setModalOpen(false)}/>}
        </div>
    )
}