import { useState } from 'react';
import { router } from '@inertiajs/react';

interface AIFormData {
  jenis_kegiatan?: string;
  tipe_penyelenggaraan?: string;
  lokasi?: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  dosen_penggerak?: string;
  judul?: string;
  keterangan?: string;
  tanggal?: string;
}

interface AISuggestionResponse {
  success: boolean;
  data?: AIFormData;
  message?: string;
}

export const useAISuggestion = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestion = async (
    formData: AIFormData,
    onSuccess?: (data: AIFormData) => void,
    onError?: (message: string) => void
  ) => {
    // Validasi hanya memerlukan judul
    if (!formData.judul) {
      onError?.(
        'Masukkan judul kegiatan terlebih dahulu agar AI dapat memperbaiki dan melengkapi deskripsi'
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(route('ai.suggest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN':
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          jenis_kegiatan: formData.jenis_kegiatan,
          tipe_penyelenggaraan: formData.tipe_penyelenggaraan,
          lokasi: formData.lokasi,
          waktu_mulai: formData.waktu_mulai,
          waktu_selesai: formData.waktu_selesai,
          dosen_penggerak: formData.dosen_penggerak,
          judul: formData.judul,
          keterangan: formData.keterangan,
        }),
      });

      const json: AISuggestionResponse = await res.json();

      if (json.success && json.data) {
        // Set default values untuk field yang wajib jika belum ada dari AI
        const enhancedData = {
          ...json.data,
          tanggal: json.data.tanggal || new Date().toISOString().split('T')[0],
          jenis_kegiatan: json.data.jenis_kegiatan || formData.jenis_kegiatan,
          lokasi: json.data.lokasi || formData.lokasi,
          tipe_penyelenggaraan: json.data.tipe_penyelenggaraan || formData.tipe_penyelenggaraan,
          dosen_penggerak: json.data.dosen_penggerak || formData.dosen_penggerak,
        };

        onSuccess?.(enhancedData);
      } else {
        onError?.(json.message || 'Gagal mendapatkan saran dari AI');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      onError?.('Terjadi kesalahan saat menghubungi AI. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getSuggestion,
  };
};
