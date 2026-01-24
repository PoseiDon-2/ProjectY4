<?php

namespace App\Enums;

enum UserInteractionType: string
{
    case SWIPE_LIKE = 'swipe_like';
    case SWIPE_PASS = 'swipe_pass';
    case CLICK_DETAIL = 'click_detail';
    case VIEW_STORY = 'view_story';
    
    // Optional: ถ้าต้องการ grouping
    public function getCategory(): string
    {
        return match($this) {
            self::SWIPE_LIKE, self::SWIPE_PASS => 'swipe',
            self::CLICK_DETAIL => 'click',
            self::VIEW_STORY => 'view',
        };
    }
}