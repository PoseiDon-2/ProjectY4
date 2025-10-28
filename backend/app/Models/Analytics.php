<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Analytics extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'analytics';
    public $timestamps = false;

    protected $fillable = ['id', 'metric', 'value', 'created_at'];
}