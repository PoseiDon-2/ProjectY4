import { mockData } from "./mock-data"

// User operations
export const userService = {
    create(data: any) {
        const newUser = {
            id: `user-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        mockData.users.push(newUser)
        return newUser
    },

    findByEmail(email: string) {
        return mockData.users.find((u) => u.email === email) || null
    },

    findById(id: string) {
        return mockData.users.find((u) => u.id === id) || null
    },

    update(id: string, data: any) {
        const index = mockData.users.findIndex((u) => u.id === id)
        if (index === -1) return null

        mockData.users[index] = {
            ...mockData.users[index],
            ...data,
            updatedAt: new Date(),
        }
        return mockData.users[index]
    },

    getAll(page = 1, limit = 10, role?: string) {
        const filtered = role ? mockData.users.filter((u) => u.role === role) : mockData.users
        const start = (page - 1) * limit
        const users = filtered.slice(start, start + limit)

        return {
            users,
            pagination: {
                page,
                limit,
                total: filtered.length,
                pages: Math.ceil(filtered.length / limit),
            },
        }
    },
}

// Donation Request operations
export const donationRequestService = {
    create(data: any) {
        const newRequest = {
            id: `request-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            currentAmount: 0,
            volunteersReceived: 0,
            viewCount: 0,
        }
        mockData.donationRequests.push(newRequest)
        return newRequest
    },

    findById(id: string) {
        return mockData.donationRequests.find((r) => r.id === id) || null
    },

    getAll(page = 1, limit = 10, filters: any = {}) {
        let filtered = [...mockData.donationRequests]

        if (filters.status) filtered = filtered.filter((r) => r.status === filters.status)
        if (filters.category) filtered = filtered.filter((r) => r.category === filters.category)
        if (filters.urgency) filtered = filtered.filter((r) => r.urgency === filters.urgency)
        if (filters.acceptsMoney !== undefined) filtered = filtered.filter((r) => r.acceptsMoney === filters.acceptsMoney)
        if (filters.acceptsItems !== undefined) filtered = filtered.filter((r) => r.acceptsItems === filters.acceptsItems)
        if (filters.acceptsVolunteer !== undefined)
            filtered = filtered.filter((r) => r.acceptsVolunteer === filters.acceptsVolunteer)

        if (filters.search) {
            const search = filters.search.toLowerCase()
            filtered = filtered.filter(
                (r) =>
                    r.title.toLowerCase().includes(search) ||
                    r.description.toLowerCase().includes(search) ||
                    r.category.toLowerCase().includes(search),
            )
        }

        const start = (page - 1) * limit
        const requests = filtered.slice(start, start + limit)

        return {
            requests,
            pagination: {
                page,
                limit,
                total: filtered.length,
                pages: Math.ceil(filtered.length / limit),
            },
        }
    },

    update(id: string, data: any) {
        const index = mockData.donationRequests.findIndex((r) => r.id === id)
        if (index === -1) return null

        mockData.donationRequests[index] = {
            ...mockData.donationRequests[index],
            ...data,
            updatedAt: new Date(),
        }
        return mockData.donationRequests[index]
    },

    updateStatus(id: string, status: string, approvedBy?: string) {
        const index = mockData.donationRequests.findIndex((r) => r.id === id)
        if (index === -1) return null

        const updateData: any = {
            status,
            updatedAt: new Date(),
        }

        if (status === "APPROVED" && approvedBy) {
            updateData.approvedBy = approvedBy
            updateData.approvedAt = new Date()
        }

        mockData.donationRequests[index] = {
            ...mockData.donationRequests[index],
            ...updateData,
        }
        return mockData.donationRequests[index]
    },

    incrementViewCount(id: string) {
        const index = mockData.donationRequests.findIndex((r) => r.id === id)
        if (index === -1) return null

        mockData.donationRequests[index].viewCount = (mockData.donationRequests[index].viewCount || 0) + 1
        return mockData.donationRequests[index]
    },
}

