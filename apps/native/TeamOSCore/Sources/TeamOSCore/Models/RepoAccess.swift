import Foundation

public struct RepoDescriptor: Equatable, Sendable {
    public let owner: String
    public let name: String
    public let defaultBranch: String

    public init(owner: String, name: String, defaultBranch: String = "main") {
        self.owner = owner
        self.name = name
        self.defaultBranch = defaultBranch
    }
}

public struct RepoPermissionSet: Equatable, Sendable {
    public let canRead: Bool
    public let canWriteContents: Bool
    public let canWriteBranches: Bool
    public let canWritePullRequests: Bool

    public init(
        canRead: Bool,
        canWriteContents: Bool,
        canWriteBranches: Bool,
        canWritePullRequests: Bool
    ) {
        self.canRead = canRead
        self.canWriteContents = canWriteContents
        self.canWriteBranches = canWriteBranches
        self.canWritePullRequests = canWritePullRequests
    }

    public var missingWriteCapabilities: [String] {
        var missing: [String] = []
        if !canWriteContents { missing.append("contents") }
        if !canWriteBranches { missing.append("branches") }
        if !canWritePullRequests { missing.append("pull-requests") }
        return missing
    }
}

public enum RepoAccessStatus: Equatable, Sendable {
    case notConfigured
    case authRequired
    case checking
    case readOnly
    case writeReady
    case invalidRepo
    case missingTeamOSMarkers([String])
    case insufficientPermissions([String])
}

public struct RepoAccessContext: Equatable, Sendable {
    public let repository: RepoDescriptor?
    public let isAuthenticated: Bool
    public let isChecking: Bool
    public let repositoryExists: Bool
    public let permissions: RepoPermissionSet
    public let presentMarkers: [String]

    public init(
        repository: RepoDescriptor?,
        isAuthenticated: Bool,
        isChecking: Bool = false,
        repositoryExists: Bool,
        permissions: RepoPermissionSet,
        presentMarkers: [String]
    ) {
        self.repository = repository
        self.isAuthenticated = isAuthenticated
        self.isChecking = isChecking
        self.repositoryExists = repositoryExists
        self.permissions = permissions
        self.presentMarkers = presentMarkers
    }
}
