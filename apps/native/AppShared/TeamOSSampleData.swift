import Foundation

enum TeamOSSampleData {
    static let cards: [TeamOSCard] = [
        TeamOSCard(
            id: "KAN-2026-0001",
            title: "Family preferences quiz",
            type: "feature",
            board: "product-dev",
            status: "discovery",
            priority: "high",
            owner: "matt",
            assignees: ["product", "analytics"],
            reviewers: ["engineering"],
            watchers: ["matt"],
            collaborators: ["design"],
            sittingWith: "analytics",
            sittingReason: "Waiting on a baseline funnel read before definition work starts.",
            sittingSince: "2026-05-04T11:02:10Z",
            sittingExpectedAction: "Attach funnel baseline findings.",
            summary: "Add a short intake quiz that tunes downstream family recommendations.",
            artifacts: [
                TeamOSArtifactLink(type: "prd", label: "Family preferences quiz PRD", path: "product-development/product/PRDs/family-preferences-quiz.md")
            ]
        ),
        TeamOSCard(
            id: "KAN-2026-0002",
            title: "Allergy filter mismatch",
            type: "bug",
            board: "bugs",
            status: "blocked",
            priority: "urgent",
            owner: "matt",
            assignees: ["backend-eng"],
            reviewers: ["qa"],
            watchers: ["support"],
            collaborators: ["ops"],
            sittingWith: "backend-eng",
            sittingReason: "Waiting for provider-side logs.",
            sittingSince: "2026-05-04T10:45:00Z",
            sittingExpectedAction: "Capture provider samples and update the investigation.",
            summary: "The UI and scoring service disagree about allergy exclusions.",
            artifacts: [
                TeamOSArtifactLink(type: "bug-investigation", label: "Investigation", path: "product-development/engineering/bug-investigations/allergy-filter-mismatch.md")
            ]
        )
    ]

    static let validationOutcome = ValidationOutcome(
        errors: [],
        reportPath: "kanban/views/validation-errors.md"
    )

    static let pullRequestState = PullRequestState(
        number: 42,
        url: "https://github.com/team-os/blank-slate/pull/42",
        isDraft: true,
        headBranch: "teamos/matt/2026-05-04/family-preferences-quiz"
    )
}
