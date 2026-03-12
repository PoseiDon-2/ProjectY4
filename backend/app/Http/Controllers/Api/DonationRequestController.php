<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationRequest;
use App\Models\Category;
use App\Models\Organization;
use App\Models\Donation;
use App\Models\Story;
use App\Enums\DonationRequestStatus;
use App\Enums\UrgencyLevel;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\UserBehavior;

class DonationRequestController extends Controller
{
    /**
     * Get all donation requests (with filters)
     */
    public function index(Request $request)
    {
        try {
            // 1. เริ่มต้น Query พื้นฐาน
            $query = DonationRequest::with(['category', 'organization', 'organizer'])
                ->where('status', DonationRequestStatus::APPROVED->value ?? 'APPROVED');

            // --- ส่วน Filter ---
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('donation_type')) {
                $type = strtolower($request->donation_type);
                if ($type === 'money') {
                    $query->where('accepts_money', true);
                } elseif ($type === 'items') {
                    $query->where('accepts_items', true);
                } elseif ($type === 'volunteer') {
                    $query->where('accepts_volunteer', true);
                }
            }

            if ($request->has('location')) {
                $query->where('location', 'like', '%' . $request->location . '%');
            }

            if ($request->has('urgency')) {
                $query->where('urgency', strtoupper($request->urgency));
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', '%' . $search . '%')
                        ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // =========================================================
            // [ส่วนที่เพิ่มใหม่] Logic กรองโครงการที่เคยปัดทิ้ง (Exclusion)
            // =========================================================
            $user = $request->user('sanctum'); // ดึง User ถ้า Login
            $sessionId = $request->query('session_id'); // ดึง Session ID จากหน้าบ้าน

            if ($user || $sessionId) {
                // เรียกใช้ Model UserBehavior
                $swipedIds = \App\Models\UserBehavior::query()
                    ->where(function ($q) use ($sessionId, $user) {
                        if ($sessionId) {
                            $q->where('session_id', $sessionId);
                        }
                        if ($user) {
                            $q->orWhere('user_id', $user->id);
                        }
                    })
                    // กรองเอาเฉพาะ Action ที่เป็นการปัด (รองรับทั้งแบบ string และ int)
                    ->whereIn('action_type', ['swipe_like', 'swipe_pass', 1, 2])
                    ->pluck('donation_request_id')
                    ->toArray();

                // สั่งให้ Query หลัก "ไม่เอา" ID เหล่านี้
                if (!empty($swipedIds)) {
                    $query->whereNotIn('donation_requests.id', $swipedIds);
                }
            }

            // =========================================================
            // --- ส่วนระบบแนะนำ (Recommendation Logic) ---
            // =========================================================
            $usedRecommendation = false;

            if (($user || $sessionId) && !$request->has('sort_by')) {
                $query->leftJoin('user_recommendations', function ($join) use ($user, $sessionId) {
                    $join->on('donation_requests.id', '=', 'user_recommendations.donation_request_id')
                        ->where(function ($q) use ($user, $sessionId) {
                            if ($user) {
                                $q->where('user_recommendations.user_id', '=', $user->id);
                            }
                            if ($sessionId) {
                                $q->orWhere('user_recommendations.session_id', '=', $sessionId);
                            }
                        });
                });

                $query->select(
                    'donation_requests.*',
                    DB::raw('COALESCE(user_recommendations.score, donation_requests.recommendation_score, 0) as final_score')
                );

                $query->orderBy('final_score', 'DESC')
                      ->orderBy('urgency', 'desc')
                      ->orderBy('created_at', 'desc');

                $usedRecommendation = true;
            }

            // --- Fallback Sorting (ถ้าไม่ได้ใช้ระบบแนะนำ หรือ User กด Sort เอง) ---
            if (!$usedRecommendation) {
                $sortBy = $request->get('sort_by', 'created_at');
                $sortOrder = $request->get('sort_order', 'desc');
                $query->orderBy($sortBy, $sortOrder);

                if (!$query->getQuery()->columns) {
                    $query->select('donation_requests.*');
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $requests = $query->paginate($perPage);

            return response()->json($requests);

        } catch (\Exception $e) {
            \Log::error('Error in DonationRequestController::index: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to fetch donation requests',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get single donation request by ID
     */
    public function show($id)
    {
        $request = DonationRequest::with([
            'category',
            'organization',
            'organizer',
            'donations',
            'volunteerApplications',
            'stories',
            'favorites',
            'shares'
        ])->findOrFail($id);

        // Increment view count
        $request->increment('view_count');

        return response()->json($request);
    }

    /**
     * Get organizer's own donation requests
     */
    public function myRequests()
    {
        $user = Auth::user();

        if ($user->role !== UserRole::ORGANIZER) {
            return response()->json([
                'error' => 'Only organizers can access this endpoint'
            ], 403);
        }

        $requests = DonationRequest::with(['category', 'organization'])
            ->where('organizer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($requests);
    }

    /**
     * Get organizer's donation requests for story creation
     */
    public function getOrganizerRequestsForStories(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== UserRole::ORGANIZER) {
            return response()->json([
                'error' => 'Only organizers can access this endpoint'
            ], 403);
        }

        try {
            $requests = DonationRequest::with(['organizer'])
                ->where('organizer_id', $user->id)
                ->where('status', DonationRequestStatus::APPROVED->value)
                ->select('id', 'title', 'current_amount', 'goal_amount', 'created_at')
                ->withCount(['donations as supporters' => function ($query) {
                    $query->select(DB::raw('COUNT(DISTINCT donor_id)'));
                }])
                ->get()
                ->map(function ($request) use ($user) {
                    $organizerName = $request->organizer
                        ? ($request->organizer->organization_name ?? $request->organizer->name)
                        : ($user->organization_name ?? "{$user->first_name} {$user->last_name}");

                    return [
                        'id' => $request->id,
                        'title' => $request->title,
                        'organizer' => $organizerName,
                        'currentAmount' => (float) $request->current_amount,
                        'goalAmount' => (float) $request->goal_amount,
                        'supporters' => $request->supporters,
                        'createdAt' => $request->created_at->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getOrganizerRequestsForStories: ' . $e->getMessage());

            $requests = DonationRequest::where('organizer_id', $user->id)
                ->where('status', DonationRequestStatus::APPROVED->value)
                ->select('id', 'title', 'current_amount', 'goal_amount', 'created_at', 'supporters')
                ->get()
                ->map(function ($request) use ($user) {
                    return [
                        'id' => $request->id,
                        'title' => $request->title,
                        'organizer' => $user->organization_name ?? "{$user->first_name} {$user->last_name}",
                        'currentAmount' => (float) $request->current_amount,
                        'goalAmount' => (float) $request->goal_amount,
                        'supporters' => $request->supporters ?? 0,
                        'createdAt' => $request->created_at->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $requests,
                'note' => 'Using fallback method'
            ]);
        }
    }

    /**
     * Get organizer dashboard statistics
     */
    public function getOrganizerDashboardStats(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== UserRole::ORGANIZER) {
            return response()->json([
                'error' => 'Only organizers can access this endpoint'
            ], 403);
        }

        try {
            $stats = [
                'totalRequests' => DonationRequest::where('organizer_id', $user->id)->count(),
                'approvedRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::APPROVED->value)->count(),
                'pendingRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::PENDING->value)->count(),
                'rejectedRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::REJECTED->value)->count(),
                'totalDonations' => Donation::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->sum('amount'),
                'totalSupporters' => Donation::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->distinct('donor_id')->count('donor_id'),
                'totalStories' => Story::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->count(),
                'totalViews' => Story::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->sum('views'),
                'totalLikes' => Story::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->sum('likes'),
            ];

            $stats['engagementRate'] = $stats['totalViews'] > 0
                ? round(($stats['totalLikes'] / $stats['totalViews']) * 100, 2)
                : 0;

            $stats['recentStories'] = Story::whereHas('donationRequest', function ($query) use ($user) {
                $query->where('organizer_id', $user->id);
            })
                ->with('donationRequest')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($story) {
                    return [
                        'id' => $story->id,
                        'title' => $story->title,
                        'type' => $story->type,
                        'views' => $story->views,
                        'likes' => $story->likes,
                        'createdAt' => $story->created_at->toISOString(),
                        'donationRequest' => [
                            'id' => $story->donationRequest->id,
                            'title' => $story->donationRequest->title,
                        ]
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getOrganizerDashboardStats: ' . $e->getMessage());

            $stats = [
                'totalRequests' => DonationRequest::where('organizer_id', $user->id)->count(),
                'approvedRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::APPROVED->value)->count(),
                'pendingRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::PENDING->value)->count(),
                'rejectedRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::REJECTED->value)->count(),
                'totalDonations' => 0,
                'totalSupporters' => 0,
                'totalStories' => Story::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->count(),
                'totalViews' => 0,
                'totalLikes' => 0,
                'engagementRate' => 0,
                'recentStories' => []
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'note' => 'Using simplified stats due to error'
            ]);
        }
    }

    /**
     * Get donation requests with stories for organizer
     */
    public function getOrganizerRequestsWithStories(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== UserRole::ORGANIZER) {
            return response()->json([
                'error' => 'Only organizers can access this endpoint'
            ], 403);
        }

        $donationRequestId = $request->get('donation_request_id');

        $query = DonationRequest::with(['stories' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }])
            ->where('organizer_id', $user->id)
            ->where('status', DonationRequestStatus::APPROVED->value);

        if ($donationRequestId) {
            $query->where('id', $donationRequestId);
        }

        $requests = $query->get()
            ->map(function ($request) use ($user) {
                $organizerName = $request->organizer
                    ? ($request->organizer->organization_name ?? $request->organizer->name)
                    : ($user->organization_name ?? "{$user->first_name} {$user->last_name}");

                return [
                    'id' => $request->id,
                    'title' => $request->title,
                    'organizer' => $organizerName,
                    'stories' => $request->stories->map(function ($story) {
                        return [
                            'id' => $story->id,
                            'donationRequestId' => $story->donation_request_id,
                            'title' => $story->title,
                            'content' => $story->content,
                            'type' => $story->type,
                            'image_url' => $story->image_url,
                            'duration' => $story->duration,
                            'views' => $story->views,
                            'likes' => $story->likes,
                            'is_published' => $story->is_published,
                            'created_at' => $story->created_at->toISOString(),
                            'updated_at' => $story->updated_at->toISOString(),
                        ];
                    })
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    /**
     * Get donation request statistics for a specific organizer request
     */
    public function getRequestStats($id)
    {
        $user = Auth::user();
        $donationRequest = DonationRequest::where('id', $id)
            ->where('organizer_id', $user->id)
            ->firstOrFail();

        $stats = [
            'request' => [
                'id' => $donationRequest->id,
                'title' => $donationRequest->title,
                'currentAmount' => (float) $donationRequest->current_amount,
                'goalAmount' => (float) $donationRequest->goal_amount,
                'progressPercentage' => $donationRequest->goal_amount > 0
                    ? round(($donationRequest->current_amount / $donationRequest->goal_amount) * 100, 2)
                    : 0,
            ],
            'stories' => [
                'total' => $donationRequest->stories()->count(),
                'published' => $donationRequest->stories()->where('is_published', true)->count(),
                'drafts' => $donationRequest->stories()->where('is_published', false)->count(),
                'totalViews' => $donationRequest->stories()->sum('views'),
                'totalLikes' => $donationRequest->stories()->sum('likes'),
                'engagementRate' => $donationRequest->stories()->sum('views') > 0
                    ? round(($donationRequest->stories()->sum('likes') / $donationRequest->stories()->sum('views')) * 100, 2)
                    : 0,
            ],
            'recentStories' => $donationRequest->stories()
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get()
                ->map(function ($story) {
                    return [
                        'id' => $story->id,
                        'title' => $story->title,
                        'type' => $story->type,
                        'views' => $story->views,
                        'likes' => $story->likes,
                        'createdAt' => $story->created_at->toISOString(),
                    ];
                })
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Create new donation request
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== UserRole::ORGANIZER) {
            return response()->json([
                'error' => 'Only organizers can create donation requests'
            ], 403);
        }

        \Log::info('Incoming donation request data:', $request->all());
        \Log::info('Incoming files:', $request->hasFile('images') ? $request->file('images') : 'No files');

        // Validation - รองรับไฟล์จริง
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'donation_types' => 'required|array|min:1',
            'donation_types.*' => 'in:money,items,volunteer',

            // Money
            'goal_amount' => 'nullable|numeric|min:1000',
            'bank_account.bank' => 'required_if:donation_types,money|string',
            'bank_account.account_number' => 'required_if:donation_types,money|string',
            'bank_account.account_name' => 'required_if:donation_types,money|string',
            'promptpay_number' => 'nullable|string',

            // Items
            'items_needed' => 'nullable|string',

            // Volunteer
            'volunteers_needed' => 'nullable|integer|min:1',
            'volunteer_details' => 'nullable|string',

            // Location & contact
            'location' => 'required|string',
            'detailed_address' => 'nullable|string',
            'contact_phone' => 'required|string',

            // Organization
            'organization_type' => 'required|string',
            'registration_number' => 'required|string',
            'tax_id' => 'nullable|string',

            // Urgency
            'urgency' => 'nullable|in:LOW,MEDIUM,HIGH',

            // Images
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $duration = (int) $request->input('duration_days', 30);
        $expiresAt = now()->addDays($duration);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $donationTypes = $data['donation_types'];

        if (in_array('money', $donationTypes)) {
            if (!$request->filled('goal_amount') || $request->goal_amount < 1000) {
                return response()->json(['error' => 'เป้าหมายเงินต้องไม่น้อยกว่า 1,000 บาท'], 422);
            }
            if (!$request->has('bank_account.bank') || !$request->has('bank_account.account_number') || !$request->has('bank_account.account_name')) {
                return response()->json(['error' => 'กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน'], 422);
            }
        }

        if (in_array('items', $donationTypes) && !$request->filled('items_needed')) {
            return response()->json(['error' => 'กรุณาระบุสิ่งของที่ต้องการ'], 422);
        }

        if (in_array('volunteer', $donationTypes)) {
            if (!$request->filled('volunteers_needed') || $request->volunteers_needed < 1) {
                return response()->json(['error' => 'กรุณาระบุจำนวนอาสาสมัครที่ต้องการ'], 422);
            }
            if (!$request->filled('volunteer_details')) {
                return response()->json(['error' => 'กรุณาระบุรายละเอียดงานอาสาสมัคร'], 422);
            }
        }

        $organization = Organization::find($user->organization_id);

        if (!$organization) {
            $organization = Organization::create([
                'id' => Str::uuid(),
                'name' => $user->organization_name ?? "{$user->first_name} {$user->last_name}",
                'type' => $data['organization_type'],
                'registration_number' => $data['registration_number'],
                'tax_id' => $data['tax_id'] ?? null,
                'phone' => $data['contact_phone'],
                'address' => $data['detailed_address'] ?? null,
            ]);

            $user->organization_id = $organization->id;
            $user->save();
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $filename = Str::random(10) . '_' . time() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('donation-images', $filename, 'public');
                $imagePaths[] = $path;
            }
        }

        $slug = Str::slug($data['title']) . '-' . Str::random(6);

        try {
            $donationRequest = DonationRequest::create([
                'id' => Str::uuid(),
                'title' => $data['title'],
                'slug' => $slug,
                'description' => $data['description'],
                'category_id' => $data['category_id'],
                'organizer_id' => $user->id,
                'organization_id' => $organization->id,
                'accepts_money' => in_array('money', $donationTypes),
                'accepts_items' => in_array('items', $donationTypes),
                'accepts_volunteer' => in_array('volunteer', $donationTypes),
                'goal_amount' => in_array('money', $donationTypes) ? $data['goal_amount'] : null,
                'target_amount' => in_array('money', $donationTypes) ? ($data['goal_amount'] ?? 0) : 0,
                'current_amount' => 0,
                'payment_methods' => in_array('money', $donationTypes) ? $this->buildPaymentMethods($data) : null,
                'items_needed' => $data['items_needed'] ?? null,
                'item_details' => $data['items_needed'] ?? null,
                'volunteers_needed' => $data['volunteers_needed'] ?? 0,
                'volunteers_received' => 0,
                'volunteer_details' => $data['volunteer_details'] ?? null,
                'location' => $data['location'],
                'detailed_address' => $data['detailed_address'] ?? null,
                'contact_phone' => $data['contact_phone'],
                'status' => DonationRequestStatus::PENDING,
                'urgency' => $data['urgency'] ?? UrgencyLevel::MEDIUM->value,
                'images' => !empty($imagePaths) ? json_encode($imagePaths) : null,
                'supporters' => 0,
                'view_count' => 0,
                'recommendation_score' => 0,
                'expires_at' => $expiresAt,
            ]);

            return response()->json([
                'message' => 'สร้างคำขอสำเร็จ! กำลังรอการอนุมัติ',
                'data' => $donationRequest->load(['category', 'organization', 'organizer'])
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating donation request: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to create donation request',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update donation request
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $donationRequest = DonationRequest::findOrFail($id);

        if ($donationRequest->organizer_id !== $user->id) {
            return response()->json([
                'error' => 'You are not authorized to update this request'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'goal_amount' => 'sometimes|numeric|min:1000',
            'items_needed' => 'sometimes|nullable|string',
            'volunteers_needed' => 'sometimes|nullable|integer|min:0',
            'volunteer_details' => 'sometimes|nullable|string',
            'location' => 'sometimes|string',
            'urgency' => 'sometimes|in:LOW,MEDIUM,HIGH',
            'images' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $validatedData = $validator->validated();

        if ($donationRequest->status === 'APPROVED' || $donationRequest->status === 'EDIT_APPROVED') {
            $donationRequest->update([
                'status' => 'EDIT_REQUESTED',
                'pending_updates' => $validatedData
            ]);

            return response()->json([
                'message' => 'ส่งคำขอแก้ไขเรียบร้อยแล้ว กรุณารอแอดมินตรวจสอบ',
                'data' => $donationRequest,
                'is_pending_review' => true
            ]);
        } else {
            if (in_array($donationRequest->status, ['DRAFT', 'REJECTED'])) {
                $validatedData['status'] = 'PENDING';
            }

            if ($donationRequest->status === 'EDIT_REQUESTED') {
                $donationRequest->update([
                    'pending_updates' => $validatedData
                ]);
            } else {
                $donationRequest->update($validatedData);
            }

            return response()->json([
                'message' => 'อัปเดตข้อมูลเรียบร้อยแล้ว',
                'data' => $donationRequest->load(['category', 'organization', 'organizer']),
                'is_pending_review' => false
            ]);
        }
    }

    /**
     * Delete donation request
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $donationRequest = DonationRequest::findOrFail($id);

        if ($donationRequest->organizer_id !== $user->id) {
            return response()->json([
                'error' => 'You are not authorized to delete this request'
            ], 403);
        }

        if ($donationRequest->status !== DonationRequestStatus::DRAFT) {
            return response()->json([
                'error' => 'Can only delete draft requests'
            ], 400);
        }

        $donationRequest->delete();

        return response()->json([
            'message' => 'Donation request deleted successfully'
        ]);
    }

    /**
     * Get all categories
     */
    public function categories()
    {
        $categories = Category::all();
        return response()->json($categories);
    }

    /**
     * Get donation request progress for organizer
     */
    public function getRequestProgress($id)
    {
        $user = Auth::user();

        try {
            $donationRequest = DonationRequest::where('id', $id)
                ->where('organizer_id', $user->id)
                ->firstOrFail();

            $progress = [
                'id' => $donationRequest->id,
                'title' => $donationRequest->title,
                'currentAmount' => (float) $donationRequest->current_amount,
                'goalAmount' => (float) $donationRequest->goal_amount,
                'progressPercentage' => $donationRequest->goal_amount > 0
                    ? round(($donationRequest->current_amount / $donationRequest->goal_amount) * 100, 2)
                    : 0,
                'supporters' => $donationRequest->donations()->distinct('donor_id')->count(),
                'daysRemaining' => $donationRequest->expires_at
                    ? max(0, now()->diffInDays($donationRequest->expires_at, false))
                    : null,
                'storiesCount' => $donationRequest->stories()->count(),
                'totalViews' => $donationRequest->stories()->sum('views'),
                'totalLikes' => $donationRequest->stories()->sum('likes'),
            ];

            return response()->json([
                'success' => true,
                'data' => $progress
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getRequestProgress: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to get request progress',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Build payment methods JSON from request data
     */
    private function buildPaymentMethods(array $data): ?string
    {
        $methods = [
            'promptpay'     => null,
            'bankAccount'   => null,
            'truewallet'    => null, 
        ];

        if (!empty($data['promptpay_number'])) {
            $pp = trim($data['promptpay_number']);
            $pp = preg_replace('/[^0-9@.-]/', '', $pp); 

            if (
                preg_match('/^0\d{9}$/', $pp) ||          
                preg_match('/^\d{13}$/', $pp) ||          
                filter_var($pp, FILTER_VALIDATE_EMAIL)
            ) { 
                $methods['promptpay'] = $pp;
            }
        }

        $bankInput = $data['bank_account'] ?? [];
        if (is_array($bankInput) && !empty($bankInput)) {
            $bank = [
                'bank'         => trim($bankInput['bank'] ?? $bankInput['bankName'] ?? ''),
                'accountNumber' => trim($bankInput['account_number'] ?? $bankInput['accountNumber'] ?? ''),
                'accountName'  => trim($bankInput['account_name'] ?? $bankInput['accountName'] ?? ''),
            ];

            if ($bank['bank'] && $bank['accountNumber'] && $bank['accountName']) {
                $methods['bankAccount'] = $bank;
            }
        }

        if (!$methods['promptpay'] && !$methods['bankAccount']) {
            return null;
        }

        return json_encode($methods);
    }
}