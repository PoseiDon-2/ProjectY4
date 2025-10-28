<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RelatedCategory extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'related_categories';
    public $timestamps = false;

    protected $fillable = ['id', 'category_id', 'related_category_id', 'similarity'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function relatedCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'related_category_id');
    }
}