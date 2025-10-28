<?php
namespace App\Enums;

enum DonationType: string {
    case MONEY = 'MONEY';
    case ITEMS = 'ITEMS';
    case VOLUNTEER = 'VOLUNTEER';
}