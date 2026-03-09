<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationSlip;
use App\Models\ItemDonation;
use App\Models\VolunteerApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Pagination\LengthAwarePaginator;

class DonationHistoryController extends Controller
{
    /**
     * ประวัติบริจาครวมของ user (เงิน + ของ + แรง) พร้อมฟีเตอร์และ pagination
     */
    public function index(Request $request)
    {
        $userId = Auth::id();
        $type = $request->query('type'); // money | item | volunteer
        $dateFrom = $request->query('date_from'); // YYYY-MM-DD
        $dateTo = $request->query('date_to');
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min(50, $perPage));
        $page = max(1, (int) $request->query('page', 1));

        $baseUrl = request()->getSchemeAndHttpHost();

        $entries = collect();

        if (!$type || $type === 'money') {
            $slipsQuery = DonationSlip::query()
                ->where('donor_id', $userId)
                ->with(['donationRequest:id,title']);

            if ($dateFrom) {
                $slipsQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $slipsQuery->whereDate('created_at', '<=', $dateTo);
            }

            $slips = $slipsQuery->orderByDesc('created_at')->get();

            foreach ($slips as $s) {
                $entries->push([
                    'id' => 'slip_' . $s->id,
                    'history_type' => 'money',
                    'date' => $s->created_at->toIso8601String(),
                    'project' => $s->donationRequest ? [
                        'id' => $s->donationRequest->id,
                        'title' => $s->donationRequest->title,
                    ] : null,
                    'amount' => (float) $s->amount,
                    'payment_method' => $s->payment_method,
                    'slip_url' => $s->slip_path ? $baseUrl . '/storage/' . $s->slip_path : null,
                    'status' => $s->status,
                ]);
            }
        }

        if (!$type || $type === 'item') {
            $itemsQuery = ItemDonation::query()
                ->where('donor_id', $userId)
                ->with(['donationRequest:id,title']);

            if ($dateFrom) {
                $itemsQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $itemsQuery->whereDate('created_at', '<=', $dateTo);
            }

            $items = $itemsQuery->orderByDesc('created_at')->get();

            foreach ($items as $item) {
                $images = $item->evidence_images ?? [];
                $imageUrls = array_map(function ($path) use ($baseUrl) {
                    if (is_string($path) && str_starts_with($path, 'http')) {
                        return $path;
                    }
                    $p = is_string($path) ? $path : '';
                    return $p ? $baseUrl . '/storage/' . ltrim($p, '/') : '';
                }, is_array($images) ? $images : []);

                $entries->push([
                    'id' => $item->id,
                    'history_type' => 'item',
                    'date' => $item->created_at->toIso8601String(),
                    'project' => $item->donationRequest ? [
                        'id' => $item->donationRequest->id,
                        'title' => $item->donationRequest->title,
                    ] : null,
                    'evidence_images' => $imageUrls,
                    'items_needed' => $item->items_needed,
                    'estimated_value' => $item->estimated_value,
                    'status' => $item->status?->value ?? (string) $item->status,
                ]);
            }
        }

        if (!$type || $type === 'volunteer') {
            $volQuery = VolunteerApplication::query()
                ->where('volunteer_id', $userId)
                ->with(['request:id,title']);

            if ($dateFrom) {
                $volQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $volQuery->whereDate('created_at', '<=', $dateTo);
            }

            $vols = $volQuery->orderByDesc('created_at')->get();

            foreach ($vols as $v) {
                $entries->push([
                    'id' => $v->id,
                    'history_type' => 'volunteer',
                    'date' => $v->created_at->toIso8601String(),
                    'project' => $v->request ? [
                        'id' => $v->request->id,
                        'title' => $v->request->title,
                    ] : null,
                    'status' => $v->status?->value ?? (string) $v->status,
                    'message' => $v->message,
                    'estimated_hours' => $v->estimated_hours,
                    'skills' => $v->skills,
                    'approved_at' => $v->approved_at?->toIso8601String(),
                    'completed_at' => $v->completed_at?->toIso8601String(),
                ]);
            }
        }

        $entries = $entries->sortByDesc(function ($e) {
            return $e['date'];
        })->values();

        $total = $entries->count();
        $slice = $entries->slice(($page - 1) * $perPage, $perPage)->values();
        $paginator = new LengthAwarePaginator(
            $slice,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json([
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }
}
