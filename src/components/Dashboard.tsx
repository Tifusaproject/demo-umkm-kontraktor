import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, CheckCircle, Clock, LogOut, Send,
    TrendingUp, Activity, BarChart3, Edit2, Trash2,
    MoreVertical, Calendar, ClipboardList
} from 'lucide-react';

interface Laporan {
    id: string;
    tanggal: string;
    nama: string;
    deskripsi: string;
    status: string;
    created_at?: string;
}

export const Dashboard: React.FC = () => {
    const [laporan, setLaporan] = useState<Laporan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState<Laporan | null>(null);
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

    const stats = {
        total: laporan.length,
        pending: laporan.filter(l => l.status === 'Pending').length,
        selesai: laporan.filter(l => l.status === 'Selesai').length,
    };

    const sendTelegramNotification = async (report: typeof newReport, action: string = 'Baru') => {
        const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            console.warn('Telegram token or chat ID missing');
            return;
        }

        const message = `📢 *Laporan ${action}*\n\n*Nama:* ${report.nama}\n*Tanggal:* ${report.tanggal}\n*Status:* ${report.status}\n*Deskripsi:* ${report.deskripsi}`;

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
        if (editingReport) {
            const { error } = await supabase
                .from('laporan')
                .update({
                    tanggal: newReport.tanggal,
                    nama: newReport.nama,
                    deskripsi: newReport.deskripsi,
                    status: newReport.status,
                })
                .eq('id', editingReport.id);

            if (!error) {
                setEditingReport(null);
                resetForm();
                fetchLaporan();
            }
        } else {
            const { data, error } = await supabase
                .from('laporan')
                .insert([newReport])
                .select();

            if (!error && data) {
                await sendTelegramNotification(newReport);
                setIsModalOpen(false);
                resetForm();
                fetchLaporan();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Hapus laporan ini?')) {
            const { error } = await supabase.from('laporan').delete().eq('id', id);
            if (!error) {
                fetchLaporan();
            }
        }
    };

    const openEditModal = (report: Laporan) => {
        setEditingReport(report);
        setNewReport({
            tanggal: report.tanggal,
            nama: report.nama,
            deskripsi: report.deskripsi,
            status: report.status as 'Pending' | 'Selesai',
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setNewReport({
            tanggal: new Date().toISOString().split('T')[0],
            nama: '',
            deskripsi: '',
            status: 'Pending',
        });
        setEditingReport(null);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-sky-600 to-sky-400 p-2.5 rounded-xl shadow-lg shadow-sky-200">
                        <Send className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">SME Dashboard</h1>
                        <p className="text-[10px] uppercase font-bold text-sky-600 tracking-widest leading-none mt-0.5">Premium Version</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-all font-semibold bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-xl border border-slate-100 hover:border-red-100"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                </button>
            </nav>

            <main className="max-w-6xl mx-auto p-6 lg:p-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-slate-900">Dashboard Laporan</h2>
                        <p className="text-slate-500 font-medium">Monitoring performa dan progres operasional secara real-time.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-sky-100 ring-4 ring-white active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Buat Laporan Baru
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card
                        title="Total Laporan"
                        value={stats.total}
                        icon={<ClipboardList className="w-6 h-6 text-sky-600" />}
                        color="sky"
                    />
                    <Card
                        title="Pending (Belum)"
                        value={stats.pending}
                        icon={<Clock className="w-6 h-6 text-amber-600" />}
                        color="amber"
                    />
                    <Card
                        title="Selesai (Done)"
                        value={stats.selesai}
                        icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                        color="emerald"
                    />
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-sky-500" />
                            Riwayat Operasional
                        </h3>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Real-time Sync</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Proyek / Order</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full"></div>
                                                <p className="text-slate-400 font-medium">Mengambil data dari server...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : laporan.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="opacity-40 mb-4 flex justify-center">< ClipboardList className="w-12 h-12" /></div>
                                            <p className="text-slate-400 font-medium font-bold">Belum ada data laporan.</p>
                                            <p className="text-slate-300 text-sm mt-1">Laporan yang Anda buat akan muncul di sini.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    laporan.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {item.tanggal}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-slate-900 font-bold mb-1 leading-tight">{item.nama}</p>
                                                    <p className="text-slate-500 text-xs italic line-clamp-1 max-w-xs">{item.deskripsi}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight ${item.status === 'Selesai'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Selesai' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 shadow-sm transition-all"
                                                        title="Edit Laporan"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-red-50"
                                                        title="Hapus Laporan"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modern Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-xl tracking-tight">
                                {editingReport ? 'Edit Laporan' : 'Laporan Baru'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="text-slate-400 hover:text-slate-900 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-all"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={newReport.tanggal}
                                    onChange={(e) => setNewReport({ ...newReport, tanggal: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-100 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Proyek / Order</label>
                                <input
                                    type="text"
                                    value={newReport.nama}
                                    onChange={(e) => setNewReport({ ...newReport, nama: e.target.value })}
                                    placeholder="Nama proyek Anda..."
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-100 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Deskripsi Aktivitas</label>
                                <textarea
                                    value={newReport.deskripsi}
                                    onChange={(e) => setNewReport({ ...newReport, deskripsi: e.target.value })}
                                    placeholder="Detail pengerjaan hari ini..."
                                    rows={4}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-100 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold resize-none"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status Progres</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewReport({ ...newReport, status: 'Pending' })}
                                        className={`py-3 rounded-2xl font-bold transition-all border-2 ${newReport.status === 'Pending' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Pending
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewReport({ ...newReport, status: 'Selesai' })}
                                        className={`py-3 rounded-2xl font-bold transition-all border-2 ${newReport.status === 'Selesai' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Selesai
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:shadow-sky-200 hover:shadow-2xl text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-3 mt-4 active:scale-95"
                            >
                                <Send className="w-5 h-5" />
                                {editingReport ? 'Simpan Perubahan' : 'Kirim Laporan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Card = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => {
    const colorMap: any = {
        sky: "bg-sky-50 border-sky-100 shadow-sky-50 text-sky-600",
        amber: "bg-amber-50 border-amber-100 shadow-amber-50 text-amber-600",
        emerald: "bg-emerald-50 border-emerald-100 shadow-emerald-50 text-emerald-600",
    };

    return (
        <div className={`p-6 rounded-[2rem] border transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 ${colorMap[color]}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm`}>{icon}</div>
                <TrendingUp className="w-4 h-4 opacity-30" />
            </div>
            <div>
                <p className="text-2xl font-black mb-1">{value}</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">{title}</p>
            </div>
        </div>
    );
};
