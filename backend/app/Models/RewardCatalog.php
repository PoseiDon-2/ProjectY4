<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardCatalog extends Model
{
    protected $table = 'reward_catalog';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'description',
        'category',
        'points_cost',
        'image',
        'is_active',
        'is_limited',
        'limit_quantity',
        'remaining_quantity',
        'requirements',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_limited' => 'boolean',
        'requirements' => 'array',
    ];

    public const CATEGORY_PROFILE = 'profile';
    public const CATEGORY_BADGE = 'badge';
    public const CATEGORY_FEATURE = 'feature';
    public const CATEGORY_PHYSICAL = 'physical';
}
