'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button';
import RelatedContacts from '@/components/students/RelatedContacts';

export default function StudentDetailPage() {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);
    
    const loadStudent = async () => {    
        try {
          setLoading(true);
          const data = await apiFetch('/api/v1'+window.location.pathname);
          setStudent(data);
          setForm(structuredClone(data))
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        loadStudent();
      }, []);

      const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        console.log(payload)
        const formattedPayload = {
            first_name: payload.first_name,
            last_name: payload.last_name || null,
            birthday: payload.birthday || null,
            enroll_date: payload.enroll_date,
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
        update[name] = value
        setForm(oldForm => ({...oldForm, ...update}))
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
            <div className="text-center py-12 text-main">Loading contact...</div>
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
                            value={form?.last_name}
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
                        <label className="block text-xs font-semibold text-muted mb-1">Enrolled On</label>
                        <input
                            name='enroll_date'
                            type="date"
                            value={form?.enroll_date || ""}
                            onChange={handleChange}
                            required
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className='p-2'>
                        <Button
                            type="submit"
                            disabled={isNotChanged()}
                        >
                            Save Student
                        </Button>
                      </div>
                  </form>
                  <div className='flex flex-col md:flex-row flex-wrap m-auto'>
                      <div className='md:w-1/2 p-2'>
                        <RelatedContacts student={student} />
                      </div>
                  </div>
              </div>
          )}
        </div>
      )
}