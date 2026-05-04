import Foundation

public struct GitHubViewer: Codable, Equatable, Sendable {
    public let login: String
    public let id: Int

    public init(login: String, id: Int) {
        self.login = login
        self.id = id
    }
}

public protocol GitHubTokenProviding: Sendable {
    func token() async throws -> String
}

public protocol GitHubAuthenticating: Sendable {
    func authenticate() async throws -> GitHubViewer
}

public protocol GitHubRepositoryChecking: Sendable {
    func accessContext(for repository: RepoDescriptor) async throws -> RepoAccessContext
}

public extension GitHubRepositoryChecking {
    func accessStatus(
        for repository: RepoDescriptor,
        gate: RepoAccessGate = RepoAccessGate()
    ) async throws -> RepoAccessStatus {
        gate.evaluate(try await accessContext(for: repository))
    }
}

public protocol GitHubBranchWriting: Sendable {
    func ensureBranch(for repository: RepoDescriptor, session: BranchSession) async throws -> BranchSession
    func apply(plan: MutationPlan, in repository: RepoDescriptor, on branch: BranchSession) async throws -> GitHubAppliedMutation
}

public protocol GitHubPullRequestManaging: Sendable {
    func upsertPullRequest(
        for repository: RepoDescriptor,
        branch: BranchSession,
        plan: MutationPlan
    ) async throws -> PullRequestState
}

public protocol TeamOSLoading: Sendable {
    func loadRepository(at rootPath: String) async throws -> TeamOSSnapshot
}

public protocol TeamOSValidating: Sendable {
    func validateRepository(at rootPath: String) async throws -> ValidationOutcome
}

public protocol TeamOSRendering: Sendable {
    func renderRepository(at rootPath: String) async throws
}

public struct GitHubAppliedMutation: Equatable, Sendable {
    public let branchName: String
    public let committedPaths: [String]

    public init(branchName: String, committedPaths: [String]) {
        self.branchName = branchName
        self.committedPaths = committedPaths
    }
}

public enum GitHubServiceError: Error, Equatable, Sendable {
    case notConfigured(String)
    case writeAccessRequired(RepoAccessStatus)
    case authenticationRequired
    case repositoryNotFound(String)
    case invalidResponse(String)
    case decoding(String)
    case requestFailed(status: Int, message: String)
    case missingDefaultBranchReference(String)
    case missingFileContents(String)
}
