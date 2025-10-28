<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserInterest extends Model
{
    protected $table = 'user_interests';
    public $timestamps = false;

    protected $fillable = ['user_id', 'interest_id', 'category_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function interest(): BelongsTo
    {
        return $this->belongsTo(Interest::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}