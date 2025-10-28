<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @property string $id
 * @property string $metric
 * @property int $value
 * @property string $created_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Analytics newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Analytics newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Analytics query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Analytics whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Analytics whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Analytics whereMetric($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Analytics whereValue($value)
 */
	class Analytics extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $user_id
 * @property string $action
 * @property string $entity_type
 * @property string $entity_id
 * @property string $created_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereAction($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereEntityId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereEntityType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AuditLog whereUserId($value)
 */
	class AuditLog extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\DonationRequest> $donationRequests
 * @property-read int|null $donation_requests_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RelatedCategory> $relatedCategoriesAsMain
 * @property-read int|null $related_categories_as_main_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\RelatedCategory> $relatedCategoriesAsRelated
 * @property-read int|null $related_categories_as_related_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\UserInterest> $userInterests
 * @property-read int|null $user_interests_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Category newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Category newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Category query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Category whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Category whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Category whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Category whereUpdatedAt($value)
 */
	class Category extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $amount
 * @property string|null $item_details
 * @property \App\Enums\DonationType $type
 * @property \App\Enums\DonationStatus $status
 * @property string $donor_id
 * @property string $request_id
 * @property string|null $request_title
 * @property string|null $transaction_id
 * @property string|null $payment_method
 * @property string|null $tracking_number
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $donor
 * @property-read \App\Models\DonationRequest $request
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereCompletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereDonorId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereItemDetails($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation wherePaymentMethod($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereRequestId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereRequestTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereTrackingNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereTransactionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Donation whereUpdatedAt($value)
 */
	class Donation extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string|null $images
 * @property string $title
 * @property string $description
 * @property string $slug
 * @property string $category_id
 * @property int $accepts_money
 * @property int $accepts_items
 * @property int $accepts_volunteer
 * @property string $target_amount
 * @property string $current_amount
 * @property int $supporters
 * @property string|null $documents
 * @property \App\Enums\DonationRequestStatus $status
 * @property float|null $goal_amount
 * @property string $organizer_id
 * @property string|null $organization_id
 * @property \App\Enums\UrgencyLevel|null $urgency
 * @property string|null $approved_by
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property int $volunteers_received
 * @property string|null $item_details
 * @property string|null $volunteer_details
 * @property \App\Enums\DonationType|null $donation_type
 * @property string|null $payment_methods
 * @property int $view_count
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property int $volunteers_needed
 * @property string|null $volunteer_skills
 * @property string|null $volunteer_duration
 * @property string|null $items_needed
 * @property float $recommendation_score
 * @property string|null $location
 * @property float|null $latitude
 * @property float|null $longitude
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $approvedBy
 * @property-read \App\Models\Category $category
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Donation> $donations
 * @property-read int|null $donations_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Favorite> $favorites
 * @property-read int|null $favorites_count
 * @property-read \App\Models\Organization|null $organization
 * @property-read \App\Models\User $organizer
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Share> $shares
 * @property-read int|null $shares_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Story> $stories
 * @property-read int|null $stories_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\VolunteerApplication> $volunteerApplications
 * @property-read int|null $volunteer_applications_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereAcceptsItems($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereAcceptsMoney($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereAcceptsVolunteer($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereApprovedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereApprovedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereCategoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereCurrentAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereDocuments($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereDonationType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereGoalAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereImages($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereItemDetails($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereItemsNeeded($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereLatitude($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereLocation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereLongitude($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereOrganizationId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereOrganizerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest wherePaymentMethods($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereRecommendationScore($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereSupporters($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereTargetAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereUrgency($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereViewCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereVolunteerDetails($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereVolunteerDuration($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereVolunteerSkills($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereVolunteersNeeded($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|DonationRequest whereVolunteersReceived($value)
 */
	class DonationRequest extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $user_id
 * @property string $request_id
 * @property string $created_at
 * @property-read \App\Models\DonationRequest $request
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Favorite newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Favorite newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Favorite query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Favorite whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Favorite whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Favorite whereRequestId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Favorite whereUserId($value)
 */
	class Favorite extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $label
 * @property string|null $description
 * @property string $icon
 * @property string $category
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\UserInterest> $userInterests
 * @property-read int|null $user_interests_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest whereCategory($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest whereIcon($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest whereLabel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Interest whereUpdatedAt($value)
 */
	class Interest extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $user_id
 * @property string $message
 * @property string $type
 * @property int $is_read
 * @property string $created_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereIsRead($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Notification whereUserId($value)
 */
	class Notification extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $name
 * @property \App\Enums\OrganizationType $type
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $website
 * @property string|null $registration_number
 * @property string|null $temple_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\DonationRequest> $donationRequests
 * @property-read int|null $donation_requests_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $users
 * @property-read int|null $users_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereRegistrationNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereTempleId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Organization whereWebsite($value)
 */
	class Organization extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $user_id
 * @property string $type
 * @property int $amount
 * @property string $source
 * @property string $description
 * @property string $date
 * @property string|null $related_id
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereRelatedId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereSource($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PointsTransaction whereUserId($value)
 */
	class PointsTransaction extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $category_id
 * @property string $related_category_id
 * @property float $similarity
 * @property-read \App\Models\Category $category
 * @property-read \App\Models\Category $relatedCategory
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelatedCategory newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelatedCategory newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelatedCategory query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelatedCategory whereCategoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelatedCategory whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelatedCategory whereRelatedCategoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RelatedCategory whereSimilarity($value)
 */
	class RelatedCategory extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $user_id
 * @property string $reward_id
 * @property bool $is_active
 * @property string $created_at
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward whereExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward whereRewardId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Reward whereUserId($value)
 */
	class Reward extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $user_id
 * @property string|null $request_id
 * @property string|null $story_id
 * @property string $platform
 * @property string $created_at
 * @property-read \App\Models\DonationRequest|null $request
 * @property-read \App\Models\Story|null $story
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share wherePlatform($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share whereRequestId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share whereStoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Share whereUserId($value)
 */
	class Share extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $title
 * @property string $content
 * @property string $slug
 * @property string|null $images
 * @property string|null $videos
 * @property \App\Enums\StoryStatus $status
 * @property string $author_id
 * @property string|null $donation_request_id
 * @property \Illuminate\Support\Carbon|null $published_at
 * @property int $views
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $author
 * @property-read \App\Models\DonationRequest|null $donationRequest
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Share> $shares
 * @property-read int|null $shares_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereAuthorId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereDonationRequestId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereImages($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story wherePublishedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereVideos($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Story whereViews($value)
 */
	class Story extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $key
 * @property string $value
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting whereKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|SystemSetting whereValue($value)
 */
	class SystemSetting extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $email
 * @property string|null $avatar
 * @property string $password
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string|null $phone
 * @property string|null $bio
 * @property \App\Enums\UserRole $role
 * @property \App\Enums\UserStatus $status
 * @property float $total_donated
 * @property int $donation_count
 * @property string|null $customization
 * @property string|null $organization_id
 * @property array<array-key, mixed>|null $preferred_categories
 * @property string|null $id_card_url
 * @property bool $is_email_verified
 * @property string|null $organization_cert_url
 * @property bool $documents_verified
 * @property string|null $location
 * @property float|null $latitude
 * @property float|null $longitude
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AuditLog> $auditLogs
 * @property-read int|null $audit_logs_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\DonationRequest> $donationRequests
 * @property-read int|null $donation_requests_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Donation> $donations
 * @property-read int|null $donations_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Favorite> $favorites
 * @property-read int|null $favorites_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Notification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \App\Models\Organization|null $organization
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\PointsTransaction> $pointsTransactions
 * @property-read int|null $points_transactions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Reward> $rewards
 * @property-read int|null $rewards_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Share> $shares
 * @property-read int|null $shares_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Story> $stories
 * @property-read int|null $stories_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\UserInteraction> $userInteractions
 * @property-read int|null $user_interactions_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\UserInterest> $userInterests
 * @property-read int|null $user_interests_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\VolunteerApplication> $volunteerApplications
 * @property-read int|null $volunteer_applications_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereAvatar($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereBio($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCustomization($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereDocumentsVerified($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereDonationCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereFirstName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereIdCardUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereIsEmailVerified($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereLastName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereLatitude($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereLocation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereLongitude($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereOrganizationCertUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereOrganizationId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePreferredCategories($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereTotalDonated($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 */
	class User extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $user_id
 * @property \App\Enums\UserInteractionType $interaction_type
 * @property int $interaction_value
 * @property string $entity_type
 * @property string $entity_id
 * @property int|null $duration
 * @property float $weight
 * @property string $created_at
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereDuration($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereEntityId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereEntityType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereInteractionType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereInteractionValue($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInteraction whereWeight($value)
 */
	class UserInteraction extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $user_id
 * @property string $interest_id
 * @property string|null $category_id
 * @property-read \App\Models\Category|null $category
 * @property-read \App\Models\Interest $interest
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInterest newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInterest newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInterest query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInterest whereCategoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInterest whereInterestId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserInterest whereUserId($value)
 */
	class UserInterest extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $id
 * @property string $message
 * @property string|null $skills
 * @property string|null $experience
 * @property string|null $availability
 * @property \App\Enums\VolunteerStatus $status
 * @property int|null $hours_committed
 * @property \Illuminate\Support\Carbon|null $start_date
 * @property \Illuminate\Support\Carbon|null $end_date
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property string $volunteer_id
 * @property string $request_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\DonationRequest $request
 * @property-read \App\Models\User $volunteer
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereApprovedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereAvailability($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereCompletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereEndDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereExperience($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereHoursCommitted($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereRequestId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereSkills($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereStartDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|VolunteerApplication whereVolunteerId($value)
 */
	class VolunteerApplication extends \Eloquent {}
}

