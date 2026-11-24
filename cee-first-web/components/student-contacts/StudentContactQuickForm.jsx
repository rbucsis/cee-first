'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'
import ContactQuickForm from '../contacts/ContactQuickForm';

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function StudentContactQuickForm({
    student,
    saveCallback=null,
    cancelCallback=null
}) {
    const [contacts, setConacts] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({
        student_id: student.id
    })

    const loadContacts = async () => {
        try {
            const data = await apiFetch(`/api/v1/centers/${CENTER_ID}/contacts`)
            setConacts(data)
        } catch (e) {
            window.alert("An error occurred loading contacts: "+e.message)
        }
    }

    useEffect(() => {
        loadContacts()
    }, [])

    const handleCreateRelation = async (e) => {
        e.preventDefault();
        const payload = {
            student_id: form.student_id,
            contact_id: form.contact_id,
            primary_contact: form.primary_contact || false,
            emergency_contact: form.emergency_contact || false,
            relation: form.relation
        };
        try {
            const res = await apiFetch(`/api/v1/student-contacts`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (saveCallback){
                saveCallback(res);
            }

            setForm({
                student_id: student.id
            })
        } catch (err) {
            alert(`Error adding Contact to Student: ${err.message}`);
        }
    };
    
    const handleContactChange = (ev) => {
        if (ev.currentTarget.value === 'new') {
            setShowModal(true)
        } else {
            setForm(oldForm => ({...oldForm, "contact_id": ev.target.value || null}))
        }
    }

    const handleNewContact = (contact) => {
        contacts.push(contact)
        setConacts(contacts)
        setShowModal(false)
        setForm(oldForm => ({...oldForm, "contact_id": contact.id}))
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
            <h3 className="text-lg font-bold text-main mb-4">Add New Family Member for {student?.first_name || ""} {student?.last_name || ""}</h3>
            <form onSubmit={handleCreateRelation} className="space-y-4">
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Contact *</label>
                <select
                    id='contact_id'
                    name='contact_id'
                    type="text"
                    required
                    value={form.contact_id}
                    onChange={handleContactChange}
                    className="w-full border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="">-Select Contact-</option>
                    <option value="new">-Create New Contact-</option>
                    {contacts?.map((c) => (
                        <option value={c.id} key={c.id} id={c.id}>{(c.first_name+" "+c.last_name).trim()}</option>
                    ))}
                </select>
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Relationship to Student</label>
                <input
                    name='relation'
                    type="text"
                    value={form.relation || ""}
                    onChange={handleChange}
                    className="w-full border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Primary Contact for Student?</label>
                <input
                    name='primary_contact'
                    type="checkbox"
                    value={form.primary_contact}
                    onChange={handleChange}
                    className="border border-muted rounded-md p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                </div>
                <div>
                <label className="block text-xs font-semibold text-main mb-1">Emergency Contact for Student?</label>
                <input
                    name='emergency_contact'
                    type="checkbox"
                    value={form.emergency_contact}
                    onChange={handleChange}
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
            {showModal && (
                <ContactQuickForm onSave={handleNewContact} onCancel={() => setShowModal(false)} />
            )}
        </div>
    )
}