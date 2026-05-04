import XCTest

@testable import TeamOSCore

final class RepoAccessGateTests: XCTestCase {
    private let repository = RepoDescriptor(owner: "team-os", name: "blank-slate")
    private let fullPermissions = RepoPermissionSet(
        canRead: true,
        canWriteContents: true,
        canWriteBranches: true,
        canWritePullRequests: true
    )

    func testNotConfigured() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: nil,
                isAuthenticated: false,
                repositoryExists: false,
                permissions: fullPermissions,
                presentMarkers: []
            )
        )
        XCTAssertEqual(status, .notConfigured)
    }

    func testAuthRequired() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: repository,
                isAuthenticated: false,
                repositoryExists: true,
                permissions: fullPermissions,
                presentMarkers: TeamOSMarkers.requiredPaths
            )
        )
        XCTAssertEqual(status, .authRequired)
    }

    func testChecking() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: repository,
                isAuthenticated: true,
                isChecking: true,
                repositoryExists: true,
                permissions: fullPermissions,
                presentMarkers: TeamOSMarkers.requiredPaths
            )
        )
        XCTAssertEqual(status, .checking)
    }

    func testInvalidRepo() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: repository,
                isAuthenticated: true,
                repositoryExists: false,
                permissions: fullPermissions,
                presentMarkers: []
            )
        )
        XCTAssertEqual(status, .invalidRepo)
    }

    func testReadOnly() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: repository,
                isAuthenticated: true,
                repositoryExists: true,
                permissions: RepoPermissionSet(
                    canRead: false,
                    canWriteContents: false,
                    canWriteBranches: false,
                    canWritePullRequests: false
                ),
                presentMarkers: TeamOSMarkers.requiredPaths
            )
        )
        XCTAssertEqual(status, .readOnly)
    }

    func testMissingMarkers() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: repository,
                isAuthenticated: true,
                repositoryExists: true,
                permissions: fullPermissions,
                presentMarkers: ["AGENTS.md"]
            )
        )
        XCTAssertEqual(status, .missingTeamOSMarkers(["kanban/AGENTS.md", "kanban/boards", "kanban/cards"]))
    }

    func testInsufficientPermissions() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: repository,
                isAuthenticated: true,
                repositoryExists: true,
                permissions: RepoPermissionSet(
                    canRead: true,
                    canWriteContents: true,
                    canWriteBranches: false,
                    canWritePullRequests: false
                ),
                presentMarkers: TeamOSMarkers.requiredPaths
            )
        )
        XCTAssertEqual(status, .insufficientPermissions(["branches", "pull-requests"]))
    }

    func testWriteReady() {
        let gate = RepoAccessGate()
        let status = gate.evaluate(
            RepoAccessContext(
                repository: repository,
                isAuthenticated: true,
                repositoryExists: true,
                permissions: fullPermissions,
                presentMarkers: TeamOSMarkers.requiredPaths
            )
        )
        XCTAssertEqual(status, .writeReady)
    }
}
