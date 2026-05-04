import Foundation

public struct StaticGitHubTokenProvider: GitHubTokenProviding {
    private let value: String

    public init(value: String) {
        self.value = value
    }

    public func token() async throws -> String {
        value
    }
}

public struct PlaceholderGitHubAuthenticator: GitHubAuthenticating {
    public init() {}

    public func authenticate() async throws -> GitHubViewer {
        throw GitHubServiceError.notConfigured("Configure GitHub authentication before enabling native writes.")
    }
}

public struct PlaceholderGitHubRepositoryChecker: GitHubRepositoryChecking {
    public init() {}

    public func accessContext(for repository: RepoDescriptor) async throws -> RepoAccessContext {
        throw GitHubServiceError.notConfigured("Configure repository access checks for \(repository.owner)/\(repository.name).")
    }
}

public struct PlaceholderGitHubBranchWriter: GitHubBranchWriting {
    public init() {}

    public func ensureBranch(for repository: RepoDescriptor, session: BranchSession) async throws -> BranchSession {
        throw GitHubServiceError.notConfigured("Configure branch writes before using \(repository.owner)/\(repository.name).")
    }

    public func apply(plan: MutationPlan, in repository: RepoDescriptor, on branch: BranchSession) async throws -> GitHubAppliedMutation {
        throw GitHubServiceError.notConfigured("Configure branch writes before applying \(plan.kind.rawValue) in \(repository.owner)/\(repository.name).")
    }
}

public struct PlaceholderGitHubPullRequestManager: GitHubPullRequestManaging {
    public init() {}

    public func upsertPullRequest(
        for repository: RepoDescriptor,
        branch: BranchSession,
        plan: MutationPlan
    ) async throws -> PullRequestState {
        throw GitHubServiceError.notConfigured("Configure pull request writes before applying \(plan.kind.rawValue) in \(repository.owner)/\(repository.name).")
    }
}
