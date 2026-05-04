import Foundation

public struct MutationPlanner: Sendable {
    public init() {}

    public func createCardPlan(
        cardID: String,
        title: String,
        cardContents: String,
        createdEventContents: String,
        featureIndexContents: String? = nil,
        accessStatus: RepoAccessStatus
    ) throws -> MutationPlan {
        try requireWriteReady(accessStatus)
        let changedFiles = [
            MutationFileChange(path: "kanban/cards/\(cardID)/card.md", reason: "Create card"),
            MutationFileChange(path: eventPath(cardID: cardID, timestamp: "2026-05-04T09:12:33Z", suffix: "created"), reason: "Append created event"),
            MutationFileChange(path: "product-development/feature-index.yaml", reason: "Index durable artifact links"),
        ] + generatedViewChanges()
        var fileWrites = [
            PlannedFileWrite(path: "kanban/cards/\(cardID)/card.md", contents: cardContents),
            PlannedFileWrite(
                path: eventPath(cardID: cardID, timestamp: "2026-05-04T09:12:33Z", suffix: "created"),
                contents: createdEventContents
            ),
        ]
        if let featureIndexContents {
            fileWrites.append(PlannedFileWrite(path: "product-development/feature-index.yaml", contents: featureIndexContents))
        }
        return makePlan(
            kind: .createCard,
            cardID: cardID,
            changedFiles: changedFiles,
            fileWrites: fileWrites,
            title: "Create \(cardID) \(title)"
        )
    }

    public func moveCardPlan(
        cardID: String,
        toStatus: String,
        timestamp: String,
        updatedCardContents: String,
        statusEventContents: String,
        accessStatus: RepoAccessStatus
    ) throws -> MutationPlan {
        try requireWriteReady(accessStatus)
        let changedFiles = [
            MutationFileChange(path: "kanban/cards/\(cardID)/card.md", reason: "Update current status"),
            MutationFileChange(path: eventPath(cardID: cardID, timestamp: timestamp, suffix: "status-changed"), reason: "Append status event"),
        ] + generatedViewChanges()
        let fileWrites = [
            PlannedFileWrite(path: "kanban/cards/\(cardID)/card.md", contents: updatedCardContents),
            PlannedFileWrite(
                path: eventPath(cardID: cardID, timestamp: timestamp, suffix: "status-changed"),
                contents: statusEventContents
            ),
        ]
        return makePlan(
            kind: .moveCard,
            cardID: cardID,
            changedFiles: changedFiles,
            fileWrites: fileWrites,
            title: "Move \(cardID) to \(toStatus)"
        )
    }

    public func addCommentPlan(
        cardID: String,
        author: String,
        timestamp: String,
        commentContents: String,
        accessStatus: RepoAccessStatus
    ) throws -> MutationPlan {
        try requireWriteReady(accessStatus)
        let changedFiles = [
            MutationFileChange(path: commentPath(cardID: cardID, timestamp: timestamp, author: author), reason: "Append comment"),
        ] + generatedViewChanges()
        let fileWrites = [
            PlannedFileWrite(
                path: commentPath(cardID: cardID, timestamp: timestamp, author: author),
                contents: commentContents
            ),
        ]
        return makePlan(
            kind: .addComment,
            cardID: cardID,
            changedFiles: changedFiles,
            fileWrites: fileWrites,
            title: "Add comment to \(cardID)"
        )
    }

    public func linkArtifactPlan(
        cardID: String,
        artifactPath: String,
        timestamp: String,
        updatedCardContents: String,
        artifactEventContents: String,
        featureIndexContents: String? = nil,
        accessStatus: RepoAccessStatus
    ) throws -> MutationPlan {
        try requireWriteReady(accessStatus)
        let changedFiles = [
            MutationFileChange(path: "kanban/cards/\(cardID)/card.md", reason: "Link new artifact"),
            MutationFileChange(path: eventPath(cardID: cardID, timestamp: timestamp, suffix: "artifact-linked"), reason: "Append artifact-linked event"),
            MutationFileChange(path: "product-development/feature-index.yaml", reason: "Keep artifact index in sync"),
            MutationFileChange(path: artifactPath, reason: "Artifact was linked from the card"),
        ] + generatedViewChanges()
        var fileWrites = [
            PlannedFileWrite(path: "kanban/cards/\(cardID)/card.md", contents: updatedCardContents),
            PlannedFileWrite(
                path: eventPath(cardID: cardID, timestamp: timestamp, suffix: "artifact-linked"),
                contents: artifactEventContents
            ),
        ]
        if let featureIndexContents {
            fileWrites.append(PlannedFileWrite(path: "product-development/feature-index.yaml", contents: featureIndexContents))
        }
        return makePlan(
            kind: .linkArtifact,
            cardID: cardID,
            changedFiles: changedFiles,
            fileWrites: fileWrites,
            title: "Link artifact for \(cardID)"
        )
    }

