<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Gemini API Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi untuk Gemini AI API dari Google
    |
    */

    'api_key' => env('GEMINI_API_KEY', 'AIzaSyByUvTf0fojvTSRQupgwtzw4DvmrsS4ANM'),
    
    'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
    
    'model' => 'gemini-2.0-flash',
    
    'timeout' => 30,
    
    'max_tokens' => 1500, // Increased for better responses
    
    'temperature' => 0.7, // Increased for more creativity
    
    'top_k' => 40,
    
    'top_p' => 0.9, // Slightly reduced for better consistency
];
