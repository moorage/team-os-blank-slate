import Foundation

public struct RepoAccessGate: Sendable {
    public init() {}

    public func evaluate(_ context: RepoAccessContext) -> RepoAccessStatus {
        guard context.repository != nil else {
            return .notConfigured
        }
        if context.isChecking {
            return .checking
        }
        if !context.isAuthenticated {
            return .authRequired
        }
        if !context.repositoryExists {
            return .invalidRepo
        }
        if !context.permissions.canRead {
            return .readOnly
        }
        let missingMarkers = TeamOSMarkers.requiredPaths.filter { !context.presentMarkers.contains($0) }
        if !missingMarkers.isEmpty {
            return .missingTeamOSMarkers(missingMarkers)
        }
        let missingPermissions = context.permissions.missingWriteCapabilities
        if !missingPermissions.isEmpty {
            return .insufficientPermissions(missingPermissions)
        }
        return .writeReady
    }
}
