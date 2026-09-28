<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AcceptInvitationAction
{
    /**
     * Accept invitation and set password.
     */
    public function execute(User $user, string $password): User
    {
        $user->forceFill([
            'password' => Hash::make($password),
            'status' => 'active',
            'email_verified_at' => now(),
        ])->save();

        return $user;
    }
}
