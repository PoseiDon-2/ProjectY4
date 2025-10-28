<?php
namespace App\Enums;

enum OrganizationType: string {
    case NGO = 'NGO';
    case CHARITY = 'CHARITY';
    case FOUNDATION = 'FOUNDATION';
    case GOVERNMENT = 'GOVERNMENT';
    case TEMPLE = 'TEMPLE';
    case OTHER = 'OTHER';
}
