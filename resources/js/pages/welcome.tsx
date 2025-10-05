import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import ReactBitsGradientText from '../components/ReactBitsGradientText';
import ReactBitsShinyText from '../components/ReactBitsShinyText';
import ReactBitsTypewriter from '../components/ReactBitsTypewriter';
import FloatingChatbot from '../components/FloatingChatbot';
import { AISuggestionButton } from '../components/AISuggestionButton';
import { useAISuggestion } from '../hooks/useAISuggestion';

// Ikon SVG ringan (tanpa dependency) untuk tombol
const Icon = ({ path, className = 'h-5 w-5' }: { path: React.ReactNode; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <Icon className={className} path={<>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>} />
);

const ClipboardIcon = ({ className }: { className?: string }) => (
  <Icon className={className} path={<>
    <rect x="8" y="4" width="8" height="4" rx="1" />
    <rect x="6" y="8" width="12" height="12" rx="2" />
  </>} />
);



const XIcon = ({ className }: { className?: string }) => (
  <Icon className={className} path={<>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>} />
);

const SaveIcon = ({ className }: { className?: string }) => (
  <Icon className={className} path={<>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </>} />
);

const CameraIcon = ({ className }: { className?: string }) => (
  <Icon className={className} path={<>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>} />
);

const QuestionIcon = ({ className }: { className?: string }) => (
  <Icon className={className} path={<>
    <path d="M9 9a3 3 0 1 1 6 0c0 2-3 2-3 4" />
    <line x1="12" y1="17" x2="12" y2="17" />
    <circle cx="12" cy="12" r="10" />
  </>} />
);

const PencilIcon = ({ className }: { className?: string }) => (
  <Icon className={className} path={<>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </>} />
);

type Log = {
  id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  jenis_kegiatan: string;
  lokasi: string;
  judul?: string | null;
  export_status: string;
  keterangan: string;
  tipe_penyelenggaraan: 'hybrid' | 'offline' | 'online';
  dosen_penggerak: string;
  bukti?: string | null;
  bukti_path?: string | null;
};

export default function Welcome() {
  // Dark mode state (persisted)
  const [isDark, setIsDark] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const cameraOpenRef = useRef(false);

  // Initialize dark mode on mount
  useEffect(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('logyai:theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    console.log('Initial theme setup:', { savedTheme, systemPrefersDark, initialTheme });
    
    setIsDark(initialTheme);
    
    // Apply theme immediately
    if (initialTheme) {
      document.documentElement.classList.add('dark');
      console.log('Applied dark theme on init');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Applied light theme on init');
    }
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setVideoReady(false);
    };
  }, [stream]);



  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = !isDark;
    console.log('Toggling theme:', { current: isDark, new: newTheme });
    
    // Update localStorage
    localStorage.setItem('logyai:theme', newTheme ? 'dark' : 'light');
    
    // Update DOM immediately
    if (newTheme) {
      document.documentElement.classList.add('dark');   
      console.log('Added dark class');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class');
    }
    
    // Update state
    setIsDark(newTheme);
    
    // Force CSS recalculation
    document.documentElement.style.setProperty('--theme-mode', newTheme ? 'dark' : 'light');
    
    // Force reload immediately
    window.location.reload();
  };
  const { logs } = (usePage().props as unknown as { logs: Log[] });
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<number[]>(() => {
    const saved = localStorage.getItem('logyai:selectedLogs');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect scroll for navbar animation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Disable scroll when modal is open
  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [openModal]);

  // Close camera modal when other modals open, but allow camera to open when form modal is open
  useEffect(() => {
    if (showDeleteModal && cameraOpen) {
      // Stop all tracks in the stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setVideoReady(false);
      setCameraOpen(false);
      cameraOpenRef.current = false;
      setCameraSupported(true);
    }
  }, [showDeleteModal, cameraOpen, stream]);

  // Monitor modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', { openModal, editingId });

    // Only log modal close if it was previously open and not during initial render
    if (!openModal && editingId !== null) {
      console.log('❌ Modal was closed! Stack trace:', new Error().stack);
      console.log('❌ Form state at close:', form.data);
      console.log('❌ Form errors at close:', form.errors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openModal, editingId]);

  // IMPROVED VIDEO STREAM MANAGEMENT
  useEffect(() => {
    const video = document.querySelector('#camera-video') as HTMLVideoElement;
    
    if (video && stream && cameraOpen) {
      let isSettingUp = false;
      
      const setupVideo = async () => {
        if (isSettingUp) return;
        isSettingUp = true;
        
        try {
          console.log('Setting up video element');
          
          // Reset video element
          video.pause();
          video.currentTime = 0;
          
          // Ensure stream tracks are active
          const videoTrack = stream.getVideoTracks()[0];
          if (!videoTrack || videoTrack.readyState !== 'live') {
            throw new Error('Video track is not live');
          }
          
          // Set stream
          video.srcObject = stream;
          
          // Wait for metadata and play
          await new Promise((resolve, reject) => {
            let resolved = false;
            
            const handleLoadedMetadata = () => {
              if (resolved) return;
              resolved = true;
              cleanup();
              resolve(true);
            };
            
            const handleError = (e: Event) => {
              if (resolved) return;
              resolved = true;
              cleanup();
              reject(new Error(`Video error: ${e.type}`));
            };
            
            const cleanup = () => {
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
              video.removeEventListener('error', handleError);
              video.removeEventListener('abort', handleError);
            };
            
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('error', handleError);
            video.addEventListener('abort', handleError);
            
            // Timeout
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                cleanup();
                reject(new Error('Video setup timeout'));
              }
            }, 8000);
          });
          
          // Play video
          await video.play();
          setVideoReady(true);
          console.log('Camera video ready');
          
        } catch (error) {
          console.error('Video setup error:', error);
          setVideoReady(false);
          setCameraSupported(false);
          showToast('Gagal menampilkan kamera. Silakan gunakan upload foto.', 'error');
        } finally {
          isSettingUp = false;
        }
      };
      
      setupVideo();
      
      // Cleanup
      return () => {
        isSettingUp = true;
        if (video.srcObject) {
          video.pause();
          video.srcObject = null;
        }
        setVideoReady(false);
      };
    }
  }, [stream, cameraOpen]);
  const form = useForm<{
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    jenis_kegiatan: string;
    dosen_penggerak: string;
    tipe_penyelenggaraan: 'hybrid' | 'offline' | 'online';
    lokasi: string;
    keterangan: string;
    bukti?: File | null;
    return_home?: boolean;
  }>({
    tanggal: '',
    waktu_mulai: '08:30',
    waktu_selesai: '17:30',
    jenis_kegiatan: '',
    dosen_penggerak: '',
    tipe_penyelenggaraan: 'hybrid',
    lokasi: '',
    keterangan: '',
    bukti: null,
    return_home: true,
  });

  // Opsi sesuai dengan portal IPB
  const jenisKegiatanOptions = [
    { value: 'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)', label: 'Berita Acara Pembimbingan (Konsultasi/Mentoring/Coaching)' },
    { value: 'Berita Acara Ujian', label: 'Berita Acara Ujian' },
    { value: 'Berita Acara Kegiatan', label: 'Berita Acara Kegiatan' }
  ];

  const dosenPenggerakOptions = [
    { value: 'Amata Fami, M.Ds. - 201807198507182001', label: 'Amata Fami, M.Ds. - 201807198507182001' },
    // Tambahkan dosen lain sesuai kebutuhan
  ];

  const openCreateModal = () => {
    console.log('🔴 Opening create modal');
    setEditingId(null);
    
    // Reset form untuk create baru
    form.reset();
    
    // Set default values
    form.setData({
      tanggal: '',
      waktu_mulai: '08:30',
      waktu_selesai: '17:30',
      jenis_kegiatan: '',
      dosen_penggerak: '',
      tipe_penyelenggaraan: 'hybrid',
      lokasi: '',
      keterangan: '',
      bukti: null,
      return_home: true,
    });
    
    setImagePreview(null);
    setOpenModal(true);
  };

  // Handle checkbox selection
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = logs.map(log => log.id);
      setSelectedLogs(allIds);
      localStorage.setItem('logyai:selectedLogs', JSON.stringify(allIds));
    } else {
      setSelectedLogs([]);
      localStorage.removeItem('logyai:selectedLogs');
    }
  };

  const handleSelectLog = (logId: number, checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedLogs, logId];
      setSelectedLogs(newSelected);
      localStorage.setItem('logyai:selectedLogs', JSON.stringify(newSelected));
    } else {
      const newSelected = selectedLogs.filter(id => id !== logId);
      setSelectedLogs(newSelected);
      if (newSelected.length === 0) {
        localStorage.removeItem('logyai:selectedLogs');
      } else {
        localStorage.setItem('logyai:selectedLogs', JSON.stringify(newSelected));
      }
    }
  };

  // Handle bulk export
  const handleBulkExport = async () => {
    if (selectedLogs.length === 0) {
      showToast('Pilih log yang akan diekspor terlebih dahulu', 'error');
      return;
    }

    try {
              const promises = selectedLogs.map(logId =>
            fetch(route('export', logId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(res => res.json()));
      
      const successCount = results.filter(result => result.success).length;
      const failedCount = results.length - successCount;
      
      if (failedCount === 0) {
        showToast(`Berhasil mengekspor ${successCount} log ke portal IPB!`, 'success');
      } else {
        showToast(`Berhasil mengekspor ${successCount} log, gagal ${failedCount} log`, 'error');
      }
      
      // Reset selection
      setSelectedLogs([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Bulk export error:', error);
      showToast('Terjadi kesalahan saat mengekspor', 'error');
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (logId: number) => {
    setDeleteTarget(logId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
              router.delete(route('destroy', deleteTarget), { preserveScroll: true });
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const openEditModal = (l: Log) => {
    console.log('🔴 Opening edit modal for log:', l);
    setEditingId(l.id);
    
    // Reset form dengan data yang ada
    form.reset();
    
    // Set data untuk edit
    form.setData({
      tanggal: l.tanggal || '',
      waktu_mulai: l.waktu_mulai || '',
      waktu_selesai: l.waktu_selesai || '',
      jenis_kegiatan: l.jenis_kegiatan || '',
      dosen_penggerak: l.dosen_penggerak || '',
      tipe_penyelenggaraan: l.tipe_penyelenggaraan || 'hybrid',
      lokasi: l.lokasi || '',
      keterangan: l.keterangan || '',
      bukti: null,
      return_home: true,
    });
    
    // Set image preview jika ada bukti
    if (l.bukti_path) {
      setImagePreview(`/storage/${l.bukti_path}`);
    } else {
      setImagePreview(null);
    }
    
    setOpenModal(true);
  };

  const [cursor, setCursor] = useState<{x:number;y:number}>({x: 300, y: 200});
  const [sparkles, setSparkles] = useState<Array<{id:number;x:number;y:number}>>([]);
  const [animTime, setAnimTime] = useState(0);
  
  // Simple animation with useState and setInterval
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimTime(prev => prev + 0.1);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  const [promptText, setPromptText] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempFormData, setTempFormData] = useState<{
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    jenis_kegiatan: string;
    dosen_penggerak: string;
    tipe_penyelenggaraan: 'hybrid' | 'offline' | 'online';
    lokasi: string;
    keterangan: string;
    bukti?: File | null;
    return_home?: boolean;
  } | null>(null); // State untuk menyimpan data sementara

  // State lokal untuk data AI yang di-generate
  const [aiGeneratedData, setAiGeneratedData] = useState<{
    keterangan?: string;
    jenis_kegiatan?: string;
    lokasi?: string;
    tipe_penyelenggaraan?: 'hybrid' | 'offline' | 'online';
    tanggal?: string;
    dosen_penggerak?: string;
  } | null>(null);
  
  // State untuk force re-render form setelah AI generate
  const [formKey, setFormKey] = useState(0);

  // Chatbot floating state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null!);

  // Only prevent Escape key during generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (promptLoading && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        console.log('Prevented Escape key during generation');
      }
    };

    if (promptLoading) {
      document.addEventListener('keydown', handleKeyDown, true);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [promptLoading]);

  // Monitor modal close during generation
  useEffect(() => {
    if ((isGenerating || promptLoading) && !openModal) {
      console.log('❌ Modal was closed during generation!');
      console.log('❌ Form state at close during generation:', form.data);
      console.log('❌ Form errors at close during generation:', form.errors);
    }
  }, [isGenerating, promptLoading, openModal, form.data, form.errors]);

  // Monitor all modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', { openModal, editingId, isGenerating, promptLoading });
    
    // Clean up tempFormData when modal is closed
    if (!openModal) {
      setTempFormData(null);
      setAiGeneratedData(null); // Clean up AI generated data
    }
  }, [openModal, editingId, isGenerating, promptLoading]);

  // Monitor form data changes
  useEffect(() => {
    console.log('🔍 Form data changed:', form.data);
  }, [form.data]);

  // Monitor camera modal state and sync ref
  useEffect(() => {
    console.log('🔍 Camera modal state changed:', { cameraOpen, cameraSupported });
    cameraOpenRef.current = cameraOpen;
  }, [cameraOpen, cameraSupported]);

  const openCamera = async () => {
    try {
      // Prevent multiple camera instances
      if (cameraOpen) {
        return;
      }

      // Reset states
      setVideoReady(false);
      setCameraSupported(true);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraSupported(false);
        setCameraOpen(true);
        showToast('Kamera tidak tersedia di browser ini. Silakan upload foto dari galeri.', 'error');
        return;
      }

      // Open camera modal
      setCameraOpen(true);
      
      try {
        // Request camera access
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: "environment" },
            width: { ideal: 640, min: 320, max: 1920 },
            height: { ideal: 480, min: 240, max: 1080 }
          } 
        });
        
        setStream(mediaStream);
        setCameraSupported(true);
        
      } catch (cameraError) {
        setCameraSupported(false);
        
        let errorMessage = 'Tidak dapat mengakses kamera. ';
        const error = cameraError as Error;
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Izin kamera ditolak.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'Kamera tidak ditemukan.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Kamera sedang digunakan aplikasi lain.';
        } else {
          errorMessage += 'Silakan upload foto dari galeri.';
        }
        
        showToast(errorMessage, 'error');
      }
      
    } catch {
      setCameraSupported(false);
      setCameraOpen(true);
      showToast('Terjadi kesalahan saat membuka kamera.', 'error');
    }
  };

  const capturePhoto = async () => {
    if (!stream || !videoReady) return;
    
    const video = document.querySelector('#camera-video') as HTMLVideoElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready for capture');
      return;
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context?.drawImage(video, 0, 0);
    
    // Get device location
    let deviceLocation = 'Lokasi tidak tersedia';
    setLocationLoading(true);
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        
        const { latitude, longitude } = position.coords;
        
        // Get location from coordinates using helper function
        deviceLocation = await getLocationFromCoordinates(latitude, longitude);
      }
    } catch (locationError) {
      console.log('Location access failed:', locationError);
      deviceLocation = form.data.lokasi || 'Lokasi tidak tersedia';
    } finally {
      setLocationLoading(false);
    }
    
    // Add watermark with date, time, and device location
    const when = new Date();
    const tgl = when.toLocaleDateString('id-ID');
    const jam = when.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const text = `${tgl} ${jam} • ${deviceLocation}`;
    
    if (context) {
      context.font = '16px sans-serif';
      context.textBaseline = 'bottom';
      const padding = 12;
      const w = context.measureText(text).width;
      const x = canvas.width - padding;
      const y = canvas.height - padding;
      
      // Add semi-transparent background for watermark
      context.fillStyle = 'rgba(255,255,255,0.7)';
      context.fillRect(x - w - 12, y - 22, w + 10, 20);
      
      // Add text
      context.fillStyle = 'rgba(17,24,39,0.9)';
      context.fillText(text, x - w - 7, y - 6);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `bukti_${when.getTime()}.jpg`, { type: 'image/jpeg' });
        form.setData('bukti', file);
        
        // Show preview
        const previewUrl = URL.createObjectURL(blob);
        setImagePreview(previewUrl);
      }
      closeCameraModal();
    }, 'image/jpeg', 0.9);
  };

  const closeCameraModal = useCallback(() => {
    console.log('Closing camera modal');

    // Stop all tracks in the stream
    if (stream) {
      console.log('Stopping stream tracks');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.id, track.readyState);
        track.stop();
      });
      setStream(null);
    }

    // Reset video element
    const video = document.querySelector('#camera-video') as HTMLVideoElement;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.load();
    }

    // Reset all states
    setVideoReady(false);
    setCameraOpen(false);
    cameraOpenRef.current = false;
    setCameraSupported(true);
    console.log('Camera modal closed, states reset');
  }, [stream]);

  const handleImage = async (e: Event | React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement | null;
    const file = (target?.files?.[0] as File) || null;
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((r) => (img.onload = r));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const maxW = 1600;
    const scale = Math.min(1, maxW / img.width);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get device location
    let deviceLocation = 'Lokasi tidak tersedia';
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        
        const { latitude, longitude } = position.coords;
        
        // Get location from coordinates using helper function
        deviceLocation = await getLocationFromCoordinates(latitude, longitude);
      }
    } catch (locationError) {
      console.log('Location access failed:', locationError);
      deviceLocation = form.data.lokasi || 'Lokasi tidak tersedia';
    }

    const when = new Date();
    const tgl = when.toLocaleDateString('id-ID');
    const jam = when.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const text = `${tgl} ${jam} • ${deviceLocation}`;
    ctx.font = '16px sans-serif';
    ctx.textBaseline = 'bottom';
    const padding = 12;
    const w = ctx.measureText(text).width;
    const x = canvas.width - padding;
    const y = canvas.height - padding;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x - w - 12, y - 22, w + 10, 20);
    ctx.fillStyle = 'rgba(17,24,39,0.9)';
    ctx.fillText(text, x - w - 7, y - 6);

    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
    const watermarked = new File([blob], `bukti_${when.getTime()}.jpg`, { type: 'image/jpeg' });
    form.setData('bukti', watermarked);
    
    // Show preview
    const previewUrl = URL.createObjectURL(blob);
    setImagePreview(previewUrl);
  };

  // Use AI Suggestion hook
  const { isLoading: aiSuggestionLoading, getSuggestion } = useAISuggestion();

  const askAI = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    await getSuggestion(
      form.data,
      (aiData) => {
        // Success callback
        setAiGeneratedData({
          keterangan: aiData.keterangan,
          jenis_kegiatan: aiData.jenis_kegiatan,
          lokasi: aiData.lokasi,
          tipe_penyelenggaraan: (aiData.tipe_penyelenggaraan as 'hybrid' | 'offline' | 'online') || 'hybrid',
          tanggal: aiData.tanggal,
          dosen_penggerak: aiData.dosen_penggerak,
        });

        // Update form dengan data dari AI
        if (aiData.keterangan) form.setData('keterangan', aiData.keterangan);
        if (aiData.jenis_kegiatan) form.setData('jenis_kegiatan', aiData.jenis_kegiatan);
        if (aiData.lokasi) form.setData('lokasi', aiData.lokasi);
        if (aiData.tipe_penyelenggaraan) form.setData('tipe_penyelenggaraan', aiData.tipe_penyelenggaraan as 'hybrid' | 'offline' | 'online');
        if (aiData.tanggal) form.setData('tanggal', aiData.tanggal);
        if (aiData.dosen_penggerak) form.setData('dosen_penggerak', aiData.dosen_penggerak);

        showToast('Deskripsi berhasil diperbaiki oleh Gemini AI! Silakan review dan edit jika diperlukan.', 'success');

        // Ensure modal stays open
        if (!openModal) {
          setOpenModal(true);
        }
      },
      (errorMessage) => {
        // Error callback
        showToast(errorMessage, 'error');
      }
    );
  };

  const generateFromPrompt = async (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== GENERATE START ===');
    console.log('Generate from prompt started, openModal state:', openModal);
    console.log('Current form data before generate:', form.data);
    console.log('Current editingId:', editingId);
    
    const trimmedPrompt = promptText.trim();

    if (!trimmedPrompt) {
      showToast('Masukkan deskripsi kegiatan terlebih dahulu', 'error');
      return;
    }

    if (trimmedPrompt.length < 3) {
      showToast('Deskripsi kegiatan minimal 3 karakter', 'error');
      return;
    }
    
    // Store current modal state
    const currentModalState = openModal;
    console.log('Current modal state before generate:', currentModalState);
    
    setIsGenerating(true);
    setPromptLoading(true);
    setShowSkeleton(true);
    
    console.log('Set promptLoading to true');
    
    try {
      const response = await fetch(route('ai.suggest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          prompt: promptText,
          jenis_kegiatan: form.data.jenis_kegiatan || 'praktik',
          tipe_penyelenggaraan: form.data.tipe_penyelenggaraan || 'offline',
          dosen_penggerak: form.data.dosen_penggerak || 'Dr. Ir. Suprihatin, M.Si',
          lokasi: form.data.lokasi || 'Graha Telkomsigma II, Tangerang Selatan',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      console.log('🔴 AI Response received:', data);
      
      if (data.success) {
        // Update form dengan hasil generate
        console.log('🔴 Setting form data from AI response:', data.data);
        console.log('🔴 Form state before setting data:', form.data);
        
        // Simpan data AI ke state lokal
        console.log('🔴 Saving AI data to local state');
        setAiGeneratedData({
          keterangan: data.data?.keterangan,
          jenis_kegiatan: data.data?.jenis_kegiatan,
          lokasi: data.data?.lokasi,
          tipe_penyelenggaraan: data.data?.tipe_penyelenggaraan,
          tanggal: data.data?.tanggal,
          dosen_penggerak: data.data?.dosen_penggerak,
        });

        // Set data ke form menggunakan setData individual untuk memastikan tersimpan
        console.log('🔴 Setting form data individually to ensure it saves');

        if (data.data?.keterangan) {
          console.log('Setting keterangan:', data.data.keterangan);
          form.setData('keterangan', data.data.keterangan);
        }
        if (data.data?.jenis_kegiatan) {
          console.log('Setting jenis_kegiatan:', data.data.jenis_kegiatan);
          form.setData('jenis_kegiatan', data.data.jenis_kegiatan);
        }
        if (data.data?.lokasi) {
          console.log('Setting lokasi:', data.data.lokasi);
          form.setData('lokasi', data.data.lokasi);
        }
        if (data.data?.tipe_penyelenggaraan) {
          console.log('Setting tipe_penyelenggaraan:', data.data.tipe_penyelenggaraan);
          form.setData('tipe_penyelenggaraan', data.data.tipe_penyelenggaraan);
        }
        
        // Auto-generate fields yang belum ada
        console.log('🔴 Auto-generating missing fields...');
        
        // Set tanggal default jika belum ada
        if (!data.data?.tanggal) {
          const today = new Date().toISOString().split('T')[0];
          console.log('Setting default tanggal:', today);
          form.setData('tanggal', today);
        } else {
          console.log('Setting tanggal from AI:', data.data.tanggal);
          form.setData('tanggal', data.data.tanggal);
        }
        
        // Set dosen penggerak default jika belum ada
        if (!data.data?.dosen_penggerak) {
          console.log('Setting default dosen_penggerak: Dr. Ir. Suprihatin, M.Si');
          form.setData('dosen_penggerak', 'Dr. Ir. Suprihatin, M.Si');
        } else {
          console.log('Setting dosen_penggerak from AI:', data.data.dosen_penggerak);
          form.setData('dosen_penggerak', data.data.dosen_penggerak);
        }
        
        // Set default values untuk field yang wajib jika belum ada
        if (!data.data?.jenis_kegiatan) {
          console.log('Setting default jenis_kegiatan: praktik');
          form.setData('jenis_kegiatan', 'praktik');
        }
        if (!data.data?.lokasi) {
          console.log('Setting default lokasi: Graha Telkomsigma II, Tangerang Selatan');
          form.setData('lokasi', 'Graha Telkomsigma II, Tangerang Selatan');
        }
        if (!data.data?.tipe_penyelenggaraan) {
          console.log('Setting default tipe_penyelenggaraan: offline');
          form.setData('tipe_penyelenggaraan', 'offline');
        }
        
        // Log data setelah semua setData selesai
        console.log('🔴 Form state after setting all data:', form.data);
        console.log('🔴 AI Generated Data state:', aiGeneratedData);
        console.log('🔴 Modal state after setting data:', { openModal, editingId });
        
        // Force re-render form dengan key baru
        setFormKey(prev => prev + 1);
        console.log('🔴 Force re-render form with new key:', formKey + 1);
        
        // Success - gunakan toast, modal tetap terbuka
        showToast('Logbook berhasil di-generate dengan Gemini AI! Silakan review dan edit jika diperlukan.', 'success');
        console.log('Logbook berhasil di-generate dengan Gemini AI!');
        
        // Double check form data after a short delay dengan logging yang lebih detail
        setTimeout(() => {
          console.log('🔴 Form state after timeout:', form.data);
          console.log('🔴 AI Generated Data state after timeout:', aiGeneratedData);
          console.log('🔴 Modal state after timeout:', { openModal, editingId });
          console.log('🔴 Checking individual fields:');
          console.log('  - tanggal:', form.data.tanggal);
          console.log('  - keterangan:', form.data.keterangan);
          console.log('  - jenis_kegiatan:', form.data.jenis_kegiatan);
          console.log('  - lokasi:', form.data.lokasi);
          console.log('  - tipe_penyelenggaraan:', form.data.tipe_penyelenggaraan);
          console.log('  - dosen_penggerak:', form.data.dosen_penggerak);
        }, 200); // Increase timeout untuk memastikan state terupdate
        
        // Force modal to stay open
        if (!openModal) {
          console.log('🔴 Modal was closed, forcing it back open');
          setOpenModal(true);
        }
      } else {
        console.error('Gagal generate logbook:', data.message || 'Terjadi kesalahan');
        showToast('Gagal generate logbook: ' + (data.message || 'Terjadi kesalahan'), 'error');
      }
    } catch (error) {
      console.error('Error generating from prompt:', error);
      showToast('Gagal generate logbook. Silakan coba lagi.', 'error');
    } finally {
      setIsGenerating(false);
      setPromptLoading(false);
      setShowSkeleton(false);
      console.log('Generate completed');
      console.log('Final modal state:', { openModal, editingId });
      console.log('Final form data:', form.data);
    }
  };

  const clearPrompt = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPromptText('');
  };

  // Helper function untuk mendapatkan lokasi dari koordinat
  const getLocationFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Gunakan zoom level yang lebih detail untuk mendapatkan lokasi yang lebih spesifik
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=id`);
      const data = await response.json();
      
      if (data.display_name && data.address) {
        const address = data.address;
        const addressParts = data.display_name.split(', ');
        
        // Coba dapatkan lokasi yang lebih spesifik
        const locationParts: string[] = [];
        
        // Prioritas 1: Kecamatan dan Kelurahan
        if (address.suburb) {
          locationParts.push(address.suburb);
        }
        if (address.neighbourhood) {
          locationParts.push(address.neighbourhood);
        }
        if (address.quarter) {
          locationParts.push(address.quarter);
        }
        
        // Prioritas 2: Kota/Kabupaten
        if (address.city) {
          locationParts.push(address.city);
        } else if (address.town) {
          locationParts.push(address.town);
        } else if (address.county) {
          locationParts.push(address.county);
        }
        
        // Jika ada bagian lokasi, gabungkan
        if (locationParts.length > 0) {
          return locationParts.join(' - ');
        }
        
        // Fallback: Cari kata kunci spesifik dalam display_name
        const specificKeywords = [
          'Telkomsigma', 'GTS', 'Graha Telkomsigma',
          'BSD', 'Serpong', 'Cisauk', 'Pagedangan', 'Cisoka', 'Solear', 'Tigaraksa',
          'Pasar Kemis', 'PasarKemis', 'Sepatan', 'Sepatan Timur', 'Pakuhaji',
          'Tangerang Selatan', 'Tangerang', 'Jakarta Selatan', 'Jakarta Barat',
          'Depok', 'Bekasi', 'Bogor', 'Karawang'
        ];
        
        for (const keyword of specificKeywords) {
          const matchingPart = addressParts.find((part: string) =>
            part.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matchingPart) {
            return matchingPart;
          }
        }
        
        // Fallback: Cari kata kunci umum Indonesia
        const indonesianKeywords = [
          'Kota', 'Kabupaten', 'Kecamatan', 'Kelurahan', 'Desa',
          'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang',
          'Yogyakarta', 'Malang', 'Palembang', 'Tangerang', 'Bekasi',
          'Depok', 'Bogor', 'Karawang', 'Cikarang', 'Cibubur'
        ];
        
        for (const keyword of indonesianKeywords) {
          const matchingPart = addressParts.find((part: string) =>
            part.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matchingPart) {
            return matchingPart;
          }
        }
        
        // Fallback: Ambil bagian yang bermakna (bukan angka, bukan Indonesia)
        const meaningfulParts = addressParts.filter((part: string) =>
          part.length > 3 &&
          !part.match(/^\d+$/) &&
          !part.includes('Indonesia') &&
          !part.includes('ID') &&
          !part.includes('Provinsi') &&
          !part.includes('province')
        );
        
        if (meaningfulParts.length > 0) {
          return meaningfulParts[0];
        }
        
        return 'Lokasi tidak dikenal';
      } else {
        return 'Lokasi tidak dikenal';
      }
    } catch (geocodeError) {
      console.log('Geocoding failed, using fallback:', geocodeError);
      return 'Lokasi tidak tersedia';
    }
  };

  // Function untuk mengecek apakah form sudah valid
  const isFormValid = () => {
    const requiredFields = [
      'tanggal', 'waktu_mulai', 'waktu_selesai', 'jenis_kegiatan',
      'dosen_penggerak', 'lokasi', 'keterangan'
    ];
    
    const hasAllRequiredFields = requiredFields.every(field => 
      form.data[field as keyof typeof form.data] && 
      form.data[field as keyof typeof form.data]?.toString().trim() !== ''
    );
    
    // Untuk edit, bukti tidak wajib jika sudah ada sebelumnya
    const hasBukti = editingId ? true : (form.data.bukti || isGenerating || promptLoading);
    
    return hasAllRequiredFields && hasBukti;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  // Chatbot functions
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch(route('ai.chatbot'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages.map(msg => ({ role: msg.role, content: msg.content })),
        }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        showToast('Gagal mendapatkan response dari AI', 'error');
      }
    } catch (error) {
      console.error('Chat error:', error);
      showToast('Terjadi kesalahan saat menghubungi AI', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setChatInput('');
  };

  // Simplified modal state management
  useEffect(() => {
    if (isGenerating || promptLoading) {
      setOpenModal(true);
    }
  }, [isGenerating, promptLoading]);

  // Prevent modal close during generation
  const handleModalClose = () => {
    if (isGenerating || promptLoading) {
      showToast('Tunggu proses generate selesai sebelum menutup modal', 'error');
      return;
    }
    setOpenModal(false);
    setImagePreview(null);
  };

    return (
    <div 
      className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 dark:from-gray-900 dark:to-black dark:text-gray-100"
                    style={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#f9fafb' : '#0f172a'
              }}
    >
      <Head title="Logyai – Logbook Magang AI" />

      {/* Navbar */}
      <div className={`sticky z-40 transition-all duration-300 ${
        isScrolled ? 'top-4' : 'top-0'
      }`}>
        <header className={`mx-auto bg-white dark:bg-gray-900 transition-all duration-300 ${
          isScrolled
            ? 'max-w-6xl rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700'
            : 'max-w-full shadow-sm border-b border-gray-200/50 dark:border-gray-700/50'
        }`}>
          <div className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'px-6 py-3' : 'px-8 py-4'
          }`}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 transition-all duration-300 ${
              isScrolled ? 'h-9 w-9' : 'h-10 w-10'
            }`}>
              <span className={`transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>📝</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-gray-900 dark:text-gray-100 transition-all duration-300 ${
                isScrolled ? 'text-base' : 'text-lg'
              }`}>Logyai</span>
              <span className={`text-gray-500 dark:text-gray-400 -mt-1 transition-all duration-300 ${
                isScrolled ? 'text-[10px]' : 'text-xs'
              }`}>Logbook Magang AI</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Beta Badge */}
            <div className={`hidden sm:flex items-center gap-2 bg-indigo-600 dark:from-indigo-900/30 dark:to-purple-900/30 dark:bg-gradient-to-r rounded-full border-2 border-indigo-700 dark:border-indigo-700 shadow-md transition-all duration-300 ${
              isScrolled ? 'px-3 py-1.5' : 'px-4 py-2'
            }`}>
              <span className={`relative flex transition-all duration-300 ${isScrolled ? 'h-1.5 w-1.5' : 'h-2 w-2'}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-white"></span>
              </span>
              <span className={`font-bold text-white dark:text-indigo-300 transition-all duration-300 ${
                isScrolled ? 'text-[10px]' : 'text-xs'
              }`}>AI Powered</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              className={`group relative rounded-full transition-all duration-300 ${
                isDark
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30'
              } ${isScrolled ? 'p-2.5' : 'p-3'}`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className={`relative transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`}>
                {isDark ? (
                  <svg className="w-full h-full text-white transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-full h-full text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>
        </header>
      </div>

      {/* Hero */}
      <section
        className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 py-16 text-center md:py-24"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const newCursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          setCursor(newCursor);
        }}
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = Date.now() + Math.random();
          setSparkles((s) => [...s, { id, x, y }]);
          setTimeout(() => {
            setSparkles((s) => s.filter((sp) => sp.id !== id));
          }, 700);
        }}
      >
        {/* Elegant Subtle Background Effects */}
        <div 
          className="pointer-events-none absolute inset-0 overflow-hidden" 
          style={{ 
            zIndex: -1,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(59, 130, 246, 0.02) 50%, rgba(147, 51, 234, 0.025) 100%)'
          }}
        >
          {/* Subtle Cursor Follow - Elegant Gradient */}
          <div 
            className="absolute"
            style={{ 
              left: `${cursor.x}px`, 
              top: `${cursor.y}px`,
              width: '500px',
              height: '500px',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(99, 102, 241, ${isDark ? 0.22 : 0.12}) 0%, rgba(99, 102, 241, ${isDark ? 0.12 : 0.06}) 30%, rgba(99, 102, 241, ${isDark ? 0.05 : 0.02}) 60%, transparent 80%)`,
              transition: 'all 0.3s ease-out',
              filter: 'blur(60px)'
            }}
          />
          
          {/* Floating Gradient 1 - Soft Movement */}
          <div
            className="absolute"
            style={{ 
              left: `${350 + Math.sin(animTime * 0.3) * 100}px`, 
              top: `${180 + Math.cos(animTime * 0.2) * 80}px`,
              width: '400px',
              height: '400px',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(ellipse, rgba(59, 130, 246, ${isDark ? 0.18 : 0.1}) 0%, rgba(59, 130, 246, ${isDark ? 0.08 : 0.04}) 50%, transparent 80%)`,
              filter: 'blur(50px)'
            }}
          />
          
          {/* Floating Gradient 2 - Elegant Motion */}
          <div
            className="absolute"
            style={{ 
              left: `${600 + Math.cos(animTime * 0.25) * 120}px`, 
              top: `${280 + Math.sin(animTime * 0.15) * 90}px`,
              width: '450px',
              height: '450px',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(ellipse, rgba(147, 51, 234, ${isDark ? 0.16 : 0.08}) 0%, rgba(147, 51, 234, ${isDark ? 0.06 : 0.03}) 60%, transparent 85%)`,
              filter: 'blur(55px)'
            }}
          />
          
          {/* Additional Subtle Layer */}
          <div
            className="absolute"
            style={{ 
              left: `${200 + Math.sin(animTime * 0.4) * 80}px`, 
              top: `${350 + Math.cos(animTime * 0.35) * 70}px`,
              width: '350px',
              height: '350px',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(79, 70, 229, ${isDark ? 0.12 : 0.06}) 0%, rgba(79, 70, 229, ${isDark ? 0.05 : 0.02}) 70%, transparent 90%)`,
              filter: 'blur(45px)'
            }}
          />
        </div>
        {/* sparkles on click - HIGHER z-index */}
        {sparkles.map((sp) => (
          <div key={sp.id} className="pointer-events-none absolute" style={{ 
            left: sp.x, 
            top: sp.y,
            zIndex: 50 // Higher than gradient blobs
          }}>
            <div className="relative">
              <span className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl animate-ping opacity-75">✨</span>
              <span className="absolute -translate-x-1/2 -translate-y-1/2 text-xl animate-pulse">⭐</span>
              <span className="absolute -translate-x-1/2 -translate-y-1/2 text-lg animate-bounce">💫</span>
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center relative" style={{ zIndex: 20 }}>
          <div className="text-sm font-medium mb-2 min-h-[20px] text-indigo-600">
            <ReactBitsTypewriter 
              words={["Selamat datang di Logyai! ✨", "Tingkatkan produktivitas logbook 🚀", "Rapi, konsisten, otomatis 📝"]}
              typeSpeed={80}
              deleteSpeed={40}
              delaySpeed={2000}
            />
          </div>
          <ReactBitsGradientText 
            className="text-4xl sm:text-5xl text-center" 
            colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981']}
            animate={true}
          >
            Catat logbook magang lebih cepat dengan bantuan AI
          </ReactBitsGradientText>
          <p className="mt-3 max-w-2xl text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-center">
            Buat entri, minta AI menulis deskripsi, simpan bukti dengan watermark, dan ekspor otomatis ke portal IPB. 
            <br />
            <ReactBitsShinyText text="Sederhana, rapi, hemat waktu." className="text-gray-800 dark:text-gray-200 font-medium" />
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onClick={openCreateModal} className="group rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              <ReactBitsShinyText text="Tambah Log" className="text-white font-semibold" />
            </button>
            <a href="#tabel" className="group rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex items-center gap-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500">
              <ClipboardIcon className="h-5 w-5" />
              <ReactBitsShinyText text="Lihat Logbook" className="text-gray-700 dark:text-gray-200 font-semibold" />
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
              🤖 Ekspor otomatis menggunakan Playwright
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
              📚 Bookmarklet tersedia untuk autofill manual
            </span>
          </div>
        </div>
      </section>

      {/* Cara Kerja */}
      {/* Tabel Logbook ringkas */}
      <section id="tabel" className="mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <ReactBitsShinyText text="Logbook kamu" className="text-gray-900 dark:text-white font-medium" />
          </h2>
          {selectedLogs.length > 0 && (
            <button
              onClick={handleBulkExport}
              className="rounded border-2 border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 hover:border-green-400 transition-colors flex items-center gap-2"
            >
              <ClipboardIcon className="h-4 w-4" />
              Ekspor {selectedLogs.length} Log
            </button>
          )}
        </div>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_16px_40px_-16px_rgba(79,70,229,0.4)] ring-1 ring-indigo-100/80 dark:bg-gray-900 dark:ring-indigo-900/30">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              <tr>
                <th className="px-4 py-4 font-medium">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-4 font-medium">Tanggal</th>
                <th className="px-4 py-4 font-medium">Waktu</th>
                <th className="hidden px-4 py-4 font-medium sm:table-cell">Jenis</th>
                <th className="px-4 py-4 font-medium">Keterangan</th>
                <th className="hidden px-4 py-4 font-medium sm:table-cell">Lokasi</th>
                <th className="hidden px-4 py-4 font-medium md:table-cell">Dosen</th>
                <th className="px-4 py-4 font-medium">Bukti</th>
                <th className="px-4 py-4"/>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {logs?.length ? (
                logs.map((l) => {
                  const jenisMap: Record<string, string> = {
                    '1': 'Pembimbingan',
                    '2': 'Ujian', 
                    '3': 'Kegiatan'
                  };
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 group">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(l.id)}
                          onChange={(e) => handleSelectLog(l.id, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(l.tanggal).toLocaleDateString('id-ID', { 
                          day: '2-digit', month: 'short', year: 'numeric' 
                        })}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{l.waktu_mulai}–{l.waktu_selesai}</td>
                      <td className="hidden px-4 py-4 text-gray-800 dark:text-gray-200 sm:table-cell">
                        {jenisMap[l.jenis_kegiatan] || l.jenis_kegiatan}
                      </td>
                      <td className="px-4 py-4 text-gray-900 dark:text-gray-100 font-medium">
                        {l.keterangan?.substring(0, 50) + '...' || '-'}
                      </td>
                      <td className="hidden px-4 py-4 text-gray-800 dark:text-gray-200 sm:table-cell">{l.lokasi}</td>
                      <td className="hidden px-4 py-4 text-gray-800 dark:text-gray-200 md:table-cell">
                        {l.dosen_penggerak || '-'}
                      </td>
                      <td className="px-4 py-4">
                        {l.bukti_path ? (
                          <img 
                            src={`/storage/${l.bukti_path}`} 
                            alt="Bukti aktivitas" 
                            className="h-8 w-8 rounded object-cover cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(`/storage/${l.bukti_path}`, '_blank')}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No image</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right relative">
                        <div 
                          className="flex gap-2 justify-end action-buttons"
                          onClick={(e) => {
                            console.log('🔴 Action container clicked:', e);
                          }}
                        >
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔴 Edit button clicked for log:', l.id);
                              openEditModal(l);
                            }} 
                            className="cursor-pointer rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/40 flex items-center gap-1 relative z-50 pointer-events-auto touch-manipulation"
                            style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                          >
                            <PencilIcon className="h-3 w-3" />
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔴 Export button clicked for log:', l.id);
                              try {
                                const response = await fetch(route('export', l.id), {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                  },
                                });
                                const data = await response.json();
                                if (data.success) {
                                  showToast('Log berhasil diantrekan untuk ekspor ke portal IPB!', 'success');
                                } else {
                                  showToast('Gagal mengekspor: ' + data.message, 'error');
                                }
                              } catch (error) {
                                console.error('Export error:', error);
                                showToast('Terjadi kesalahan saat mengekspor', 'error');
                              }
                            }}
                            className="cursor-pointer rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 hover:border-green-300 hover:shadow-sm transition-all duration-200 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/40 flex items-center gap-1 relative z-50 pointer-events-auto touch-manipulation"
                            style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                          >
                            <ClipboardIcon className="h-3 w-3" />
                            Ekspor
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔴 Delete button clicked for log:', l.id);
                              handleDeleteClick(l.id);
                            }}
                            className="cursor-pointer rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-sm transition-all duration-200 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40 flex items-center gap-1 relative z-50 pointer-events-auto touch-manipulation"
                            style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                          >
                            <XIcon className="h-3 w-3" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-600 dark:text-gray-400" colSpan={9}>
                    Belum ada data logbook. Yuk mulai tambah log pertama!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Floating help (cara kerja) toggle - KIRI BAWAH */}
      <input id="help-toggle" type="checkbox" className="peer fixed inset-0 z-30 hidden" />
      <label htmlFor="help-toggle" className="fixed bottom-6 left-6 z-40 inline-flex h-12 cursor-pointer select-none items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-bold text-white shadow-xl hover:bg-indigo-700 hover:shadow-2xl transition-all gap-2">
        <QuestionIcon className="h-5 w-5" />
        <ReactBitsShinyText text="Cara Kerja" className="text-white font-medium" />
      </label>
      <div className="pointer-events-none fixed bottom-24 left-6 z-40 w-80 translate-y-4 opacity-0 transition-all peer-checked:translate-y-0 peer-checked:opacity-100">
        <div className="pointer-events-auto rounded-xl border-2 border-gray-200 bg-white p-5 shadow-2xl ring-1 ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:ring-indigo-900/30">
          <div className="mb-3 text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📖</span>
            Cara kerja Logyai
          </div>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-gray-700 dark:text-gray-300">
            <li><span className="font-medium">Isi Form:</span> Tambah log dengan mengisi tanggal, waktu, jenis kegiatan, dosen penggerak, tipe penyelenggaraan, dan lokasi</li>
            <li><span className="font-medium">AI Saran:</span> Klik tombol "Perbaiki dengan AI" untuk mendapatkan deskripsi otomatis yang profesional</li>
            <li><span className="font-medium">Upload Bukti:</span> Upload foto/dokumen bukti aktivitas (akan otomatis diberi watermark tanggal, waktu, lokasi)</li>
            <li><span className="font-medium">Simpan & Ekspor:</span> Simpan log, lalu klik "Ekspor" untuk mengirim otomatis ke portal IPB</li>
            <li><span className="font-medium">Monitor Status:</span> Pantau status ekspor di dashboard (pending/success/failed)</li>
          </ol>
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <span className="font-medium">💡 Tips:</span> Pastikan mengisi jenis kegiatan dan dosen penggerak sebelum meminta saran AI untuk hasil yang lebih akurat.
          </div>
        </div>
      </div>

      {/* Modal Tambah Log (submit langsung dari landing) */}
      {openModal && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-3 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            // Cegah close modal saat generate
            if (isGenerating || promptLoading) {
              e.preventDefault();
              e.stopPropagation();
              showToast('Tunggu proses generate selesai', 'error');
              return;
            }
            if (e.target === e.currentTarget) {
              handleModalClose();
            }
          }}
        >
          {/* Overlay spinner saat loading */}
          {(isGenerating || promptLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50 animate-fadeIn">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
            </div>
          )}
          <div
            className="w-full max-w-6xl h-[95vh] md:h-[90vh] rounded-xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700 flex flex-col relative animate-slideUp"
            style={{
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => {
              if (isGenerating || promptLoading) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                {editingId ? (
                  <>
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <PencilIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <ReactBitsShinyText text="Edit Log" className="text-gray-900 dark:text-gray-100 font-bold" />
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <PlusIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <ReactBitsShinyText text="Tambah Log Baru" className="text-gray-900 dark:text-gray-100 font-bold" />
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={handleModalClose}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 flex items-center gap-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGenerating || promptLoading}
              >
                <XIcon className="h-5 w-5" />
                Tutup
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 h-full">
                {/* Kolom Kiri - Input Manual + AI Saran */}
                <div className="space-y-4 md:space-y-5 overflow-y-auto pr-3">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="w-3 h-8 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full shadow-sm"></div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">Input Manual</h3>
                  </div>
                  
                  <form
                    onSubmit={(e) => {
                      if (isGenerating || promptLoading) {
                        e.preventDefault();
                        e.stopPropagation();
                        showToast('Tunggu proses generate selesai sebelum menyimpan!', 'error');
                        return;
                      }
                      e.preventDefault();
                      console.log('🔴 Form submitted', { editingId, formData: form.data });
                      console.log('Form submission stack trace:', new Error().stack);
                      console.log('Form submission target:', e.target);
                      console.log('Form submission currentTarget:', e.currentTarget);
                      console.log('Form submission event type:', e.type);
                      console.log('Form submission bubbles:', e.bubbles);
                      console.log('Form submission cancelable:', e.cancelable);
                      
                      // Manual validation untuk semua field required
                      const requiredFields = [
                        { field: 'tanggal', label: 'Tanggal' },
                        { field: 'waktu_mulai', label: 'Waktu Mulai' },
                        { field: 'waktu_selesai', label: 'Waktu Selesai' },
                        { field: 'jenis_kegiatan', label: 'Jenis Kegiatan' },
                        { field: 'dosen_penggerak', label: 'Dosen Penggerak' },
                        { field: 'lokasi', label: 'Lokasi' },
                        { field: 'keterangan', label: 'Keterangan' }
                      ];
                      
                      const missingFields = requiredFields.filter(({ field }) => !form.data[field as keyof typeof form.data]);
                      
                      if (missingFields.length > 0) {
                        const fieldLabels = missingFields.map(f => f.label).join(', ');
                        showToast(`Field berikut harus diisi: ${fieldLabels}`, 'error');
                        console.log('🔴 Form validation failed:', missingFields);
                        return;
                      }
                      
                      // Validasi bukti hanya untuk create baru, bukan edit
                      if (!editingId && !form.data.bukti && !isGenerating && !promptLoading) {
                        showToast('Bukti aktivitas harus diisi sebelum menyimpan', 'error');
                        console.log('🔴 Form validation failed: bukti aktivitas required for create');
                        return;
                      }
                      
                      // Untuk edit, pastikan ada bukti sebelumnya atau bukti baru
                      if (editingId && !form.data.bukti && !imagePreview) {
                        showToast('Bukti aktivitas harus diisi atau gunakan bukti yang sudah ada', 'error');
                        console.log('🔴 Form validation failed: bukti aktivitas required for edit');
                        return;
                      }
                      
                      if (editingId) {
                        console.log('🔴 Submitting update for log ID:', editingId);
                        console.log('🔴 Form data for update:', form.data);
                        
                        // Untuk edit, jika tidak ada bukti baru, gunakan bukti yang sudah ada
                        const formDataForUpdate = { ...form.data };
                        if (!formDataForUpdate.bukti && imagePreview) {
                          // Jika ada imagePreview tapi tidak ada bukti file, berarti menggunakan bukti existing
                          formDataForUpdate.bukti = null; // Set null agar tidak required
                        }
                        
                        form.put(route('update', editingId), {
                          preserveScroll: true,
                          preserveState: true, // Mencegah form reset otomatis
                          onSuccess: () => {
                            console.log('🔴 Update success!');
                            showToast('Logbook berhasil diperbarui dengan Gemini AI! ✨', 'success');
                            
                            // Simpan data form sementara sebelum form di-reset
                            setTempFormData({ ...form.data });
                            
                            // Tutup modal hanya jika bukan proses generate
                            if (!isGenerating && !promptLoading) {
                              setOpenModal(false);
                            } else {
                              // Jika masih dalam proses generate, restore data yang hilang
                              setTimeout(() => {
                                console.log('🔴 Restoring form data after successful update:', tempFormData);
                                if (tempFormData) {
                                  // Pastikan semua field required ada sebelum restore
                                  const dataToRestore = {
                                    tanggal: tempFormData.tanggal || '',
                                    waktu_mulai: tempFormData.waktu_mulai || '08:30',
                                    waktu_selesai: tempFormData.waktu_selesai || '17:30',
                                    jenis_kegiatan: tempFormData.jenis_kegiatan || '',
                                    dosen_penggerak: tempFormData.dosen_penggerak || '',
                                    tipe_penyelenggaraan: tempFormData.tipe_penyelenggaraan || 'hybrid',
                                    lokasi: tempFormData.lokasi || '',
                                    judul: tempFormData.judul || '',
                                    keterangan: tempFormData.keterangan || '',
                                    bukti: tempFormData.bukti || null,
                                    return_home: tempFormData.return_home ?? true,
                                  };
                                  form.setData(dataToRestore);
                                }
                              }, 100);
                            }
                          },
                          onError: (errors) => {
                            console.error('🔴 Update errors:', errors);
                            showToast('Gagal memperbarui logbook dengan Gemini AI. Silakan cek kembali data yang diisi.', 'error');
                          },
                          forceFormData: true,
                        });
                      } else {
                        console.log('🔴 Submitting create for new log');
                        console.log('🔴 Form data for create:', form.data);
                        
                        form.post(route('store'), {
                          preserveScroll: true,
                          preserveState: true, // Mencegah form reset otomatis
                          onSuccess: () => {
                            console.log('🔴 Create success!');
                            showToast('Logbook berhasil dibuat dengan Gemini AI! 🎉', 'success');
                            
                            // Simpan data form sementara sebelum form di-reset
                            setTempFormData({ ...form.data });
                            
                            // Tutup modal hanya jika bukan proses generate
                            if (!isGenerating && !promptLoading) {
                              setOpenModal(false);
                            } else {
                              // Jika masih dalam proses generate, restore data yang hilang
                              setTimeout(() => {
                                console.log('🔴 Restoring form data after successful submit:', tempFormData);
                                if (tempFormData) {
                                  // Pastikan semua field required ada sebelum restore
                                  const dataToRestore = {
                                    tanggal: tempFormData.tanggal || '',
                                    waktu_mulai: tempFormData.waktu_mulai || '08:30',
                                    waktu_selesai: tempFormData.waktu_selesai || '17:30',
                                    jenis_kegiatan: tempFormData.jenis_kegiatan || '',
                                    dosen_penggerak: tempFormData.dosen_penggerak || '',
                                    tipe_penyelenggaraan: tempFormData.tipe_penyelenggaraan || 'hybrid',
                                    lokasi: tempFormData.lokasi || '',
                                    keterangan: tempFormData.keterangan || '',
                                    bukti: tempFormData.bukti || null,
                                    return_home: tempFormData.return_home ?? true,
                                  };
                                  form.setData(dataToRestore);
                                }
                              }, 100);
                            }
                          },
                          onError: (errors) => {
                            console.error('🔴 Create errors:', errors);
                            showToast('Gagal membuat logbook dengan Gemini AI. Silakan cek kembali data yang diisi.', 'error');
                          },
                          forceFormData: true,
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter key
                      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔴 Prevented form submission on Enter key');
                      }
                    }}
                    onChange={(e) => {
                      // Prevent any form changes from triggering submission
                      console.log('🔴 Form changed, preventing auto-submission');
                      console.log('🔴 Form change event:', e.type, e.target);
                    }}
                    id="log-form"
                    key={formKey} // Force re-render dengan key
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Tanggal</label>
                        <input 
                          type="date" 
                          className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30" 
                          value={form.data.tanggal || aiGeneratedData?.tanggal || ''} 
                          onChange={(e) => form.setData('tanggal', e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Jenis Kegiatan <span className="text-red-500 font-bold">*</span></label>
                        <select 
                          className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30" 
                          value={form.data.jenis_kegiatan || aiGeneratedData?.jenis_kegiatan || ''} 
                          onChange={(e) => form.setData('jenis_kegiatan', e.target.value)} 
                          required
                        >
                          <option value="">-- Pilih Jenis Kegiatan --</option>
                          {jenisKegiatanOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Waktu Mulai</label>
                        <input 
                          type="time" 
                          className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30" 
                          value={form.data.waktu_mulai} 
                          onChange={(e) => form.setData('waktu_mulai', e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Waktu Selesai</label>
                        <input 
                          type="time" 
                          className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30" 
                          value={form.data.waktu_selesai} 
                          onChange={(e) => form.setData('waktu_selesai', e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Dosen Penggerak <span className="text-red-500 font-bold">*</span></label>
                        <select 
                          className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30" 
                          value={form.data.dosen_penggerak || aiGeneratedData?.dosen_penggerak || ''} 
                          onChange={(e) => form.setData('dosen_penggerak', e.target.value)} 
                          required
                        >
                          <option value="">-- Pilih Dosen Penggerak --</option>
                          {dosenPenggerakOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Lokasi</label>
                        <input 
                          className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30" 
                          placeholder="Masukkan lokasi kegiatan" 
                          value={form.data.lokasi || aiGeneratedData?.lokasi || ''} 
                          onChange={(e) => form.setData('lokasi', e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Tipe Penyelenggaraan</label>
                      <div className="flex gap-4 text-sm">
                        {(['hybrid','offline','online'] as const).map(t => (
                          <label key={t} className="inline-flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="tipe" 
                              value={t} 
                              checked={(form.data.tipe_penyelenggaraan || aiGeneratedData?.tipe_penyelenggaraan)===t} 
                              onChange={(e)=>form.setData('tipe_penyelenggaraan', e.target.value as 'hybrid' | 'offline' | 'online')} 
                              className="w-4 h-4 text-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all duration-200" 
                            />
                            <span className="capitalize font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 transition-colors duration-200">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Keterangan <span className="text-red-500 font-bold">*</span></label>
                      {showSkeleton ? (
                        <div className="space-y-3">
                          <div className="w-full h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"></div>
                          <div className="w-full h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"></div>
                          <div className="w-3/4 h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"></div>
                        </div>
                      ) : (
                        <textarea 
                          className="w-full rounded-xl border-2 border-gray-200 p-3 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30 resize-none" 
                          placeholder="Jelaskan detail kegiatan yang dilakukan, tujuan, dan hasil yang dicapai" 
                          rows={4} 
                          value={form.data.keterangan || aiGeneratedData?.keterangan || ''} 
                          onChange={(e) => form.setData('keterangan', e.target.value)} 
                          required 
                        />
                      )}
                      <div className="flex gap-3">
                        <AISuggestionButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            askAI(e);
                          }}
                          isLoading={aiSuggestionLoading}
                          disabled={isGenerating || aiSuggestionLoading}
                          loadingText="Memperbaiki..."
                          buttonText="Perbaiki dengan AI"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Bukti Aktivitas
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          capture="environment"
                          className="flex-1 rounded-xl border-2 border-gray-300 bg-white p-3 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400 dark:file:bg-indigo-600 dark:file:text-white"
                          onChange={(e) => handleImage(e)}
                        />
                        <button 
                          type="button" 
                          onClick={openCamera} 
                          className="whitespace-nowrap rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:shadow-gray-900/20"
                        >
                          <CameraIcon className="h-5 w-5" />
                          <ReactBitsShinyText text="Kamera" className="text-gray-700 dark:text-gray-300 font-semibold" />
                        </button>
                      </div>
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="mt-4 relative group">
                          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-lg">
                            <img 
                              src={imagePreview} 
                              alt="Preview bukti" 
                              className="w-full max-w-xs object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              form.setData('bukti', null);
                            }}
                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-lg"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* Kolom Kanan - Prompt Input */}
                <div className="space-y-4 md:space-y-5 overflow-y-auto pr-3">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="w-3 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full shadow-sm"></div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">Prompt Input</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        💬 Ceritakan Aktivitas Anda Hari Ini
                        <span className="block text-xs font-normal text-gray-600 dark:text-gray-400 mt-1">
                          AI akan mengubahnya menjadi logbook aktivitas yang profesional
                        </span>
                      </label>
                      <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Contoh: Hari ini saya coding fitur login untuk sistem HRIS di Telkomsigma pakai React dan Laravel. Saya buat komponen authentication, integrasi API backend, dan testing di berbagai browser. Akhirnya berhasil dan bisa login dengan smooth."
                        rows={6}
                        className="w-full rounded-xl border-2 border-gray-300 p-4 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-green-400 dark:focus:ring-green-900/30 resize-none shadow-sm"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      {/* Tombol Generate Logbook (bukan submit) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔴 Generate dengan Gemini AI button clicked');
                          generateFromPrompt(e);
                        }}
                        disabled={isGenerating || promptLoading}
                        className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 text-sm font-bold text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-md"
                      >
                        <SaveIcon className="h-5 w-5" />
                        {promptLoading ? 'Generating dengan Gemini AI...' : 'Generate dengan Gemini AI'}
                      </button>
                      {/* Tombol Clear Prompt */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔴 Clear button clicked');
                          clearPrompt(e);
                        }}
                        className="rounded-xl border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:shadow-gray-900/20"
                      >
                        Clear
                      </button>
                    </div>
                    
                      <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-xl p-5 border-2 border-indigo-300 dark:border-indigo-600 shadow-md">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                          Tips Penggunaan Gemini AI:
                        </h4>
                        <ul className="text-sm text-gray-800 dark:text-indigo-100 space-y-2 font-semibold">
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-300 mt-1 font-bold">•</span>
                            <span>Ketikkan deskripsi kegiatan dalam bahasa natural</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-300 mt-1 font-bold">•</span>
                            <span>Gemini AI akan otomatis membuat deskripsi yang profesional</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-300 mt-1 font-bold">•</span>
                            <span>Deskripsi akan dibuat lengkap, detail, dan formal</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-300 mt-1 font-bold">•</span>
                            <span>Anda bisa edit hasil generate sebelum simpan</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-300 mt-1 font-bold">•</span>
                            <span>Gunakan kata kunci spesifik untuk hasil yang lebih akurat</span>
                          </li>
                        </ul>
                      </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-4 dark:bg-gray-900 dark:border-gray-700">
              {/* Tombol Batal */}
              <button 
                type="button" 
                onClick={handleModalClose} 
                className="rounded-xl border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:shadow-gray-900/20" 
                disabled={isGenerating || promptLoading}
              >
                <XIcon className="h-5 w-5" />
                Batal
              </button>
              {/* Tombol Simpan Logbook (submit) */}
              <button
                type="submit"
                form="log-form"
                disabled={form.processing || !isFormValid() || isGenerating}
                onClick={() => {
                  if (!isFormValid()) {
                    showToast('Lengkapi semua field yang diperlukan sebelum menyimpan', 'error');
                  }
                }}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 ease-out flex items-center gap-3"
              >
                <SaveIcon className="h-5 w-5" />
                <ReactBitsShinyText text={form.processing ? 'Menyimpan...' : 'Simpan'} className="text-white font-semibold" />
              </button>
            </div>
          </div>
        </div>
      )}

            {/* Camera Modal */}
      {cameraOpen && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black p-0 md:p-4" 
          role="dialog" 
          aria-modal="true"
          onClick={(e) => {
            // Close modal when clicking outside (only on desktop)
            if (e.target === e.currentTarget && window.innerWidth > 768) {
              closeCameraModal();
            }
          }}
        >
          <div className="w-full h-full md:h-auto md:max-w-lg md:rounded-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="h-full flex flex-col md:p-6">
              <div className="flex items-center justify-between p-4 md:p-0 md:mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ambil Foto</h3>
                <button 
                  onClick={closeCameraModal} 
                  className="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  type="button"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              
              {stream ? (
                <div className="flex-1 flex flex-col space-y-4 p-4 md:p-0">
                  <div className="flex-1 relative">
                                        <video
                      id="camera-video"
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-lg bg-gray-100 dark:bg-gray-800"
                      onError={(e) => {
                        console.error('Video error:', e);
                        closeCameraModal();
                      }}
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg pointer-events-none"></div>
                  </div>
                  
                  <div className="flex gap-3 justify-center pb-4 md:pb-0">
                    <button
                      onClick={capturePhoto}
                      disabled={!videoReady || locationLoading}
                      className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      type="button"
                    >
                      <CameraIcon className="h-5 w-5" />
                      {locationLoading ? 'Mengambil Lokasi...' : (videoReady ? 'Ambil Foto' : 'Menyiapkan Kamera...')}
                    </button>
                    <button
                      onClick={closeCameraModal}
                      className="rounded-lg border-2 border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 flex items-center gap-2"
                      type="button"
                    >
                      <XIcon className="h-5 w-5" />
                      Batal
                    </button>
                        </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-8">
                    {cameraSupported ? (
                      <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Mengakses kamera...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CameraIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Kamera tidak tersedia</p>
                      </>
                    )}
                    
                    {/* Fallback upload option */}
                    <div className="mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Upload foto dari galeri:</p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImage}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Konfirmasi Hapus</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Apakah Anda yakin ingin menghapus log ini? Data yang dihapus tidak dapat dipulihkan.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
                        </div>
                </div>
            </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[1000] rounded-xl border-2 px-5 py-4 shadow-2xl transition-all duration-300 backdrop-blur-sm ${
          toast.type === 'success'
            ? 'bg-green-100 border-green-400 text-green-900 dark:bg-green-900/80 dark:border-green-500 dark:text-green-100'
            : 'bg-red-100 border-red-400 text-red-900 dark:bg-red-900/80 dark:border-red-500 dark:text-red-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-600 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="font-medium">© {new Date().getFullYear()} Logyai</div>
          <div>
            <a href="#tabel" className="font-medium hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
              <ClipboardIcon className="h-4 w-4" />
              <ReactBitsShinyText text="Dashboard Logbook" className="text-gray-700 dark:text-gray-300 font-medium" />
            </a>
            </div>
        </div>
      </footer>

      {/* Floating Button - Chatbot AI (Kanan Bawah) */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
        title="Chat dengan AI"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
            {chatMessages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>

      {/* Floating Chatbot Component */}
      <FloatingChatbot
        showChatbot={showChatbot}
        setShowChatbot={setShowChatbot}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        sendChatMessage={sendChatMessage}
        clearChat={clearChat}
        chatEndRef={chatEndRef}
      />
    </div>
    );
}


