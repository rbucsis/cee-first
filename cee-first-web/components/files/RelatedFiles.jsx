'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '../ui/Button';
import FileQuickForm from './FileQuickForm';
import { FaRegFileLines } from "react-icons/fa6";
import { FaRegFilePdf } from "react-icons/fa6";
import { FaRegFileWord } from "react-icons/fa6";
import { FaRegTrashAlt } from "react-icons/fa";

const CENTER_ID = process.env.NEXT_PUBLIC_DEV_CENTER_ID;

export default function RelatedFiles({ref_table, ref_id}) {
    const [files, setFiles] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const loadFiles = async () => {
        try {
            setLoading(true);
            let base_url = `/api/v1/centers/${CENTER_ID}/files`
            let query = ''
            if (ref_table || ref_id) {
                query += '?'
                const params = []
                if (ref_table) {
                    params.push("ref_table="+ref_table)
                }
                if (ref_id) {
                    params.push("ref_id="+ref_id)
                }
                query += params.join("&")
            }
            const data = await apiFetch(base_url+query);
            setFiles(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    const saveCallback = () => {
        loadFiles();
        setModalOpen(false);
    }

    const openFile = async (file) => {
        try {
            const url = "/api/v1/files/"+file.id+"/download"
            const singed_url = await apiFetch(url)
            const link = document.createElement('a');
            link.href = singed_url;
            link.download = file.file_name || '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            window.alert("Failed to download: "+e.message)
        }
    }

    const handleDelete = async (file) => {
        await apiFetch("/api/v1/files/"+file.id, {
            "method": "DELETE"
        })
        loadFiles()
    }

    return (
        <div>
            <h3 className="text-xl font-bold tracking-tight text-main">Related Files</h3>
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200 text-sm">
                    {error}
                </div>
            )}
    
            {loading && (
                <div className="text-center py-12 text-main">Getting Files...</div>
            )}
            
            {files?.length ? (
                <div>
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-2">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                                <th className="px-6 py-3"></th>
                                <th className="px-6 py-3"></th>
                                <th className="px-6 py-3">File</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {files.map((f) => (
                                <tr key={f.id} className="hover:bg-slate-50">
                                    <td className="w-1 px-1 py-4 font-medium text-slate-900"><FaRegTrashAlt className="mx-auto hover:cursor-pointer" onClick={() => handleDelete(f)}/></td>
                                    <td className="w-1 px-1 py-4 font-medium text-slate-900">
                                        {f.file_type == 'text/plain' && (<FaRegFileLines className="mx-auto hover:cursor-pointer" color="#222" onClick={() => openFile(f)} />)}
                                        {f.file_type == 'application/pdf' && (<FaRegFilePdf className="mx-auto hover:cursor-pointer" color="#d00" onClick={() => openFile(f)} />)}
                                        {f.file_type == 'application/msword' && (<FaRegFileWord className="mx-auto hover:cursor-pointer" color="#00d" onClick={() => openFile(f)} />)}
                                        {f.file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && (<FaRegFileLines className="mx-auto hover:cursor-pointer" onClick={() => openFile(f)} color="#00d" />)}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 hover:cursor-pointer">
                                        {f.file_name}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <Button size='sm' onClick={() => setModalOpen(true)}>+ Upload File</Button>
                </div> 
            ) : (
                <div className='flex justify-center stretch border border-primary rounded m-6 px-12 py-8'>
                    <Button onClick={() => setModalOpen(true)}>+ Upload File</Button>
                </div>
            )}

            {modalOpen && <FileQuickForm onCancel={() => setModalOpen(false)} onSave={(res) => saveCallback(res)} ref_table={ref_table} ref_id={ref_id} />}
        </div>
    )
}