'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'
import StudentQuickForm from '../students/StudentQuickForm';

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function ContactStudentQuickForm({
    contact,
    saveCallback=null,
    cancelCallback=null
}) {
    const [students, setStudents] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({
        contact_id: contact.id
    })

    const loadStudents = async () => {
            try {
                const data = await apiFetch(`/api/v1/centers/${CENTER_ID}/students`)
                setStudents(data)
            } catch (e) {
                window.alert("An error occurred loading students: "+e.message)
            }
        }
    
    useEffect(() => {
        loadStudents()
    }, [])

    const handleCreateRelation = async (e) => {
        e.preventDefault();
        const payload = {
            student_id: form.student_id,
            contact_id: contact.id,
            primary_contact: form.primary_contact || false,
            emergency_contact: form.emergency_contact || false,
            relation: form.relation || null
        };
        try {
            const res = await apiFetch(`/api/v1/student-contacts`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (saveCallback){
                saveCallback(res);
            }
        } catch (err) {
            alert(`Error adding Student to Contact: ${err.message}`);
        }
    };

    const handleStudentChange = (ev) => {
        if (ev.currentTarget.value === 'new') {
            setShowModal(true)
        } else {
            setForm(oldForm => ({...oldForm, "student_id": ev.target.value || null}))
        }
    }

    const handleNewStudent = (student) => {
        students.push(student)
        setStudents(students)
        setShowModal(false)
        setForm(oldForm => ({...oldForm, "student_id": student.id}))
    }

    const handleChange = (ev) => {
        const key = ev.target.name
        const val = ev.target.type == 'checkbox' ? ev.target.checked : ev.target.value
        const update = {}
        update[key] = val
        setForm(oldForm => ({...oldForm, ...update}))
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-main mb-4">Add New Student for {contact?.first_name || ""} {contact?.last_name || ""}</h3>
            <form onSubmit={handleCreateRelation} className="space-y-4">
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Student *</label>
                <select
                    id='student_id'
                    name='student_id'
                    type="text"
                    required
                    value={form?.student_id || ""}
                    onChange={handleStudentChange}
                    className="w-full border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="">-Select Student-</option>
                    <option value="new">-Create New Student-</option>
                    {students?.map((s) => (
                        <option value={s.id} key={s.id} id={s.id}>{(s.first_name+" "+s.last_name).trim()}</option>
                    ))}
                </select>
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Relationship to Student</label>
                <input
                    name='relation'
                    type="text"
                    value={form?.relation || ""}
                    onChange={handleChange}
                    className="w-full border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Primary Contact for Student?</label>
                <input
                    name='primary_contact'
                    type="checkbox"
                    value={form?.primary_contact || ""}
                    onChange={handleChange}
                    className="border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Emergency Contact for Student?</label>
                <input
                    name='emergency_contact'
                    type="checkbox"
                    value={form?.emergency_contact || ""}
                    onChange={handleChange}
                    className="border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                    type="button"
                    variant='outline'
                    onClick={() => cancelCallback ? cancelCallback() : null}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                >
                    Save Student
                </Button>
                </div>
            </form>
            </div>
            {showModal && (
                <StudentQuickForm onSave={handleNewStudent} onCancel={() => setShowModal(false)} />
            )}
        </div>
    )
}