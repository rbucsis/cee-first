'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button';

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function ContactsPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadTeam = async () => {
    if (!CENTER_ID) {
      setError('NEXT_PUBLIC_DEV_CENTER_ID is not configured in .env.local');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch(`/api/v1/centers/${CENTER_ID}/team`);
      setTeam(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-main">Team</h2>
          <p className="text-sm text-muted">Manage your team members for the center</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
        >
          + Invite Team Member
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading team...</div>
      ) : team.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
          No active team members found. Click "+ Invite Team Member" to start.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 hover:cursor-pointer" onClick={() => window.location.pathname = "/team/"+t.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {t.first_name} {t.last_name || ''}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{t.email}</td>
                  <td className="px-6 py-4 text-slate-600">{t.user_role}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full text-xs">
                      {t.record_status}
                    </span>
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