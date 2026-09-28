<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UploadAvatarAction
{
    /**
     * Upload avatar image and update user avatar_url.
     */
    public function execute(User $employee, UploadedFile $file): User
    {
        // Delete old avatar file if present
        if ($employee->avatar_url && str_contains($employee->avatar_url, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $employee->avatar_url);
            Storage::disk('public')->delete($oldPath);
        }

        // Store new image in public disk under avatars folder
        $filename = $employee->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars', $filename, 'public');

        $avatarUrl = Storage::url($path);

        $employee->update([
            'avatar_url' => $avatarUrl,
        ]);

        return $employee;
    }
}
