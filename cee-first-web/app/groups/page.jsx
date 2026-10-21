'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button'

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadGroups = async () => {
    if (!CENTER_ID) {
      setError('NEXT_PUBLIC_DEV_CENTER_ID is not configured in .env.local');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch(`/api/v1/centers/${CENTER_ID}/groups`);
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-main">Groups</h2>
          <p className="text-sm text-muted">Manage groups for your center</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
        >
          + Add Group
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading students...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
          No groups found. Click "+ Add Group" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 hover:cursor-pointer" onClick={() => window.location.pathname = "/groups/"+g.id}>
                  <td className="px-6 py-4 font-medium text-main">
                    {g.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}