    public func changeParticipantsPlan(
        cardID: String,
        updatedCardContents: String,
        auditEventContents: String,
        accessStatus: RepoAccessStatus
    ) throws -> MutationPlan {
        try requireWriteReady(accessStatus)
        let changedFiles = [
            MutationFileChange(path: "kanban/cards/\(cardID)/card.md", reason: "Update owner or participant fields"),
            MutationFileChange(path: eventPath(cardID: cardID, timestamp: "2026-05-04T10:18:00Z", suffix: "status-changed"), reason: "Append audit history"),
        ] + generatedViewChanges()
        let fileWrites = [
            PlannedFileWrite(path: "kanban/cards/\(cardID)/card.md", contents: updatedCardContents),
            PlannedFileWrite(
                path: eventPath(cardID: cardID, timestamp: "2026-05-04T10:18:00Z", suffix: "status-changed"),
                contents: auditEventContents
            ),
        ]
        return makePlan(
            kind: .changeParticipants,
            cardID: cardID,
            changedFiles: changedFiles,
            fileWrites: fileWrites,
            title: "Update participants for \(cardID)"
        )
    }

    public func changeSittingWithPlan(
        cardID: String,
        sittingWith: String,
        timestamp: String,
        updatedCardContents: String,
        sittingWithEventContents: String,
        accessStatus: RepoAccessStatus
    ) throws -> MutationPlan {
        try requireWriteReady(accessStatus)
        let changedFiles = [
            MutationFileChange(path: "kanban/cards/\(cardID)/card.md", reason: "Update current sitting_with state"),
            MutationFileChange(path: eventPath(cardID: cardID, timestamp: timestamp, suffix: "sitting-with-changed"), reason: "Append sitting-with event"),
        ] + generatedViewChanges()
        let fileWrites = [
            PlannedFileWrite(path: "kanban/cards/\(cardID)/card.md", contents: updatedCardContents),
            PlannedFileWrite(
                path: eventPath(cardID: cardID, timestamp: timestamp, suffix: "sitting-with-changed"),
                contents: sittingWithEventContents
            ),
        ]
        return makePlan(
            kind: .changeSittingWith,
            cardID: cardID,
            changedFiles: changedFiles,
            fileWrites: fileWrites,
            title: "Change sitting_with for \(cardID) to \(sittingWith)"
        )
    }

    private func requireWriteReady(_ status: RepoAccessStatus) throws {
        guard status == .writeReady else {
            throw GitHubServiceError.writeAccessRequired(status)
        }
    }

    private func makePlan(
        kind: MutationPlanKind,
        cardID: String,
        changedFiles: [MutationFileChange],
        fileWrites: [PlannedFileWrite],
        title: String
    ) -> MutationPlan {
        let commitMessage = "\(title)\n\nAI-Model: gpt-5.4"
        let body = [
            "## Summary",
            "- update \(cardID)",
            "- regenerate Team OS views",
            "",
            "## Changed files",
        ] + changedFiles.map { "- \($0.path) — \($0.reason)" }
        return MutationPlan(
            kind: kind,
            cardID: cardID,
            changedFiles: changedFiles,
            fileWrites: fileWrites,
            commitMessage: commitMessage,
            pullRequestTitle: title,
            pullRequestBody: body.joined(separator: "\n")
        )
    }

    private func eventPath(cardID: String, timestamp: String, suffix: String) -> String {
        "kanban/cards/\(cardID)/events/\(fileSafe(timestamp))-\(suffix).yaml"
    }

    private func commentPath(cardID: String, timestamp: String, author: String) -> String {
        "kanban/cards/\(cardID)/comments/\(fileSafe(timestamp))-\(author.lowercased()).md"
    }

    private func generatedViewChanges() -> [MutationFileChange] {
        [
            "kanban/views/product-dev.md",
            "kanban/views/bugs.md",
            "kanban/views/launch.md",
            "kanban/views/blocked.md",
            "kanban/views/sitting-with.md",
            "kanban/views/recently-moved.md",
            "kanban/views/stale-cards.md",
            "kanban/views/shipped-this-week.md",
            "kanban/views/by-owner.md",
            "kanban/views/validation-errors.md",
        ].map { MutationFileChange(path: $0, reason: "Regenerate derived Team OS view") }
    }

    private func fileSafe(_ timestamp: String) -> String {
        timestamp.replacingOccurrences(of: ":", with: "-")
    }
}
