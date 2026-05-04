import Foundation
import SwiftUI

@MainActor
final class TeamOSWorkspaceModel: ObservableObject {
    @Published var repositoryOwner = "team-os"
    @Published var repositoryName = "blank-slate"
    @Published var accessToken = ""
    @Published var accessStatus: RepoAccessStatus = .notConfigured
    @Published var accessSummary = "Enter a repository and GitHub token to check native write readiness."
    @Published var presentMarkers: [String] = []
    @Published var isCheckingAccess = false
    @Published var selectedCardID: String?
    @Published var cards: [TeamOSCard] = TeamOSSampleData.cards
    @Published var validationOutcome: ValidationOutcome = TeamOSSampleData.validationOutcome
    @Published var pullRequestState: PullRequestState? = TeamOSSampleData.pullRequestState
    @Published var branchSession: BranchSession

    init() {
        let repository = RepoDescriptor(owner: "team-os", name: "blank-slate")
        branchSession = BranchSessionManager().startSession(
            repository: repository,
            user: "matt",
            date: Date(timeIntervalSince1970: 1_777_925_200),
            slug: "family-preferences-quiz",
            existingPullRequest: TeamOSSampleData.pullRequestState
        )
        selectedCardID = cards.first?.id
    }

    var selectedCard: TeamOSCard? {
        cards.first { $0.id == selectedCardID } ?? cards.first
    }

    func checkAccess() {
        guard !repositoryOwner.isEmpty, !repositoryName.isEmpty else {
            accessStatus = .notConfigured
            accessSummary = "Choose a GitHub owner and repository first."
            presentMarkers = []
            return
        }
        guard !accessToken.isEmpty else {
            accessStatus = .authRequired
            accessSummary = "Provide a GitHub token before checking native write readiness."
            presentMarkers = []
            return
        }

        let repository = RepoDescriptor(owner: repositoryOwner, name: repositoryName)
        branchSession = BranchSessionManager().startSession(
            repository: repository,
            user: "codex",
            date: Date(),
            slug: selectedCard?.id.lowercased() ?? "team-os"
        )
        accessStatus = .checking
        accessSummary = "Checking repository access and Team OS markers..."
        isCheckingAccess = true

        Task {
            let service = LiveGitHubService(
                client: GitHubRESTClient(
                    tokenProvider: StaticGitHubTokenProvider(value: accessToken)
                )
            )

            do {
                let context = try await service.accessContext(for: repository)
                let status = RepoAccessGate().evaluate(context)
                accessStatus = status
                presentMarkers = context.presentMarkers
                accessSummary = Self.statusSummary(for: status, markers: context.presentMarkers)
            } catch GitHubServiceError.authenticationRequired {
                accessStatus = .authRequired
                presentMarkers = []
                accessSummary = "GitHub rejected the token. Check the token value and repository scope."
            } catch let error as GitHubServiceError {
                accessStatus = .invalidRepo
                presentMarkers = []
                accessSummary = "GitHub service error: \(describe(error))"
            } catch {
                accessStatus = .invalidRepo
                presentMarkers = []
                accessSummary = "Unexpected error: \(error.localizedDescription)"
            }

            isCheckingAccess = false
        }
    }

    private static func statusSummary(for status: RepoAccessStatus, markers: [String]) -> String {
        switch status {
        case .notConfigured:
            return "Choose a repository before enabling writes."
        case .authRequired:
            return "Authentication is required before the app can inspect repository access."
        case .checking:
            return "Checking repository access..."
        case .readOnly:
            return "Repository access is read-only. Native edits stay disabled."
        case .writeReady:
            return "Repository access is write-ready. Team OS markers found: \(markers.joined(separator: ", "))."
        case .invalidRepo:
            return "The repository could not be found."
        case let .missingTeamOSMarkers(missing):
            return "The repository is missing Team OS markers: \(missing.joined(separator: ", "))."
        case let .insufficientPermissions(missing):
            return "The repository is missing write capabilities: \(missing.joined(separator: ", "))."
        }
    }
}

private func describe(_ error: GitHubServiceError) -> String {
    switch error {
    case let .notConfigured(message):
        return message
    case let .writeAccessRequired(status):
        return "Write access required for status \(status)."
    case .authenticationRequired:
        return "Authentication required."
    case let .repositoryNotFound(message):
        return "Repository not found. \(message)"
    case let .invalidResponse(message):
        return "Invalid response. \(message)"
    case let .decoding(message):
        return "Decoding failed. \(message)"
    case let .requestFailed(status, message):
        return "Request failed with status \(status). \(message)"
    case let .missingDefaultBranchReference(branch):
        return "Missing default branch reference for \(branch)."
    case let .missingFileContents(path):
        return "Missing file contents for \(path)."
    }
}
