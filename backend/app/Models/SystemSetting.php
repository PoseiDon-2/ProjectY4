<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'system_settings';

    protected $fillable = ['id', 'key', 'value'];
}