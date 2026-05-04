import Foundation

public struct TeamOSArtifactLink: Codable, Equatable, Sendable {
    public let type: String
    public let label: String
    public let path: String

    public init(type: String, label: String, path: String) {
        self.type = type
        self.label = label
        self.path = path
    }
}

public struct TeamOSCard: Codable, Equatable, Sendable {
    public let id: String
    public let title: String
    public let type: String
    public let board: String
    public let status: String
    public let priority: String
    public let owner: String
    public let assignees: [String]
    public let reviewers: [String]
    public let watchers: [String]
    public let collaborators: [String]
    public let sittingWith: String?
    public let sittingReason: String?
    public let sittingSince: String?
    public let sittingExpectedAction: String?
    public let summary: String
    public let artifacts: [TeamOSArtifactLink]

    public init(
        id: String,
        title: String,
        type: String,
        board: String,
        status: String,
        priority: String,
        owner: String,
        assignees: [String],
        reviewers: [String],
        watchers: [String],
        collaborators: [String],
        sittingWith: String?,
        sittingReason: String?,
        sittingSince: String?,
        sittingExpectedAction: String?,
        summary: String,
        artifacts: [TeamOSArtifactLink]
    ) {
        self.id = id
        self.title = title
        self.type = type
        self.board = board
        self.status = status
        self.priority = priority
        self.owner = owner
        self.assignees = assignees
        self.reviewers = reviewers
        self.watchers = watchers
        self.collaborators = collaborators
        self.sittingWith = sittingWith
        self.sittingReason = sittingReason
        self.sittingSince = sittingSince
        self.sittingExpectedAction = sittingExpectedAction
        self.summary = summary
        self.artifacts = artifacts
    }
}

public struct TeamOSEvent: Codable, Equatable, Sendable {
    public let timestamp: String
    public let type: String
    public let actor: String
    public let summary: String

    public init(timestamp: String, type: String, actor: String, summary: String) {
        self.timestamp = timestamp
        self.type = type
        self.actor = actor
        self.summary = summary
    }
}

public struct TeamOSComment: Codable, Equatable, Sendable {
    public let author: String
    public let createdAt: String
    public let role: String
    public let body: String

    public init(author: String, createdAt: String, role: String, body: String) {
        self.author = author
        self.createdAt = createdAt
        self.role = role
        self.body = body
    }
}

public struct TeamOSBoardColumn: Codable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let wipLimit: Int?

    public init(id: String, label: String, wipLimit: Int? = nil) {
        self.id = id
        self.label = label
        self.wipLimit = wipLimit
    }
}

public struct TeamOSBoard: Codable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let cardTypes: [String]
    public let columns: [TeamOSBoardColumn]

    public init(id: String, name: String, cardTypes: [String], columns: [TeamOSBoardColumn]) {
        self.id = id
        self.name = name
        self.cardTypes = cardTypes
        self.columns = columns
    }
}

public struct TeamOSSnapshot: Equatable, Sendable {
    public let cards: [TeamOSCard]
    public let boards: [TeamOSBoard]

    public init(cards: [TeamOSCard], boards: [TeamOSBoard]) {
        self.cards = cards
        self.boards = boards
    }
}

public struct ValidationOutcome: Equatable, Sendable {
    public let errors: [String]
    public let reportPath: String

    public init(errors: [String], reportPath: String) {
        self.errors = errors
        self.reportPath = reportPath
    }
}
