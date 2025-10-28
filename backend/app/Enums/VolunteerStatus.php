<?php
namespace App\Enums;

enum VolunteerStatus: string {
    case APPLIED = 'APPLIED';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case COMPLETED = 'COMPLETED';
}