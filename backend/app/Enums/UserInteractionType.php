<?php

namespace App\Enums;

enum UserInteractionType: int
{
    case SWIPE_LIKE = 1;
    case SWIPE_PASS = 2;
    case CLICK_DETAIL = 3;
    case VIEW_STORY = 4;

    // Optional: ถ้าต้องการ grouping
    public function getCategory(): string
    {
        return match ($this) {
            self::SWIPE_LIKE, self::SWIPE_PASS => 'swipe',
            self::CLICK_DETAIL => 'click',
            self::VIEW_STORY => 'view',
        };
    }
    public function label(): string
    {
        return match($this) {
            self::SWIPE_LIKE => 'Like',
            self::SWIPE_PASS => 'Pass',
            self::CLICK_DETAIL => 'Click Detail',
            self::VIEW_STORY => 'View Story',
        };
    }
}
