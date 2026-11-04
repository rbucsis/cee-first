'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'
import StudentQuickForm from '@/components/students/StudentQuickForm';

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const onSave = (student) => {
    setModalOpen(false)
    console.log(student)
    window.location.pathname = "/students/"+student.id
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-main">Student Roster</h2>
          <p className="text-sm text-muted">Manage enrolled children for your center</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
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
      {modalOpen && (
        <StudentQuickForm onCancel={() => setModalOpen(false)} onSave={(res) => onSave(res)}/>
      )}
    </div>
  );
}