// Donation operations
export const donationService = {
    create(data: any) {
        const newDonation = {
            id: `donation-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            status: "PENDING",
        }
        mockData.donations.push(newDonation)

        // Update request current amount if it's a money donation
        if (data.type === "MONEY" && typeof data.amount === "number") {
            const request = mockData.donationRequests.find((r) => r.id === data.requestId)
            if (request) {
                request.currentAmount = (request.currentAmount || 0) + data.amount
            }
        }

        return newDonation
    },

    findById(id: string) {
        return mockData.donations.find((d) => d.id === id) || null
    },

    getByUser(userId: string, page = 1, limit = 10) {
        const filtered = mockData.donations.filter((d) => d.donorId === userId)
        const start = (page - 1) * limit
        const donations = filtered.slice(start, start + limit)

        return {
            donations,
            pagination: {
                page,
                limit,
                total: filtered.length,
                pages: Math.ceil(filtered.length / limit),
            },
        }
    },

    updateStatus(id: string, status: string) {
        const index = mockData.donations.findIndex((d) => d.id === id)
        if (index === -1) return null

        mockData.donations[index] = {
            ...mockData.donations[index],
            status,
            completedAt: status === "COMPLETED" ? new Date() : null,
        }
        return mockData.donations[index]
    },
}

// Volunteer Application operations
export const volunteerService = {
    create(data: any) {
        const newApplication = {
            id: `volunteer-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            status: "PENDING",
        }
        mockData.volunteers.push(newApplication)

        // Update request volunteers received count
        const request = mockData.donationRequests.find((r) => r.id === data.requestId)
        if (request) {
            request.volunteersReceived = (request.volunteersReceived || 0) + 1
        }

        return newApplication
    },

    findById(id: string) {
        return mockData.volunteers.find((v) => v.id === id) || null
    },

    getByRequest(requestId: string) {
        return mockData.volunteers.filter((v) => v.requestId === requestId)
    },

    updateStatus(id: string, status: string) {
        const index = mockData.volunteers.findIndex((v) => v.id === id)
        if (index === -1) return null

        mockData.volunteers[index] = {
            ...mockData.volunteers[index],
            status,
            approvedAt: status === "APPROVED" ? new Date() : null,
            completedAt: status === "COMPLETED" ? new Date() : null,
        }
        return mockData.volunteers[index]
    },
}

// Story operations
export const storyService = {
    create(data: any) {
        const newStory = {
            id: `story-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            views: 0,
        }
        mockData.stories.push(newStory)
        return newStory
    },

    getAll(page = 1, limit = 10, status = "PUBLISHED") {
        const filtered = mockData.stories.filter((s) => s.status === status)
        const start = (page - 1) * limit
        const stories = filtered.slice(start, start + limit)

        return {
            stories,
            pagination: {
                page,
                limit,
                total: filtered.length,
                pages: Math.ceil(filtered.length / limit),
            },
        }
    },

    findById(id: string) {
        return mockData.stories.find((s) => s.id === id) || null
    },

    incrementViews(id: string) {
        const index = mockData.stories.findIndex((s) => s.id === id)
        if (index === -1) return null

        mockData.stories[index].views = (mockData.stories[index].views || 0) + 1
        return mockData.stories[index]
    },
}

// Favorite operations
export const favoriteService = {
    toggle(userId: string, requestId: string) {
        const index = mockData.favorites.findIndex((f) => f.userId === userId && f.requestId === requestId)

        if (index !== -1) {
            mockData.favorites.splice(index, 1)
            return { action: "removed" }
        } else {
            mockData.favorites.push({
                id: `favorite-${Date.now()}`,
                userId,
                requestId,
                createdAt: new Date(),
            })
            return { action: "added" }
        }
    },

    getByUser(userId: string, page = 1, limit = 10) {
        const userFavorites = mockData.favorites.filter((f) => f.userId === userId)
        const requests = userFavorites
            .map((f) => mockData.donationRequests.find((r) => r.id === f.requestId))
            .filter(Boolean)

        const start = (page - 1) * limit
        const favorites = requests.slice(start, start + limit)

        return {
            favorites,
            pagination: {
                page,
                limit,
                total: requests.length,
                pages: Math.ceil(requests.length / limit),
            },
        }
    },
}
