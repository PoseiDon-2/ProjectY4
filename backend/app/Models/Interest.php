<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Interest extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'interests';

    protected $fillable = ['id', 'label', 'description', 'icon', 'category'];

    public function userInterests(): HasMany
    {
        return $this->hasMany(UserInterest::class, 'interest_id');
    }
}