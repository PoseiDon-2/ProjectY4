<?php

namespace App\Http\Controllers; // หากใช้โฟลเดอร์ Api ให้เปลี่ยนเป็น App\Http\Controllers\Api

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // สมมติว่าคุณมีฟังก์ชันดึงข้อมูล (GET) อยู่แล้ว
    public function index()
    {
        return response()->json(Category::all());
    }

    // นำฟังก์ชันของคุณมาใส่ตรงนี้
    public function store(Request $request)
    {
        // ตรวจสอบความถูกต้องของข้อมูล (Validation)
        $request->validate([
            'id' => 'required|string|unique:categories,id',
            'name' => 'required|string|unique:categories,name',
        ]);

        // บันทึกลงตาราง categories
        $category = Category::create([
            'id' => $request->id,
            'name' => $request->name,
        ]);

        // ส่งข้อมูลที่เพิ่งสร้างกลับไปให้ Frontend
        return response()->json($category, 201);
    }
}
