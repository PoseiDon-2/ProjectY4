<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'categories';

    protected $fillable = ['id', 'name'];

    public function donationRequests(): HasMany
    {
        return $this->hasMany(DonationRequest::class, 'category_id');
    }

    public function relatedCategoriesAsMain(): HasMany
    {
        return $this->hasMany(RelatedCategory::class, 'category_id');
    }

    public function relatedCategoriesAsRelated(): HasMany
    {
        return $this->hasMany(RelatedCategory::class, 'related_category_id');
    }

    public function userInterests(): HasMany
    {
        return $this->hasMany(UserInterest::class, 'category_id');
    }
}