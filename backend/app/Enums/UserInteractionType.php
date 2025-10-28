<?php
namespace App\Enums;
enum UserInteractionType: string {
    case VIEW = 'VIEW';
    case FAVORITE = 'FAVORITE';
    case SHARE = 'SHARE';
    case SKIP = 'SKIP';
}
