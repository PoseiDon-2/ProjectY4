<?php
namespace App\Enums;

enum OrganizationType: string {
    case SCHOOL = 'school';
    case HOSPITAL = 'hospital';
    case TEMPLE = 'temple';
    case FOUNDATION = 'foundation';
    case NGO = 'ngo';
    case COMMUNITY = 'community';
    case GOVERNMENT = 'government';
    case ELDERLY = 'elderly';
    case ORPHANAGE = 'orphanage';
    case DISABILITY = 'disability';
    case CHARITY = 'charity';
    case OTHER = 'other';
}
