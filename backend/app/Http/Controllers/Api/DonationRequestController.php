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

class DonationRequestController extends Controller
{
    /**
     * Get all donation requests (with filters)
     */
    public function index(Request $request)
    {
        $query = DonationRequest::with(['category', 'organization', 'organizer'])
            ->where('status', DonationRequestStatus::APPROVED);

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by donation type
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

        // Filter by location
        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        // Filter by urgency
        if ($request->has('urgency')) {
            $query->where('urgency', strtoupper($request->urgency));
        }

        // Search by title or description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $requests = $query->paginate($perPage);

        return response()->json($requests);
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
            $requests = DonationRequest::with(['organizer']) // โหลด organizer relationship
                ->where('organizer_id', $user->id)
                ->where('status', DonationRequestStatus::APPROVED)
                ->select('id', 'title', 'current_amount', 'goal_amount', 'created_at')
                ->withCount(['donations as supporters' => function ($query) {
                    $query->select(DB::raw('COUNT(DISTINCT donor_id)')); // แก้ไขจาก user_id เป็น donor_id
                }])
                ->get()
                ->map(function ($request) use ($user) { // ใช้ $user จาก Auth
                    // ใช้ข้อมูลจาก organizer relationship หรือใช้ข้อมูลจาก user ปัจจุบัน
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
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            // Fallback: ใช้วิธีที่ไม่ต้องพึ่ง donations table และ organizer relationship
            $requests = DonationRequest::where('organizer_id', $user->id)
                ->where('status', DonationRequestStatus::APPROVED)
                ->select('id', 'title', 'current_amount', 'goal_amount', 'created_at', 'supporters')
                ->get()
                ->map(function ($request) use ($user) {
                    return [
                        'id' => $request->id,
                        'title' => $request->title,
                        'organizer' => $user->organization_name ?? "{$user->first_name} {$user->last_name}",
                        'currentAmount' => (float) $request->current_amount,
                        'goalAmount' => (float) $request->goal_amount,
                        'supporters' => $request->supporters ?? 0, // ใช้ค่าจาก column supporters
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
                    ->where('status', DonationRequestStatus::APPROVED)->count(),
                'pendingRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::PENDING)->count(),
                'rejectedRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::REJECTED)->count(),
                'totalDonations' => Donation::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->sum('amount'),
                'totalSupporters' => Donation::whereHas('donationRequest', function ($query) use ($user) {
                    $query->where('organizer_id', $user->id);
                })->distinct('donor_id')->count('donor_id'), // แก้ไขจาก user_id เป็น donor_id
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

            // Calculate engagement rate
            $stats['engagementRate'] = $stats['totalViews'] > 0
                ? round(($stats['totalLikes'] / $stats['totalViews']) * 100, 2)
                : 0;

            // Recent activity - last 5 stories
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

            // Fallback stats
            $stats = [
                'totalRequests' => DonationRequest::where('organizer_id', $user->id)->count(),
                'approvedRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::APPROVED)->count(),
                'pendingRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::PENDING)->count(),
                'rejectedRequests' => DonationRequest::where('organizer_id', $user->id)
                    ->where('status', DonationRequestStatus::REJECTED)->count(),
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
            ->where('status', DonationRequestStatus::APPROVED);

        if ($donationRequestId) {
            $query->where('id', $donationRequestId);
        }

        $requests = $query->get()
            ->map(function ($request) use ($user) {
                // ใช้ข้อมูลจาก organizer หรือใช้ข้อมูลจาก user ปัจจุบัน
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

        // Log incoming request for debugging
        \Log::info('Donation Request Data:', $request->all());

        // Validation
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|string',
            'donation_types' => 'required|array|min:1',
            'donation_types.*' => 'in:money,items,volunteer',

            // Money donation fields
            'goal_amount' => 'nullable|numeric|min:1000',
            'bank_account' => 'nullable|array',
            'bank_account.bank' => 'nullable|string',
            'bank_account.account_number' => 'nullable|string',
            'bank_account.account_name' => 'nullable|string',
            'promptpay_number' => 'nullable|string',
            'promptpay_qr' => 'nullable|string',

            // Items donation fields
            'items_needed' => 'nullable|string',

            // Volunteer fields
            'volunteers_needed' => 'nullable|integer|min:1',
            'volunteer_details' => 'nullable|string',
            'volunteer_duration' => 'nullable|string',
            'volunteer_skills' => 'nullable|string',

            // Location & contact
            'location' => 'required|string',
            'detailed_address' => 'nullable|string',
            'contact_phone' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',

            // Organization details
            'organization_type' => 'required|string',
            'registration_number' => 'required|string',
            'tax_id' => 'nullable|string',

            // Optional fields
            'urgency' => 'nullable|in:LOW,MEDIUM,HIGH',
            'expires_at' => 'nullable|date',
            'images' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $donationTypes = $data['donation_types'];

        // Validate category exists
        $category = Category::find($data['category_id']);
        if (!$category) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => ['category_id' => ['หมวดหมู่ที่เลือกไม่ถูกต้อง']]
            ], 422);
        }

        // Custom validation for donation-specific fields
        if (in_array('money', $donationTypes)) {
            if (empty($data['goal_amount']) || $data['goal_amount'] < 1000) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => ['goal_amount' => ['เป้าหมายการระดมทุนต้องไม่น้อยกว่า 1,000 บาท']]
                ], 422);
            }
            if (
                empty($data['bank_account']) ||
                empty($data['bank_account']['bank']) ||
                empty($data['bank_account']['account_number']) ||
                empty($data['bank_account']['account_name'])
            ) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => ['bank_account' => ['กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน']]
                ], 422);
            }
        }

