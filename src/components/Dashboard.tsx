import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, CheckCircle, Clock, LogOut, Send, Trash2 } from 'lucide-react';

interface Laporan {
    id: string;
    tanggal: string;
    nama: string;
    deskripsi: string;
    status: string;
}

export const Dashboard: React.FC = () => {
    const [laporan, setLaporan] = useState<Laporan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newReport, setNewReport] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        nama: '',
        deskripsi: '',
        status: 'Pending',
    });

    const fetchLaporan = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('laporan')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setLaporan(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLaporan();
    }, []);

    const sendTelegramNotification = async (report: typeof newReport) => {
        const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            console.warn('Telegram token or chat ID missing');
            return;
        }

        const message = `📢 *Laporan Baru*\n\n*Nama:* ${report.nama}\n*Tanggal:* ${report.tanggal}\n*Status:* ${report.status}\n*Deskripsi:* ${report.deskripsi}`;

        try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown',
                }),
            });
        } catch (err) {
            console.error('Failed to send Telegram notification', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('laporan')
            .insert([newReport])
            .select();

        if (!error && data) {
            await sendTelegramNotification(newReport);
            setIsModalOpen(false);
            setNewReport({
                tanggal: new Date().toISOString().split('T')[0],
                nama: '',
                deskripsi: '',
                status: 'Pending',
            });
            fetchLaporan();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-sky-600 p-2 rounded-lg">
                        <Send className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">SME Dashboard</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors bg-slate-100 px-4 py-2 rounded-lg"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Keluar</span>
                </button>
            </nav>

            <main className="max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Daftar Laporan</h2>
                        <p className="text-slate-500">Kelola semua laporan proyek dan operasional Anda</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-sky-200"
                    >
                        <Plus className="w-5 h-5" />
                        Buat Laporan
                    </button>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tanggal</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nama Proyek / Order</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Deskripsi</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : laporan.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Belum ada laporan. Klik "Buat Laporan" untuk memulai.
                                        </td>
                                    </tr>
                                ) : (
                                    laporan.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.tanggal}</td>
                                            <td className="px-6 py-4 text-sm text-slate-800 font-bold">{item.nama}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{item.deskripsi}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Selesai'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                >
                                                    {item.status === 'Selesai' ? (
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Clock className="w-3.5 h-3.5" />
                                                    )}
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-lg">Buat Laporan Baru</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-all"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={newReport.tanggal}
                                    onChange={(e) => setNewReport({ ...newReport, tanggal: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Proyek / Order</label>
                                <input
                                    type="text"
                                    value={newReport.nama}
                                    onChange={(e) => setNewReport({ ...newReport, nama: e.target.value })}
                                    placeholder="Contoh: Renovasi Rumah Pak Andi"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                                <textarea
                                    value={newReport.deskripsi}
                                    onChange={(e) => setNewReport({ ...newReport, deskripsi: e.target.value })}
                                    placeholder="Apa yang dikerjakan hari ini?"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                <select
                                    value={newReport.status}
                                    onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2 mt-4"
                            >
                                <Send className="w-5 h-5" />
                                Kirim Laporan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
