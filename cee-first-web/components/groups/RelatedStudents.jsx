'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '../ui/Button';

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function RelatedStudents({group_id}) {
    const [students, setStudents] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await apiFetch(`/api/v1/centers/${CENTER_ID}/students?group_id=`+group_id);
            setStudents(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const saveCallback = () => {
        loadStudents();
        setModalOpen(false);
    }

    return (
        <div>
            <h3 className="text-xl font-bold tracking-tight text-main">Related Students</h3>
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
                    {error}
                </div>
            )}
    
            {loading && (
                <div className="text-center py-12 text-main">Getting Students...</div>
            )}
            
            {students?.length ? (
                <div>
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {students.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50 hover:cursor-pointer" onClick={() => window.location.pathname = "/students/"+s.id}>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {s.first_name} {s.last_name || ''}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <Button size='sm' onClick={() => setModalOpen(true)}>+ Add Student</Button>
                </div> 
            ) : (
                <div className='flex justify-center stretch border border-primary rounded m-6 px-12 py-8'>
                    <Button onClick={() => setModalOpen(true)}>+ Add First Student</Button>
                </div>
            )}
        </div>
    )
}