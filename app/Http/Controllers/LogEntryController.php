<?php

namespace App\Http\Controllers;

use App\Models\LogEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LogEntryController extends Controller
{
    public function index(): Response
    {
        $logs = LogEntry::orderByDesc('tanggal')->orderByDesc('id')->paginate(20);
        return Inertia::render('logbook/index', [
            'logs' => $logs,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('logbook/edit', [
            'log' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRequest($request);

        if ($request->hasFile('bukti')) {
            $validated['bukti_path'] = $request->file('bukti')->store('bukti', 'public');
        }

        LogEntry::create($validated);
        // Jika diminta kembali ke landing page
        if ($request->boolean('return_home') || $request->input('redirect_to') === route('home')) {
            return redirect()->route('home')->with('success', 'Log tersimpan');
        }
        return redirect()->route('home')->with('success', 'Log tersimpan');
    }

    public function edit(LogEntry $log): Response
    {
        return Inertia::render('logbook/edit', [
            'log' => $log,
        ]);
    }

    public function update(Request $request, LogEntry $log): RedirectResponse
    {
        $validated = $this->validateRequest($request);
        if ($request->hasFile('bukti')) {
            if ($log->bukti_path) {
                Storage::disk('public')->delete($log->bukti_path);
            }
            $validated['bukti_path'] = $request->file('bukti')->store('bukti', 'public');
        }
        $log->update($validated);
        
        // Redirect back to home page
        return redirect()->route('home')->with('success', 'Log diperbarui');
    }

    public function destroy(LogEntry $log): RedirectResponse
    {
        if ($log->bukti_path) {
            Storage::disk('public')->delete($log->bukti_path);
        }
        $log->delete();
        return redirect()->route('home')->with('success', 'Log dihapus');
    }

    private function validateRequest(Request $request): array
    {
        $isCreate = $request->isMethod('post');
        $rules = [
            'tanggal' => ['required', 'date'],
            'waktu_mulai' => ['required'],
            'waktu_selesai' => ['required'],
            'jenis_kegiatan' => ['required', 'string'],
            'dosen_penggerak' => ['required', 'string'],
            'tipe_penyelenggaraan' => ['required', 'in:hybrid,offline,online'],
            'lokasi' => ['required', 'string'],
            'judul' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['required', 'string'],
            'bukti' => ['file', 'mimes:pdf,png,jpg,jpeg', 'max:4096'],
        ];

        if ($isCreate) {
            array_unshift($rules['bukti'], 'required');
        } else {
            // untuk update bukti boleh kosong
            array_unshift($rules['bukti'], 'nullable');
        }

        return $request->validate($rules);
    }
}


