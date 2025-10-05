<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\LogEntry;

Route::get('/', function () {
    $logs = LogEntry::orderByDesc('tanggal')->orderByDesc('id')->limit(50)->get();
    

    
    return Inertia::render('welcome', [
        'logs' => $logs,
    ]);
})->name('home');

Route::post('/ai/suggest', [\App\Http\Controllers\AIController::class, 'generateSuggestion'])->name('ai.suggest');
Route::post('/ai/auto-fill', [\App\Http\Controllers\AIController::class, 'autoFillFromTitle'])->name('ai.autofill');
Route::post('/ai/chatbot', [\App\Http\Controllers\AIController::class, 'chatbot'])->name('ai.chatbot');
Route::get('/ai/test', [\App\Http\Controllers\AIController::class, 'testGemini'])->name('ai.test');

Route::controller(\App\Http\Controllers\LogEntryController::class)
    ->group(function () {
        // Semua operasi CRUD di root /
        Route::post('/store', 'store')->name('store');
        Route::match(['PUT', 'PATCH'], '/update/{log}', 'update')->name('update');
        Route::delete('/delete/{log}', 'destroy')->name('destroy');
    });

Route::post('/export/{log}', [\App\Http\Controllers\ExportController::class, 'export'])->name('export');
