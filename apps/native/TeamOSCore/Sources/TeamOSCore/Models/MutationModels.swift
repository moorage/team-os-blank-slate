import Foundation

public struct PullRequestState: Equatable, Sendable {
    public let number: Int?
    public let url: String?
    public let isDraft: Bool
    public let headBranch: String

    public init(number: Int?, url: String?, isDraft: Bool, headBranch: String) {
        self.number = number
        self.url = url
        self.isDraft = isDraft
        self.headBranch = headBranch
    }
}

public struct BranchSession: Equatable, Sendable {
    public let repository: RepoDescriptor
    public let branchName: String
    public let baseBranch: String
    public let createdAt: String
    public let pullRequest: PullRequestState?

    public init(
        repository: RepoDescriptor,
        branchName: String,
        baseBranch: String,
        createdAt: String,
        pullRequest: PullRequestState? = nil
    ) {
        self.repository = repository
        self.branchName = branchName
        self.baseBranch = baseBranch
        self.createdAt = createdAt
        self.pullRequest = pullRequest
    }
}

public struct MutationFileChange: Equatable, Sendable {
    public let path: String
    public let reason: String

    public init(path: String, reason: String) {
        self.path = path
        self.reason = reason
    }
}

public enum PlannedFileWriteMode: String, Equatable, Sendable {
    case upsert
    case delete
}

public struct PlannedFileWrite: Equatable, Sendable {
    public let path: String
    public let mode: PlannedFileWriteMode
    public let contents: String?
    public let expectedRemoteSHA: String?

    public init(
        path: String,
        mode: PlannedFileWriteMode = .upsert,
        contents: String?,
        expectedRemoteSHA: String? = nil
    ) {
        self.path = path
        self.mode = mode
        self.contents = contents
        self.expectedRemoteSHA = expectedRemoteSHA
    }
}

public enum MutationPlanKind: String, Equatable, Sendable {
    case createCard
    case moveCard
    case addComment
    case linkArtifact
    case changeParticipants
    case changeSittingWith
}

public struct MutationPlan: Equatable, Sendable {
    public let kind: MutationPlanKind
    public let cardID: String
    public let changedFiles: [MutationFileChange]
    public let fileWrites: [PlannedFileWrite]
    public let commitMessage: String
    public let pullRequestTitle: String
    public let pullRequestBody: String
    public let draftPullRequest: Bool

    public init(
        kind: MutationPlanKind,
        cardID: String,
        changedFiles: [MutationFileChange],
        fileWrites: [PlannedFileWrite],
        commitMessage: String,
        pullRequestTitle: String,
        pullRequestBody: String,
        draftPullRequest: Bool = true
    ) {
        self.kind = kind
        self.cardID = cardID
        self.changedFiles = changedFiles
        self.fileWrites = fileWrites
        self.commitMessage = commitMessage
        self.pullRequestTitle = pullRequestTitle
        self.pullRequestBody = pullRequestBody
        self.draftPullRequest = draftPullRequest
    }
}
