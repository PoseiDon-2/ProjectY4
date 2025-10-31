<?php

namespace App\Enums;

enum StoryType: string
{
    case PROGRESS = 'progress';
    case MILESTONE = 'milestone';
    case THANK_YOU = 'thank_you';
    case COMPLETION = 'completion';

    public function label(): string
    {
        return match ($this) {
            self::PROGRESS => 'ความคืบหน้า',
            self::MILESTONE => 'เหตุการณ์สำคัญ',
            self::THANK_YOU => 'ขอบคุณ',
            self::COMPLETION => 'เสร็จสิ้น',
        };
    }
}
