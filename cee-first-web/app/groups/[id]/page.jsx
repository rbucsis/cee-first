'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button';
import RelatedStudents from '@/components/groups/RelatedStudents';

export default function GroupDetailPage() {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);
    
    const loadGroup = async () => {    
        try {
          setLoading(true);
          const data = await apiFetch('/api/v1'+window.location.pathname);
          setGroup(data);
          setForm(structuredClone(data))
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        loadGroup();
      }, []);

      const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        console.log(payload)
        const formattedPayload = {
            name: payload.name
        };
        try {
            await apiFetch('/api/v1'+window.location.pathname, {
                method: 'PUT',
                body: JSON.stringify(formattedPayload),
            });
            loadGroup()
        } catch (err) {
            alert(`Error updating Group: ${err.message}`);
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
          if (form[key] != group[key]) {
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
            <div className="text-center py-12 text-main">Loading group...</div>
          ) : (
              <div>
                  <h2 className="text-2xl font-bold tracking-tight text-main">{group?.name}</h2>
                  <form onSubmit={handleSave} className='flex flex-col md:w-[80%] md:flex-row flex-wrap m-auto'>
                      <div className='w-full md:w-1/2 p-2'>
                        <label className="block text-xs font-semibold text-muted mb-1">Rename Group *</label>
                        <input
                            name='name'
                            type="text"
                            value={form?.name}
                            onChange={handleChange}
                            required
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className='w-full p-2'>
                        <Button
                            type="submit"
                            disabled={isNotChanged()}
                        >
                            Save Group
                        </Button>
                      </div>
                  </form>
                  <hr className='h-[2px] my-8 bg-primary border-0 rounded'/>
                  <div className='flex flex-col md:flex-row flex-wrap m-auto'>
                      <div className='md:w-1/2 p-2'>
                        <RelatedStudents group_id={group?.id} />
                      </div>
                  </div>
              </div>
          )}
        </div>
      )
}