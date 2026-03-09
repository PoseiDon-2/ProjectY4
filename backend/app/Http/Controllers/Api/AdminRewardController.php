<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RewardCatalog;
use Illuminate\Http\Request;

class AdminRewardController extends Controller
{
    /**
     * GET /admin/rewards - ดึงรายการรางวัลทั้งหมด (สำหรับแอดมิน)
     */
    public function index()
    {
        $items = RewardCatalog::orderBy('created_at', 'desc')->get();

        $data = $items->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'description' => $r->description,
            'category' => $r->category,
            'pointsCost' => (int) $r->points_cost,
            'image' => $r->image,
            'isActive' => (bool) $r->is_active,
            'isLimited' => (bool) $r->is_limited,
            'limitQuantity' => $r->limit_quantity,
            'remainingQuantity' => $r->remaining_quantity,
            'requirements' => $r->requirements ?? (object) [],
            'createdBy' => 'admin',
            'createdAt' => $r->created_at?->toIso8601String(),
        ])->values()->all();

        return response()->json($data);
    }

    /**
     * POST /admin/rewards - สร้างรางวัลใหม่
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/'],
            'profileType' => ['nullable', 'string', 'in:theme,badge,frame,title'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'in:profile,badge,feature,physical'],
            'pointsCost' => ['required', 'integer', 'min:0'],
            'image' => ['nullable', 'string', 'max:500'],
            'isActive' => ['boolean'],
            'isLimited' => ['boolean'],
            'limitQuantity' => ['nullable', 'integer', 'min:0'],
            'remainingQuantity' => ['nullable', 'integer', 'min:0'],
            'requirements' => ['nullable', 'array'],
            'requirements.minLevel' => ['nullable', 'integer', 'min:0'],
            'requirements.minDonations' => ['nullable', 'integer', 'min:0'],
            'requirements.gradient' => ['nullable', 'string', 'max:255'],
            'requirements.icon' => ['nullable', 'string', 'max:255'],
            'requirements.preview' => ['nullable', 'string', 'max:500'],
            'requirements.displayText' => ['nullable', 'string', 'max:255'],
        ]);

        $id = null;
        if (! empty($validated['id'])) {
            if (RewardCatalog::find($validated['id'])) {
                return response()->json(['message' => 'ID รางวัลนี้มีอยู่แล้ว'], 422);
            }
            $id = $validated['id'];
        }
        if (! $id && ($validated['category'] ?? '') === 'profile' && ! empty($validated['profileType'] ?? null)) {
            $prefix = $validated['profileType'];
            $slug = preg_replace('/[^a-z0-9_]/', '', str_replace(' ', '_', strtolower($validated['name'])));
            if ($slug === '') {
                $slug = substr(md5(uniqid((string) mt_rand(), true)), 0, 8);
            }
            $baseId = $prefix . '_' . $slug;
            $id = $baseId;
            $n = 1;
            while (RewardCatalog::find($id)) {
                $id = $baseId . '_' . (++$n);
            }
        }
        if (! $id) {
            $id = 'reward_' . uniqid() . '_' . substr(md5(uniqid()), 0, 8);
        }

        $isLimited = (bool) ($validated['isLimited'] ?? false);
        $limitQty = $isLimited && isset($validated['limitQuantity']) ? (int) $validated['limitQuantity'] : null;
        $remainingQty = $isLimited && isset($validated['remainingQuantity']) ? (int) $validated['remainingQuantity'] : $limitQty;

        RewardCatalog::create([
            'id' => $id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'points_cost' => (int) $validated['pointsCost'],
            'image' => $validated['image'] ?? null,
            'is_active' => (bool) ($validated['isActive'] ?? true),
            'is_limited' => $isLimited,
            'limit_quantity' => $limitQty,
            'remaining_quantity' => $remainingQty,
            'requirements' => $validated['requirements'] ?? null,
        ]);

        return response()->json(['message' => 'สร้างรางวัลสำเร็จ', 'id' => $id], 201);
    }

    /**
     * PUT /admin/rewards/{id} - แก้ไขรางวัล
     */
    public function update(Request $request, string $id)
    {
        $item = RewardCatalog::find($id);
        if (!$item) {
            return response()->json(['message' => 'ไม่พบรางวัล'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'in:profile,badge,feature,physical'],
            'pointsCost' => ['sometimes', 'integer', 'min:0'],
            'image' => ['nullable', 'string', 'max:500'],
            'isActive' => ['boolean'],
            'isLimited' => ['boolean'],
            'limitQuantity' => ['nullable', 'integer', 'min:0'],
            'remainingQuantity' => ['nullable', 'integer', 'min:0'],
            'requirements' => ['nullable', 'array'],
            'requirements.gradient' => ['nullable', 'string', 'max:255'],
            'requirements.icon' => ['nullable', 'string', 'max:255'],
            'requirements.preview' => ['nullable', 'string', 'max:500'],
            'requirements.displayText' => ['nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('name', $validated)) {
            $item->name = $validated['name'];
        }
        if (array_key_exists('description', $validated)) {
            $item->description = $validated['description'];
        }
        if (array_key_exists('category', $validated)) {
            $item->category = $validated['category'];
        }
        if (array_key_exists('pointsCost', $validated)) {
            $item->points_cost = (int) $validated['pointsCost'];
        }
        if (array_key_exists('image', $validated)) {
            $item->image = $validated['image'];
        }
        if (array_key_exists('isActive', $validated)) {
            $item->is_active = (bool) $validated['isActive'];
        }
        if (array_key_exists('isLimited', $validated)) {
            $item->is_limited = (bool) $validated['isLimited'];
        }
        if (array_key_exists('limitQuantity', $validated)) {
            $item->limit_quantity = $validated['limitQuantity'];
        }
        if (array_key_exists('remainingQuantity', $validated)) {
            $item->remaining_quantity = $validated['remainingQuantity'];
        }
        if (array_key_exists('requirements', $validated)) {
            $item->requirements = $validated['requirements'];
        }
        $item->save();

        return response()->json(['message' => 'อัปเดตรางวัลเรียบร้อย']);
    }

    /**
     * DELETE /admin/rewards/{id} - ลบรางวัล
     */
    public function destroy(string $id)
    {
        $item = RewardCatalog::find($id);
        if (!$item) {
            return response()->json(['message' => 'ไม่พบรางวัล'], 404);
        }
        $item->delete();
        return response()->json(['message' => 'ลบรางวัลเรียบร้อย']);
    }
}
