<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrustLevelConfig extends Model
{
    protected $table = 'trust_level_config';

    protected $fillable = ['role', 'level', 'name', 'min_score', 'sort_order'];

    protected $casts = [
        'level' => 'integer',
        'min_score' => 'integer',
        'sort_order' => 'integer',
    ];

    public const ROLE_DONOR = 'donor';
    public const ROLE_ORGANIZER = 'organizer';
}
