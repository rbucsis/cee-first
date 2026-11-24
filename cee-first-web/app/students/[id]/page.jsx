'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button';
import RelatedContacts from '@/components/students/RelatedContacts';
import RelatedFiles from '@/components/files/RelatedFiles';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function StudentDetailPage() {
    const [student, setStudent] = useState(null);
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const loadStudent = async () => {    
        try {
          setLoading(true);
          const data = await apiFetch('/api/v1'+window.location.pathname);
          setStudent(data);
          if (data.group_id) {
            const group_data = await apiFetch('/api/v1/groups/'+data.group_id);
            setGroups([group_data])
          }
          setForm(structuredClone(data))
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      const loadGroups = async () => {
        const data = await apiFetch('/api/v1/centers/'+CENTER_ID+'/groups')
        setGroups(data || [])
      }
    
      useEffect(() => {
        loadStudent();
        loadGroups();
      }, []);

      const handleSave = async (e) => {
        e.preventDefault();
        const formattedPayload = {
            first_name: form.first_name,
            last_name: form.last_name || null,
            birthday: form.birthday || null,
            enroll_date: form.enroll_date,
            group_id: form.group_id || null,
            diet_notes: form.diet_notes || null,
            medical_notes: form.medical_notes || null,
            notes: form.notes || null
        };
        try {
            await apiFetch('/api/v1'+window.location.pathname, {
                method: 'PUT',
                body: JSON.stringify(formattedPayload),
            });
            loadStudent()
        } catch (err) {
            alert(`Error updating Contact: ${err.message}`);
        }
      }

      const handleChange =(e) => {
        const {name, value} = e.target
        const update = {}
        update[name] = (value === "- None -" ? null : value)
        setForm(oldForm => ({...oldForm, ...update}))
      }

      const handleDelete = async () => {
        try {
          setShowDeleteModal(false)
          await apiFetch('/api/v1'+window.location.pathname, {
              method: 'DELETE'
          });
          window.location.pathname = "/students"
        } catch (e) {
          window.alert("Failed to delete student: "+e.message)
        }
      }

      const isNotChanged = () => {
        if (!form) {
          return true
        }
        for (let key of Object.keys(form)) {
          if (form[key] != student[key]) {
            return false
          }
        }
        return true
      }

      return (
        <div>
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
              {error}
            </div>
          )}
    
          {loading ? (
            <div className="text-center py-12 text-main">Loading student...</div>
          ) : (
              <div>
                  <h2 className="text-2xl font-bold tracking-tight text-main">{student?.first_name} {student?.last_name}</h2>
                  <form onSubmit={handleSave} className='flex flex-col md:w-[80%] md:flex-row flex-wrap m-auto'>
                      <div className='w-full md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">First Name *</label>
                        <input
                            name='first_name'
                            type="text"
                            value={form?.first_name}
                            onChange={handleChange}
                            required
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Last Name</label>
                        <input
                            name='last_name'
                            type="text"
                            value={form?.last_name || ""}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Birthday</label>
                        <input
                            name='birthdate'
                            type="date"
                            value={form?.birthdate || ""}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Enrolled On *</label>
                        <input
                            name='enroll_date'
                            type="date"
                            value={form?.enroll_date || ""}
                            onChange={handleChange}
                            required
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Group</label>
                        <select
                            name='group_id'
                            value={form?.group_id || ""}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option>- None -</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Diet Notes</label>
                        <textarea
                            name='diet_notes'
                            value={form?.diet_notes || ""}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <p className='text-sm text-main'>{form?.diet_notes?.length || 0} / 500</p>
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Medical Notes</label>
                        <textarea
                            name='medical_notes'
                            value={form?.medical_notes || ""}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <p className='text-sm text-main'>{form?.medical_notes?.length || 0} / 500</p>
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Notes</label>
                        <textarea
                            name='notes'
                            value={form?.notes || ""}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <p className='text-sm text-main'>{form?.notes?.length || 0} / 500</p>
                      </div>
                      <div className='w-full p-2'>
                        <Button
                            type="submit"
                            disabled={isNotChanged()}
                            className='m-2'
                        >
                            Save Student
                        </Button>
                        <Button
                            type="button"
                            variant='danger'
                            onClick={() => setShowDeleteModal(true)}
                            className='m-2'
                        >
                            Delete Student
                        </Button>
                      </div>
                  </form>
                  <hr className='h-[2px] my-8 bg-primary border-0 rounded'/>
                  <div className='flex flex-col md:flex-row flex-wrap m-auto'>
                      <div className='md:w-1/2 p-2'>
                        <RelatedContacts student={student} />
                      </div>
                      <div className='md:w-1/2 p-2'>
                        <RelatedFiles ref_table='students' ref_id={student?.id} />
                      </div>
                  </div>
              </div>
          )}
          {showDeleteModal && <ConfirmationModal title="Delete Student" message={"Do you really want to delete "+student.first_name+"?"} onCancel={() => setShowDeleteModal(false)} onConfirm={handleDelete}/>}
        </div>
      )
}