        if (in_array('items', $donationTypes) && empty($data['items_needed'])) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => ['items_needed' => ['กรุณาระบุสิ่งของที่ต้องการ']]
            ], 422);
        }

        if (in_array('volunteer', $donationTypes)) {
            if (empty($data['volunteers_needed']) || $data['volunteers_needed'] < 1) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => ['volunteers_needed' => ['กรุณาระบุจำนวนอาสาสมัครที่ต้องการ']]
                ], 422);
            }
            if (empty($data['volunteer_details'])) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => ['volunteer_details' => ['กรุณาระบุรายละเอียดงานอาสาสมัคร']]
                ], 422);
            }
        }

        // Create or get organization
        $organization = null;
        if ($user->organization_id) {
            $organization = Organization::find($user->organization_id);
        }

        if (!$organization) {
            // Create new organization
            try {
                $orgData = [
                    'id' => Str::uuid(),
                    'name' => $user->organization_name ?? "{$user->first_name} {$user->last_name}",
                    'type' => $data['organization_type'],
                    'registration_number' => $data['registration_number'],
                    'phone' => $data['contact_phone'],
                    'address' => $data['detailed_address'] ?? null,
                ];

                \Log::info('Creating organization with data:', $orgData);

                $organization = Organization::create($orgData);

                // Update user's organization_id
                $user->organization_id = $organization->id;
                $user->save();
            } catch (\Exception $e) {
                \Log::error('Error creating organization: ' . $e->getMessage());
                \Log::error('Full error: ' . $e);
                return response()->json([
                    'error' => 'Failed to create organization',
                    'message' => $e->getMessage(),
                    'details' => config('app.debug') ? [
                        'line' => $e->getLine(),
                        'file' => $e->getFile(),
                    ] : null
                ], 500);
            }
        }

        // Prepare donation request data
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

                // Donation types
                'accepts_money' => in_array('money', $donationTypes),
                'accepts_items' => in_array('items', $donationTypes),
                'accepts_volunteer' => in_array('volunteer', $donationTypes),

                // Money donation
                'goal_amount' => $data['goal_amount'] ?? null,
                'target_amount' => $data['goal_amount'] ?? 0,
                'current_amount' => 0,
                'payment_methods' => isset($data['bank_account'])
                    ? json_encode($data['bank_account'])
                    : null,
                'promptpay_number' => $data['promptpay_number'] ?? null,
                'promptpay_qr' => $data['promptpay_qr'] ?? null,

                // Items donation
                'items_needed' => $data['items_needed'] ?? null,
                'item_details' => $data['items_needed'] ?? null,

                // Volunteer
                'volunteers_needed' => $data['volunteers_needed'] ?? 0,
                'volunteers_received' => 0,
                'volunteer_details' => $data['volunteer_details'] ?? null,
                'volunteer_duration' => $data['volunteer_duration'] ?? null,
                'volunteer_skills' => $data['volunteer_skills'] ?? null,

                // Location
                'location' => $data['location'],
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,

                // Status & urgency
                'status' => DonationRequestStatus::PENDING,
                'urgency' => $data['urgency'] ?? UrgencyLevel::MEDIUM->value,
                'expires_at' => $data['expires_at'] ?? null,

                // Images
                'images' => isset($data['images']) ? json_encode($data['images']) : null,
                'documents' => null,

                // Metadata
                'supporters' => 0,
                'view_count' => 0,
                'recommendation_score' => 0,
            ]);

            return response()->json([
                'message' => 'Donation request created successfully',
                'data' => $donationRequest->load(['category', 'organization', 'organizer'])
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating donation request: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to create donation request',
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Update donation request
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $donationRequest = DonationRequest::findOrFail($id);

        // Check ownership
        if ($donationRequest->organizer_id !== $user->id) {
            return response()->json([
                'error' => 'You are not authorized to update this request'
            ], 403);
        }

        // Can only update if status is DRAFT or REJECTED
        if (!in_array($donationRequest->status, [DonationRequestStatus::DRAFT, DonationRequestStatus::REJECTED])) {
            return response()->json([
                'error' => 'Cannot update request with current status'
            ], 400);
        }

        // Validation (similar to store, but all fields optional)
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|uuid|exists:categories,id',
            'goal_amount' => 'sometimes|numeric|min:1000',
            'items_needed' => 'sometimes|string',
            'volunteers_needed' => 'sometimes|integer|min:1',
            'volunteer_details' => 'sometimes|string',
            'location' => 'sometimes|string',
            'urgency' => 'sometimes|in:LOW,MEDIUM,HIGH',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $donationRequest->update($validator->validated());

        return response()->json([
            'message' => 'Donation request updated successfully',
            'data' => $donationRequest->load(['category', 'organization', 'organizer'])
        ]);
    }

    /**
     * Delete donation request
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $donationRequest = DonationRequest::findOrFail($id);

        // Check ownership
        if ($donationRequest->organizer_id !== $user->id) {
            return response()->json([
                'error' => 'You are not authorized to delete this request'
            ], 403);
        }

        // Can only delete if status is DRAFT
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
                'supporters' => $donationRequest->donations()->distinct('donor_id')->count(), // แก้ไขจาก user_id เป็น donor_id
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
}
