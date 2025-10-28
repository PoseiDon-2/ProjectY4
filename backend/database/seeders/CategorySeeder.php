<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['id' => 'disaster', 'name' => 'ภัยพิบัติ'],
            ['id' => 'medical', 'name' => 'การแพทย์'],
            ['id' => 'education', 'name' => 'การศึกษา'],
            ['id' => 'animal', 'name' => 'สัตว์'],
            ['id' => 'environment', 'name' => 'สิ่งแวดล้อม'],
            ['id' => 'elderly', 'name' => 'ผู้สูงอายุ'],
            ['id' => 'children', 'name' => 'เด็กและเยาวชน'],
            ['id' => 'disability', 'name' => 'ผู้พิการ'],
            ['id' => 'community', 'name' => 'ชุมชน'],
            ['id' => 'religion', 'name' => 'ศาสนา'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['id' => $category['id']],
                ['name' => $category['name']]
            );
        }

        $this->command->info('Categories seeded successfully!');
    }
}
