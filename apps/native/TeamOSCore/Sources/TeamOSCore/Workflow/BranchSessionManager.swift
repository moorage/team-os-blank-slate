import Foundation

public struct BranchSessionManager: Sendable {
    public init() {}

    public func branchName(for user: String, date: Date, slug: String) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        let day = formatter.string(from: date)
        return "teamos/\(sanitize(user))/\(day)/\(sanitize(slug))"
    }

    public func startSession(
        repository: RepoDescriptor,
        user: String,
        date: Date,
        slug: String,
        existingPullRequest: PullRequestState? = nil
    ) -> BranchSession {
        let createdAt = ISO8601DateFormatter().string(from: date)
        return BranchSession(
            repository: repository,
            branchName: branchName(for: user, date: date, slug: slug),
            baseBranch: repository.defaultBranch,
            createdAt: createdAt,
            pullRequest: existingPullRequest
        )
    }

    private func sanitize(_ value: String) -> String {
        let lowered = value.lowercased()
        let components = lowered.split(whereSeparator: { !$0.isLetter && !$0.isNumber })
        return components.joined(separator: "-")
    }
}
