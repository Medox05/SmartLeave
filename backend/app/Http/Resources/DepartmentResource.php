<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'manager_id' => $this->manager_id,
            'manager' => $this->relationLoaded('manager') && $this->manager ? [
                'id' => $this->manager->id,
                'name' => $this->manager->name,
                'email' => $this->manager->email,
                'avatar_url' => $this->manager->avatar_url,
            ] : null,
            'users_count' => $this->whenCounted('users', $this->users_count ?? 0),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
