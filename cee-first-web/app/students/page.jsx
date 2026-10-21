'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const loadStudents = async () => {
    if (!CENTER_ID) {
      setError('NEXT_PUBLIC_DEV_CENTER_ID is not configured in .env.local');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch(`/api/v1/centers/${CENTER_ID}/students`);
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

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/centers/${CENTER_ID}/students`, {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName || null,
          birthdate: birthdate || null,
        }),
      });

      setFirstName('');
      setLastName('');
      setBirthdate('');
      setIsModalOpen(false);
      loadStudents();
    } catch (err) {
      alert(`Error adding student: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-main">Student Roster</h2>
          <p className="text-sm text-muted">Manage enrolled children for your center</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
        >
          + Add Student
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
          No active students found. Click "+ Add Student" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Birthdate</th>
                <th className="px-6 py-3">Enrollment Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 hover:cursor-pointer" onClick={() => window.location.pathname = "/students/"+s.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {s.first_name} {s.last_name || ''}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{s.birthdate || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-600">{s.enroll_date}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full text-xs">
                      {s.record_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Student</h3>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Birthdate</label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}