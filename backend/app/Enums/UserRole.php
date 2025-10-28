<?php

namespace App\Enums;

enum UserRole: string { 
    case DONOR = 'DONOR';
    case ORGANIZER = 'ORGANIZER';
    case ADMIN = 'ADMIN';
}
