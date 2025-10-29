<?php

    namespace App\Http\Controllers\Api;

    use App\Http\Controllers\Controller;
    use App\Models\User;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Str;
    use App\Enums\UserRole;
    use App\Enums\UserStatus;
    use Illuminate\Support\Facades\Validator;

    class AdminUserController extends Controller
    {
        public function getUsers(Request $request): JsonResponse
        {
            try {
                $users = User::with(['donations', 'donationRequests'])
                    ->get()
                    ->map(function ($user) {
                        $data = [
                            'id' => $user->id,
                            'name' => $user->first_name . ' ' . $user->last_name,
                            'email' => $user->email,
                            'role' => strtolower($user->role->value),
                            'join_date' => $user->created_at->format('Y-m-d H:i:s'),
                            'is_verified' => (bool) $user->is_email_verified,
                            'status' => strtolower($user->status->value),
                        ];

                        if ($user->role === UserRole::DONOR) {
                            $data['total_donated'] = (float) ($user->total_donated ?? 0);
                            $data['donation_count'] = $user->donation_count ?? 0;
                        } elseif ($user->role === UserRole::ORGANIZER) {
                            $data['requests_created'] = $user->donationRequests->count();
                            $data['documents_verified'] = (bool) $user->documents_verified;
                        }

                        return $data;
                    });

                return response()->json($users);
            } catch (\Exception $e) {
                \Log::error('Error fetching users', ['error' => $e->getMessage()]);
                return response()->json([
                    'message' => 'Error fetching users: ' . $e->getMessage()
                ], 500);
            }
        }

        public function createUser(Request $request): JsonResponse
        {
            \Log::info('Admin creating user', $request->all());

            // ใช้ validation rules ที่ยืดหยุ่นกว่า
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|unique:users',
                'password' => 'required|min:6',
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'role' => 'required|in:user,organizer,admin',

                // เปลี่ยนเป็น nullable สำหรับทุก role
                'organizationName' => 'nullable|string|max:255',
                'organizationType' => 'nullable|string|max:255',
                'organizationId' => 'nullable|string|max:255',

                'interests' => 'nullable|array',
                'isVerified' => 'boolean',
                'documentsVerified' => 'boolean',
            ], [
                'email.required' => 'กรุณากรอกอีเมล',
                'email.email' => 'รูปแบบอีเมลไม่ถูกต้อง',
                'email.unique' => 'อีเมลนี้มีผู้ใช้งานแล้ว',
                'password.required' => 'กรุณากรอกรหัสผ่าน',
                'password.min' => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
                'firstName.required' => 'กรุณากรอกชื่อ',
                'lastName.required' => 'กรุณากรอกนามสกุล',
                'phone.required' => 'กรุณากรอกเบอร์โทรศัพท์',
                'role.required' => 'กรุณาเลือกบทบาท',
                // ลบ custom messages สำหรับ organization fields
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            try {
                // Map role to enum
                $role = match ($request->role) {
                    'admin' => UserRole::ADMIN,
                    'organizer' => UserRole::ORGANIZER,
                    default => UserRole::DONOR,
                };

                // Create user data
                $userData = [
                    'id' => (string) Str::uuid(),
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'first_name' => $request->firstName,
                    'last_name' => $request->lastName,
                    'phone' => $request->phone,
                    'role' => $role,
                    'is_email_verified' => $request->isVerified ?? true,
                    'status' => UserStatus::ACTIVE,
                    'preferred_categories' => $request->interests ?? [],

                    // ตั้งค่าฟิลด์องค์กรให้เป็น null สำหรับ non-organizer
                    'organization_name' => $request->organizationName ?: null,
                    'organization_type' => $request->organizationType ?: null,
                    'organization_id' => $request->organizationId ?: null,
                    'documents_verified' => $request->documentsVerified ?? false,
                ];

                // สำหรับ organizer ให้ validate ข้อมูลองค์กรเพิ่มเติม
                if ($request->role === 'organizer') {
                    if (empty($request->organizationName) || empty($request->organizationType)) {
                        return response()->json([
                            'message' => 'ข้อมูลไม่ถูกต้อง',
                            'errors' => [
                                'organizationName' => ['กรุณากรอกชื่อองค์กร'],
                                'organizationType' => ['กรุณาเลือกประเภทองค์กร'],
                            ]
                        ], 422);
                    }
                }

                // Create user
                $user = User::create($userData);

                \Log::info('User created successfully', ['user_id' => $user->id]);

                return response()->json([
                    'message' => 'สร้างผู้ใช้ใหม่เรียบร้อยแล้ว',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'role' => $user->role->value,
                        'isVerified' => (bool) $user->is_email_verified,
                        'joinDate' => $user->created_at->format('Y-m-d H:i:s'),
                        'organizationName' => $user->organization_name,
                        'organizationType' => $user->organization_type,
                    ]
                ], 201);
            } catch (\Exception $e) {
                \Log::error('Error creating user', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'data' => $request->all()
                ]);

                return response()->json([
                    'message' => 'เกิดข้อผิดพลาดในการสร้างผู้ใช้: ' . $e->getMessage()
                ], 500);
            }
        }

        public function getUser(Request $request, $id): JsonResponse
        {
            try {
                $user = User::find($id);

                if (!$user) {
                    return response()->json([
                        'message' => 'User not found'
                    ], 404);
                }

                $data = [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => strtolower($user->role->value),
                    'join_date' => $user->created_at->format('Y-m-d H:i:s'),
                    'is_verified' => (bool) $user->is_email_verified,
                    'status' => strtolower($user->status->value),
                    'preferred_categories' => $user->preferred_categories ?? [],
                ];

                if ($user->role === UserRole::ORGANIZER) {
                    $data['organization_name'] = $user->organization_name;
                    $data['organization_type'] = $user->organization_type;
                    $data['organization_id'] = $user->organization_id;
                    $data['documents_verified'] = (bool) $user->documents_verified;
                }

                return response()->json($data);
            } catch (\Exception $e) {
                \Log::error('Error fetching user', ['error' => $e->getMessage()]);
                return response()->json([
                    'message' => 'Error fetching user: ' . $e->getMessage()
                ], 500);
            }
        }

        public function updateUser(Request $request, $id): JsonResponse
        {
            try {
                $user = User::find($id);

                if (!$user) {
                    return response()->json([
                        'message' => 'User not found'
                    ], 404);
                }

                $validator = Validator::make($request->all(), [
                    'email' => 'sometimes|email|unique:users,email,' . $id,
                    'firstName' => 'sometimes|string|max:255',
                    'lastName' => 'sometimes|string|max:255',
                    'phone' => 'sometimes|string|max:20',
                    'role' => 'sometimes|in:user,organizer,admin',
                    'organizationName' => 'sometimes|string|max:255',
                    'organizationType' => 'sometimes|string|max:255',
                    'organizationId' => 'nullable|string|max:255',
                    'interests' => 'nullable|array',
                    'isVerified' => 'boolean',
                    'documentsVerified' => 'boolean',
                    'status' => 'sometimes|in:active,inactive,suspended',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'message' => 'ข้อมูลไม่ถูกต้อง',
                        'errors' => $validator->errors()
                    ], 422);
                }

                // Update basic info
                if ($request->has('firstName')) $user->first_name = $request->firstName;
                if ($request->has('lastName')) $user->last_name = $request->lastName;
                if ($request->has('email')) $user->email = $request->email;
                if ($request->has('phone')) $user->phone = $request->phone;
                if ($request->has('isVerified')) $user->is_email_verified = $request->isVerified;
                if ($request->has('interests')) $user->preferred_categories = $request->interests;

                // Update role
                if ($request->has('role')) {
                    $role = match ($request->role) {
                        'admin' => UserRole::ADMIN,
                        'organizer' => UserRole::ORGANIZER,
                        default => UserRole::DONOR,
                    };
                    $user->role = $role;
                }

                // Update status
                if ($request->has('status')) {
                    $status = match ($request->status) {
                        'inactive' => UserStatus::INACTIVE,
                        'suspended' => UserStatus::SUSPENDED,
                        default => UserStatus::ACTIVE,
                    };
                    $user->status = $status;
                }

                // Update organization data
                if ($user->role === UserRole::ORGANIZER) {
                    if ($request->has('organizationName')) $user->organization_name = $request->organizationName;
                    if ($request->has('organizationType')) $user->organization_type = $request->organizationType;
                    if ($request->has('organizationId')) $user->organization_id = $request->organizationId;
                    if ($request->has('documentsVerified')) $user->documents_verified = $request->documentsVerified;
                }

                $user->save();

                return response()->json([
                    'message' => 'อัพเดทข้อมูลผู้ใช้เรียบร้อยแล้ว',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'role' => $user->role->value,
                        'status' => $user->status->value,
                    ]
                ]);
            } catch (\Exception $e) {
                \Log::error('Error updating user', [
                    'error' => $e->getMessage(),
                    'user_id' => $id
                ]);

                return response()->json([
                    'message' => 'เกิดข้อผิดพลาดในการอัพเดทผู้ใช้'
                ], 500);
            }
        }

        public function deleteUser(Request $request, $id): JsonResponse
        {
            try {
                $user = User::find($id);

                if (!$user) {
                    return response()->json([
                        'message' => 'User not found'
                    ], 404);
                }

                // Prevent admin from deleting themselves
                if ($user->id === $request->user()->id) {
                    return response()->json([
                        'message' => 'Cannot delete your own account'
                    ], 403);
                }

                $user->delete();

                return response()->json(null, 204);
            } catch (\Exception $e) {
                \Log::error('Error deleting user', [
                    'error' => $e->getMessage(),
                    'user_id' => $id
                ]);
                return response()->json([
                    'message' => 'Error deleting user: ' . $e->getMessage()
                ], 500);
            }
        }
    }
